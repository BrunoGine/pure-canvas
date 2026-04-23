ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS video_credit text;
CREATE INDEX IF NOT EXISTS idx_lessons_course_order ON public.lessons (course_id, "order");