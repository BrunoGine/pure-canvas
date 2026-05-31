
-- Lock down admin & sensitive SECURITY DEFINER functions: revoke EXECUTE from anon and PUBLIC.
-- Authenticated role retained (functions self-gate via has_role / auth.uid()).

REVOKE EXECUTE ON FUNCTION public.admin_get_user_detail(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_grant_override(uuid, subscription_plan, integer, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_list_users(text, text, text, integer, integer, integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_log_action(text, uuid, jsonb) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_metrics() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_override(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_search_users(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_set_account_status(uuid, text, text) FROM anon, PUBLIC;

-- Other sensitive functions where anon access is never appropriate
REVOKE EXECUTE ON FUNCTION public.can_send_notification(uuid, text, text, integer, integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.register_notification_device(text, text, text, text, text, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.unregister_notification_device(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_effective_plan(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_account_status() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_account_active(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_accepted_current_legal(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_shared_goal_profiles_v2(uuid[]) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.support_on_new_message() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_last_seen() FROM anon, PUBLIC;
