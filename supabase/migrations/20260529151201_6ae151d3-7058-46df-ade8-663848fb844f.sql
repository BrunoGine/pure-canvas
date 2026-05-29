
-- 1. notification_devices
CREATE TABLE public.notification_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider IN ('web_push','fcm','apns','onesignal')),
  token text NOT NULL,
  p256dh text,
  auth text,
  platform text NOT NULL DEFAULT 'web' CHECK (platform IN ('web','android','ios')),
  user_agent text,
  enabled boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);
CREATE INDEX idx_notif_devices_user ON public.notification_devices(user_id) WHERE enabled = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_devices TO authenticated;
GRANT ALL ON public.notification_devices TO service_role;

ALTER TABLE public.notification_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own devices" ON public.notification_devices
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own devices" ON public.notification_devices
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own devices" ON public.notification_devices
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
-- INSERT only via RPC

-- 2. notification_preferences
CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY,
  master_enabled boolean NOT NULL DEFAULT true,
  financial boolean NOT NULL DEFAULT true,
  goals boolean NOT NULL DEFAULT true,
  courses boolean NOT NULL DEFAULT true,
  streak boolean NOT NULL DEFAULT true,
  harpia boolean NOT NULL DEFAULT true,
  business boolean NOT NULL DEFAULT true,
  shared_goals boolean NOT NULL DEFAULT true,
  security boolean NOT NULL DEFAULT true,
  marketing boolean NOT NULL DEFAULT false,
  quiet_hours_start smallint NOT NULL DEFAULT 22 CHECK (quiet_hours_start BETWEEN 0 AND 23),
  quiet_hours_end smallint NOT NULL DEFAULT 8 CHECK (quiet_hours_end BETWEEN 0 AND 23),
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own prefs" ON public.notification_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own prefs" ON public.notification_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own prefs" ON public.notification_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER tg_notification_prefs_touch
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.touch_privacy_updated_at();

-- 3. notification_logs
CREATE TABLE public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  dedupe_key text,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL CHECK (status IN ('sent','skipped','failed')),
  skip_reason text,
  provider_response jsonb,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_logs_user_cat ON public.notification_logs(user_id, category, sent_at DESC);
CREATE INDEX idx_notif_logs_dedupe ON public.notification_logs(user_id, dedupe_key, sent_at DESC) WHERE dedupe_key IS NOT NULL;

GRANT SELECT ON public.notification_logs TO authenticated;
GRANT ALL ON public.notification_logs TO service_role;

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own logs" ON public.notification_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
-- writes only via service_role / SECURITY DEFINER

-- 4. handle_new_user updated to insert default prefs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');

  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 5. RPC: register_notification_device
CREATE OR REPLACE FUNCTION public.register_notification_device(
  _provider text,
  _token text,
  _p256dh text DEFAULT NULL,
  _auth text DEFAULT NULL,
  _platform text DEFAULT 'web',
  _user_agent text DEFAULT NULL
) RETURNS public.notification_devices
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_row public.notification_devices; v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  INSERT INTO public.notification_devices(user_id, provider, token, p256dh, auth, platform, user_agent)
  VALUES (v_uid, _provider, _token, _p256dh, _auth, _platform, _user_agent)
  ON CONFLICT (user_id, token) DO UPDATE
    SET enabled = true, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth,
        platform = EXCLUDED.platform, user_agent = EXCLUDED.user_agent,
        last_seen_at = now()
  RETURNING * INTO v_row;

  -- Ensure prefs row exists
  INSERT INTO public.notification_preferences(user_id) VALUES (v_uid) ON CONFLICT DO NOTHING;

  RETURN v_row;
END;
$$;

-- 6. RPC: unregister_notification_device
CREATE OR REPLACE FUNCTION public.unregister_notification_device(_token text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  DELETE FROM public.notification_devices
   WHERE user_id = auth.uid() AND token = _token;
END;
$$;

-- 7. RPC: can_send_notification (anti-spam gate)
CREATE OR REPLACE FUNCTION public.can_send_notification(
  _user_id uuid,
  _category text,
  _dedupe_key text DEFAULT NULL,
  _cooldown_minutes integer DEFAULT 60,
  _daily_cap integer DEFAULT 3
) RETURNS TABLE(allowed boolean, reason text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_prefs public.notification_preferences;
  v_now_local time;
  v_cat_enabled boolean;
  v_local_hour int;
  v_in_quiet boolean;
  v_dedupe_count int;
  v_cat_count int;
  v_global_count int;
BEGIN
  SELECT * INTO v_prefs FROM public.notification_preferences WHERE user_id = _user_id;
  IF NOT FOUND THEN
    INSERT INTO public.notification_preferences(user_id) VALUES (_user_id)
    ON CONFLICT DO NOTHING;
    SELECT * INTO v_prefs FROM public.notification_preferences WHERE user_id = _user_id;
  END IF;

  -- security always allowed (only master ignored for security)
  IF _category <> 'security' AND NOT v_prefs.master_enabled THEN
    RETURN QUERY SELECT false, 'master_disabled'; RETURN;
  END IF;

  v_cat_enabled := CASE _category
    WHEN 'financial' THEN v_prefs.financial
    WHEN 'goals' THEN v_prefs.goals
    WHEN 'courses' THEN v_prefs.courses
    WHEN 'streak' THEN v_prefs.streak
    WHEN 'harpia' THEN v_prefs.harpia
    WHEN 'business' THEN v_prefs.business
    WHEN 'shared_goals' THEN v_prefs.shared_goals
    WHEN 'security' THEN true
    WHEN 'marketing' THEN v_prefs.marketing
    ELSE true END;

  IF NOT v_cat_enabled THEN
    RETURN QUERY SELECT false, 'category_disabled'; RETURN;
  END IF;

  -- quiet hours (skip for security)
  IF _category <> 'security' THEN
    v_local_hour := EXTRACT(HOUR FROM (now() AT TIME ZONE v_prefs.timezone))::int;
    IF v_prefs.quiet_hours_start = v_prefs.quiet_hours_end THEN
      v_in_quiet := false;
    ELSIF v_prefs.quiet_hours_start < v_prefs.quiet_hours_end THEN
      v_in_quiet := v_local_hour >= v_prefs.quiet_hours_start AND v_local_hour < v_prefs.quiet_hours_end;
    ELSE
      v_in_quiet := v_local_hour >= v_prefs.quiet_hours_start OR v_local_hour < v_prefs.quiet_hours_end;
    END IF;
    IF v_in_quiet THEN
      RETURN QUERY SELECT false, 'quiet_hours'; RETURN;
    END IF;
  END IF;

  -- dedupe / cooldown
  IF _dedupe_key IS NOT NULL THEN
    SELECT count(*) INTO v_dedupe_count
      FROM public.notification_logs
      WHERE user_id = _user_id AND dedupe_key = _dedupe_key
        AND status = 'sent'
        AND sent_at > now() - make_interval(mins => _cooldown_minutes);
    IF v_dedupe_count > 0 THEN
      RETURN QUERY SELECT false, 'cooldown'; RETURN;
    END IF;
  END IF;

  -- daily category cap
  IF _category <> 'security' AND _daily_cap > 0 THEN
    SELECT count(*) INTO v_cat_count
      FROM public.notification_logs
      WHERE user_id = _user_id AND category = _category
        AND status = 'sent'
        AND sent_at > now() - interval '24 hours';
    IF v_cat_count >= _daily_cap THEN
      RETURN QUERY SELECT false, 'daily_cap_category'; RETURN;
    END IF;

    -- global cap 6/day for non-security
    SELECT count(*) INTO v_global_count
      FROM public.notification_logs
      WHERE user_id = _user_id AND category <> 'security'
        AND status = 'sent'
        AND sent_at > now() - interval '24 hours';
    IF v_global_count >= 6 THEN
      RETURN QUERY SELECT false, 'daily_cap_global'; RETURN;
    END IF;
  END IF;

  RETURN QUERY SELECT true, NULL::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_notification_device(text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unregister_notification_device(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_send_notification(uuid,text,text,integer,integer) TO authenticated, service_role;
