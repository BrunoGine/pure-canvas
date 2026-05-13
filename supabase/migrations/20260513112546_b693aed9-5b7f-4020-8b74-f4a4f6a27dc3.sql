ALTER TABLE public.courses ADD COLUMN audience text NOT NULL DEFAULT 'personal';
ALTER TABLE public.courses ADD CONSTRAINT courses_audience_check CHECK (audience IN ('personal','business'));
CREATE INDEX idx_courses_audience ON public.courses(audience);