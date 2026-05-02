
-- ============== ENUMS ==============
DO $$ BEGIN
  CREATE TYPE public.shared_goal_role AS ENUM ('admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.shared_request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============== TABLES ==============
CREATE TABLE public.shared_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric NOT NULL DEFAULT 0,
  preset_key text NOT NULL DEFAULT 'other',
  invite_code text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.shared_goal_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_goal_id uuid NOT NULL REFERENCES public.shared_goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.shared_goal_role NOT NULL DEFAULT 'member',
  total_contributed numeric NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shared_goal_id, user_id)
);

CREATE TABLE public.shared_goal_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_goal_id uuid NOT NULL REFERENCES public.shared_goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status public.shared_request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid
);
CREATE UNIQUE INDEX shared_goal_join_requests_pending_uniq
  ON public.shared_goal_join_requests (shared_goal_id, user_id)
  WHERE status = 'pending';

CREATE TABLE public.shared_goal_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_goal_id uuid NOT NULL REFERENCES public.shared_goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  status public.shared_request_status NOT NULL DEFAULT 'pending',
  transaction_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid
);

ALTER TABLE public.manual_transactions
  ADD COLUMN IF NOT EXISTS shared_goal_id uuid;

CREATE INDEX IF NOT EXISTS idx_shared_goal_members_user ON public.shared_goal_members(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_goal_members_goal ON public.shared_goal_members(shared_goal_id);
CREATE INDEX IF NOT EXISTS idx_shared_goal_contrib_goal ON public.shared_goal_contributions(shared_goal_id);
CREATE INDEX IF NOT EXISTS idx_shared_goal_join_goal ON public.shared_goal_join_requests(shared_goal_id);

-- ============== SECURITY DEFINER HELPERS ==============
CREATE OR REPLACE FUNCTION public.is_shared_goal_member(_goal uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shared_goal_members
    WHERE shared_goal_id = _goal AND user_id = _user
  );
$$;

CREATE OR REPLACE FUNCTION public.is_shared_goal_admin(_goal uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shared_goal_members
    WHERE shared_goal_id = _goal AND user_id = _user AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.gen_invite_code()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
  exists_count int;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    SELECT count(*) INTO exists_count FROM public.shared_goals WHERE invite_code = code;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN code;
END;
$$;

-- Public lookup by code (returns minimal info)
CREATE OR REPLACE FUNCTION public.find_shared_goal_by_code(_code text)
RETURNS TABLE (
  id uuid,
  name text,
  preset_key text,
  target_amount numeric,
  current_amount numeric,
  member_count bigint,
  is_completed boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT g.id, g.name, g.preset_key, g.target_amount, g.current_amount,
         (SELECT count(*) FROM public.shared_goal_members m WHERE m.shared_goal_id = g.id),
         g.is_completed
  FROM public.shared_goals g
  WHERE g.invite_code = upper(_code)
  LIMIT 1;
$$;

-- ============== TRIGGERS ==============
CREATE OR REPLACE FUNCTION public.validate_shared_goal()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.target_amount IS NULL OR NEW.target_amount <= 0 THEN
    RAISE EXCEPTION 'target_amount deve ser maior que zero';
  END IF;
  IF NEW.current_amount IS NULL OR NEW.current_amount < 0 THEN
    NEW.current_amount := 0;
  END IF;
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := public.gen_invite_code();
  ELSE
    NEW.invite_code := upper(NEW.invite_code);
  END IF;
  IF NEW.current_amount >= NEW.target_amount THEN
    NEW.is_completed := true;
    IF NEW.completed_at IS NULL THEN NEW.completed_at := now(); END IF;
  ELSE
    NEW.is_completed := false;
    NEW.completed_at := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_shared_goal
  BEFORE INSERT OR UPDATE ON public.shared_goals
  FOR EACH ROW EXECUTE FUNCTION public.validate_shared_goal();

CREATE OR REPLACE FUNCTION public.on_shared_goal_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.shared_goal_members (shared_goal_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_shared_goal_created
  AFTER INSERT ON public.shared_goals
  FOR EACH ROW EXECUTE FUNCTION public.on_shared_goal_created();

-- ============== RLS ==============
ALTER TABLE public.shared_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_goal_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_goal_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_goal_contributions ENABLE ROW LEVEL SECURITY;

-- shared_goals
CREATE POLICY "Members can view shared goals"
  ON public.shared_goals FOR SELECT TO authenticated
  USING (public.is_shared_goal_member(id, auth.uid()));

CREATE POLICY "Users can create shared goals"
  ON public.shared_goals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update shared goals"
  ON public.shared_goals FOR UPDATE TO authenticated
  USING (public.is_shared_goal_admin(id, auth.uid()));

CREATE POLICY "Admins can delete shared goals"
  ON public.shared_goals FOR DELETE TO authenticated
  USING (public.is_shared_goal_admin(id, auth.uid()));

-- shared_goal_members
CREATE POLICY "Members can view members of their goals"
  ON public.shared_goal_members FOR SELECT TO authenticated
  USING (public.is_shared_goal_member(shared_goal_id, auth.uid()));

CREATE POLICY "Self or admin can insert members"
  ON public.shared_goal_members FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_shared_goal_admin(shared_goal_id, auth.uid())
  );

CREATE POLICY "Admins can update members"
  ON public.shared_goal_members FOR UPDATE TO authenticated
  USING (public.is_shared_goal_admin(shared_goal_id, auth.uid()));

CREATE POLICY "Admins or self can remove member"
  ON public.shared_goal_members FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_shared_goal_admin(shared_goal_id, auth.uid())
  );

-- shared_goal_join_requests
CREATE POLICY "View own or admin requests"
  ON public.shared_goal_join_requests FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_shared_goal_admin(shared_goal_id, auth.uid())
  );

CREATE POLICY "User creates own join request"
  ON public.shared_goal_join_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update join requests"
  ON public.shared_goal_join_requests FOR UPDATE TO authenticated
  USING (public.is_shared_goal_admin(shared_goal_id, auth.uid()));

CREATE POLICY "Self or admin delete request"
  ON public.shared_goal_join_requests FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_shared_goal_admin(shared_goal_id, auth.uid())
  );

-- shared_goal_contributions
CREATE POLICY "Members view contributions"
  ON public.shared_goal_contributions FOR SELECT TO authenticated
  USING (public.is_shared_goal_member(shared_goal_id, auth.uid()));

CREATE POLICY "Members create own contribution"
  ON public.shared_goal_contributions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_shared_goal_member(shared_goal_id, auth.uid())
  );

CREATE POLICY "Admins update contributions"
  ON public.shared_goal_contributions FOR UPDATE TO authenticated
  USING (public.is_shared_goal_admin(shared_goal_id, auth.uid()));

CREATE POLICY "Self pending or admin delete contribution"
  ON public.shared_goal_contributions FOR DELETE TO authenticated
  USING (
    (auth.uid() = user_id AND status = 'pending')
    OR public.is_shared_goal_admin(shared_goal_id, auth.uid())
  );
