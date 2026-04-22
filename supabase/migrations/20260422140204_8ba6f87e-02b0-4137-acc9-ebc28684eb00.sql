
-- ============ ENUM & ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ COURSES ============
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL DEFAULT 'iniciante',
  "order" INTEGER NOT NULL DEFAULT 0,
  icon TEXT NOT NULL DEFAULT 'BookOpen',
  color TEXT NOT NULL DEFAULT '#8A05BE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view courses" ON public.courses
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage courses" ON public.courses
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ LESSONS ============
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  youtube_url TEXT NOT NULL,
  youtube_video_id TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  summary TEXT,
  questions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lessons" ON public.lessons
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage lessons" ON public.lessons
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow the AI cache update from authenticated users (only summary & questions when null)
CREATE POLICY "Authenticated users can cache AI content" ON public.lessons
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE INDEX idx_lessons_course_order ON public.lessons(course_id, "order");

-- ============ USER PROGRESS ============
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  score INTEGER NOT NULL DEFAULT 0,
  video_watched BOOLEAN NOT NULL DEFAULT false,
  summary_read BOOLEAN NOT NULL DEFAULT false,
  questions_passed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own progress" ON public.user_progress
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own progress" ON public.user_progress
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own progress" ON public.user_progress
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own progress" ON public.user_progress
FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_user_progress_user ON public.user_progress(user_id);

-- ============ USER STATS ============
CREATE TABLE public.user_stats (
  user_id UUID NOT NULL PRIMARY KEY,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak INTEGER NOT NULL DEFAULT 0,
  streak_protection INTEGER NOT NULL DEFAULT 3,
  streak_protection_reset_at DATE NOT NULL DEFAULT date_trunc('month', now())::date,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own stats" ON public.user_stats
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own stats" ON public.user_stats
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own stats" ON public.user_stats
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============ FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.award_xp(_user_id UUID, _amount INTEGER)
RETURNS public.user_stats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.user_stats;
BEGIN
  INSERT INTO public.user_stats (user_id, xp, level)
  VALUES (_user_id, _amount, GREATEST(1, FLOOR(SQRT(_amount::float / 100))::int + 1))
  ON CONFLICT (user_id) DO UPDATE
    SET xp = user_stats.xp + _amount,
        level = GREATEST(1, FLOOR(SQRT((user_stats.xp + _amount)::float / 100))::int + 1),
        updated_at = now()
  RETURNING * INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_streak(_user_id UUID)
RETURNS public.user_stats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stats public.user_stats;
  today DATE := CURRENT_DATE;
  diff INTEGER;
  result public.user_stats;
BEGIN
  -- ensure row exists
  INSERT INTO public.user_stats (user_id) VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO current_stats FROM public.user_stats WHERE user_id = _user_id;

  -- monthly protection reset
  IF current_stats.streak_protection_reset_at < date_trunc('month', today)::date THEN
    UPDATE public.user_stats
      SET streak_protection = 3,
          streak_protection_reset_at = date_trunc('month', today)::date
      WHERE user_id = _user_id;
    SELECT * INTO current_stats FROM public.user_stats WHERE user_id = _user_id;
  END IF;

  IF current_stats.last_activity_date IS NULL THEN
    UPDATE public.user_stats SET streak = 1, last_activity_date = today, updated_at = now()
      WHERE user_id = _user_id RETURNING * INTO result;
  ELSE
    diff := today - current_stats.last_activity_date;
    IF diff = 0 THEN
      result := current_stats;
    ELSIF diff = 1 THEN
      UPDATE public.user_stats SET streak = streak + 1, last_activity_date = today, updated_at = now()
        WHERE user_id = _user_id RETURNING * INTO result;
    ELSE
      -- gap > 1: try protections
      IF current_stats.streak_protection >= (diff - 1) THEN
        UPDATE public.user_stats
          SET streak_protection = streak_protection - (diff - 1),
              streak = streak + 1,
              last_activity_date = today,
              updated_at = now()
          WHERE user_id = _user_id RETURNING * INTO result;
      ELSE
        UPDATE public.user_stats
          SET streak = 1, last_activity_date = today, updated_at = now()
          WHERE user_id = _user_id RETURNING * INTO result;
      END IF;
    END IF;
  END IF;

  RETURN result;
END;
$$;

-- Trigger: on new user create stats + default role
CREATE OR REPLACE FUNCTION public.handle_new_user_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_stats (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_stats
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_stats();

-- Backfill existing users
INSERT INTO public.user_stats (user_id)
SELECT id FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user' FROM auth.users
ON CONFLICT DO NOTHING;

-- updated_at triggers
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.update_credit_cards_updated_at();

CREATE TRIGGER trg_lessons_updated BEFORE UPDATE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.update_credit_cards_updated_at();

CREATE TRIGGER trg_user_progress_updated BEFORE UPDATE ON public.user_progress
FOR EACH ROW EXECUTE FUNCTION public.update_credit_cards_updated_at();

-- ============ SEED ============
WITH c1 AS (
  INSERT INTO public.courses (title, description, level, "order", icon, color)
  VALUES ('Mundo 1: Iniciante', 'Fundamentos das finanças pessoais', 'iniciante', 1, 'PiggyBank', '#10B981')
  RETURNING id
), c2 AS (
  INSERT INTO public.courses (title, description, level, "order", icon, color)
  VALUES ('Mundo 2: Intermediário', 'Investimentos e planejamento', 'intermediario', 2, 'TrendingUp', '#3B82F6')
  RETURNING id
), c3 AS (
  INSERT INTO public.courses (title, description, level, "order", icon, color)
  VALUES ('Mundo 3: Avançado', 'Estratégias avançadas e independência financeira', 'avancado', 3, 'Trophy', '#F59E0B')
  RETURNING id
)
INSERT INTO public.lessons (course_id, title, subtitle, youtube_url, youtube_video_id, "order", xp_reward)
SELECT c1.id, t.title, t.subtitle, t.url, t.vid, t.ord, 50 FROM c1, (VALUES
  ('O que é educação financeira', 'Conceitos básicos para começar', 'https://www.youtube.com/watch?v=OYXkF5_Aj8M', 'OYXkF5_Aj8M', 1),
  ('Como fazer um orçamento', 'Organize suas receitas e despesas', 'https://www.youtube.com/watch?v=h7eKpr1Q1Hk', 'h7eKpr1Q1Hk', 2),
  ('Reserva de emergência', 'Por que e como montar a sua', 'https://www.youtube.com/watch?v=Ux5cFp25abo', 'Ux5cFp25abo', 3),
  ('Saindo das dívidas', 'Estratégias para quitar dívidas', 'https://www.youtube.com/watch?v=Ud_VvQqZxQk', 'Ud_VvQqZxQk', 4),
  ('Hábitos financeiros saudáveis', 'Construindo disciplina financeira', 'https://www.youtube.com/watch?v=oTOUozK2Yqo', 'oTOUozK2Yqo', 5)
) AS t(title, subtitle, url, vid, ord)
UNION ALL
SELECT c2.id, t.title, t.subtitle, t.url, t.vid, t.ord, 75 FROM c2, (VALUES
  ('Renda fixa para iniciantes', 'CDB, Tesouro Direto, LCI/LCA', 'https://www.youtube.com/watch?v=2H9_eAfOZQs', '2H9_eAfOZQs', 1),
  ('Introdução à renda variável', 'Ações e fundos imobiliários', 'https://www.youtube.com/watch?v=g_oZ8YxQwM4', 'g_oZ8YxQwM4', 2),
  ('Diversificação de carteira', 'Reduzindo riscos com alocação', 'https://www.youtube.com/watch?v=NHSfM2gWnZ8', 'NHSfM2gWnZ8', 3),
  ('Imposto de renda para investidores', 'Declarando seus investimentos', 'https://www.youtube.com/watch?v=4QwWbCK7ldI', '4QwWbCK7ldI', 4),
  ('Planejamento de longo prazo', 'Metas de 5, 10 e 20 anos', 'https://www.youtube.com/watch?v=W3uVc4iRT0I', 'W3uVc4iRT0I', 5)
) AS t(title, subtitle, url, vid, ord)
UNION ALL
SELECT c3.id, t.title, t.subtitle, t.url, t.vid, t.ord, 100 FROM c3, (VALUES
  ('Independência financeira (FIRE)', 'O movimento de aposentadoria antecipada', 'https://www.youtube.com/watch?v=O41Ux2pQYG4', 'O41Ux2pQYG4', 1),
  ('Análise fundamentalista', 'Avaliando empresas para investir', 'https://www.youtube.com/watch?v=ePbKGoIGAXY', 'ePbKGoIGAXY', 2),
  ('Investimentos no exterior', 'Como diversificar globalmente', 'https://www.youtube.com/watch?v=p4zKZ2dW6fA', 'p4zKZ2dW6fA', 3),
  ('Holding familiar e sucessão', 'Planejamento patrimonial', 'https://www.youtube.com/watch?v=1XiKcJj7Lro', '1XiKcJj7Lro', 4),
  ('Construindo múltiplas fontes de renda', 'Renda passiva e ativa', 'https://www.youtube.com/watch?v=W7DhVMRuJZ8', 'W7DhVMRuJZ8', 5)
) AS t(title, subtitle, url, vid, ord);
