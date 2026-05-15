create table public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  feature text not null,
  model text not null,
  prompt_chars int,
  response_chars int,
  created_at timestamptz not null default now()
);
create index idx_ai_usage_log_user_created on public.ai_usage_log (user_id, created_at desc);
alter table public.ai_usage_log enable row level security;

create policy "users read own ai usage"
  on public.ai_usage_log for select
  using (auth.uid() = user_id);

create policy "admins read all ai usage"
  on public.ai_usage_log for select
  using (public.has_role(auth.uid(), 'admin'));