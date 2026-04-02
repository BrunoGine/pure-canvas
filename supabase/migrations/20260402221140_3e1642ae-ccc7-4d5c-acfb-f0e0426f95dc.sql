INSERT INTO public.profiles (id, display_name)
SELECT id, raw_user_meta_data->>'display_name'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;