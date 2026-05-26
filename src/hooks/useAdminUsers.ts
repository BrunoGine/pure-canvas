import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PlanKey } from "@/lib/plans";
import type { AccountStatus } from "@/components/admin/UserStatusBadge";

export interface AdminUserRow {
  id: string;
  display_name: string | null;
  email: string | null;
  account_status: AccountStatus;
  status_reason: string | null;
  effective_plan: PlanKey;
  subscription_status: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
  last_seen_at: string | null;
  login_count: number;
  transactions_count: number;
  goals_count: number;
  companies_count: number;
  active_company_id: string | null;
  total_count: number;
}

export interface AdminUserFilters {
  search?: string;
  status?: AccountStatus | "";
  plan?: PlanKey | "";
  inactiveDays?: number | null;
  page?: number;
  pageSize?: number;
}

export const useAdminUsers = (filters: AdminUserFilters) => {
  const pageSize = filters.pageSize ?? 25;
  const page = filters.page ?? 0;
  return useQuery({
    queryKey: ["admin_users", filters],
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      const params = {
        _search: filters.search || null,
        _status: filters.status || null,
        _plan: filters.plan || null,
        _inactive_days: filters.inactiveDays ?? null,
        _limit: pageSize,
        _offset: page * pageSize,
      };
      // eslint-disable-next-line no-console
      console.log("[admin_list_users] calling", params);
      const { data, error } = await (supabase as any).rpc("admin_list_users", params);
      if (error) {
        // eslint-disable-next-line no-console
        console.error("[admin_list_users] error", error);
        throw error;
      }
      const rows = (data as AdminUserRow[]) ?? [];
      // eslint-disable-next-line no-console
      console.log("[admin_list_users] received rows:", rows.length, "total:", rows[0]?.total_count ?? 0);
      return {
        rows,
        total: rows[0]?.total_count ?? 0,
        page,
        pageSize,
      };
    },
  });
};
