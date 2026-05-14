
-- Support ticket system
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'awaiting_admin',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  attachments jsonb,
  is_faq_candidate boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_tickets_category_check CHECK (category IN ('technical','financial','account','company','harp','suggestion','other')),
  CONSTRAINT support_tickets_priority_check CHECK (priority IN ('low','normal','high','urgent')),
  CONSTRAINT support_tickets_status_check CHECK (status IN ('open','awaiting_user','awaiting_admin','resolved','closed'))
);

CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id, last_message_at DESC);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status, last_message_at DESC);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tickets" ON public.support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own tickets" ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own or admin" ON public.support_tickets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete tickets" ON public.support_tickets FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('user','admin')),
  message text NOT NULL,
  attachments jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_messages_ticket ON public.support_messages(ticket_id, created_at);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View messages of own tickets" ON public.support_messages FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Insert messages on accessible tickets" ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND (
      (sender_role = 'admin' AND public.has_role(auth.uid(), 'admin')) OR
      (sender_role = 'user' AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()))
    )
  );

-- Trigger: update last_message_at and status on new message
CREATE OR REPLACE FUNCTION public.support_on_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.support_tickets
    SET last_message_at = NEW.created_at,
        updated_at = now(),
        status = CASE
          WHEN status IN ('resolved','closed') THEN status
          WHEN NEW.sender_role = 'user' THEN 'awaiting_admin'
          ELSE 'awaiting_user'
        END
    WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_support_on_new_message
AFTER INSERT ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.support_on_new_message();

-- Trigger: auto-priority on ticket creation
CREATE OR REPLACE FUNCTION public.support_set_priority()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.priority IS NULL OR NEW.priority = 'normal' THEN
    NEW.priority := CASE NEW.category
      WHEN 'financial' THEN 'high'
      WHEN 'account' THEN 'high'
      WHEN 'technical' THEN 'normal'
      WHEN 'suggestion' THEN 'low'
      ELSE 'normal'
    END;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_support_set_priority
BEFORE INSERT OR UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.support_set_priority();
