// Single source of truth for plan-based feature access.

export type PlanKey = "free" | "premium" | "enterprise";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "expired"
  | "canceled"
  | "past_due";
export type BillingInterval = "month" | "year";

export type Feature =
  | "courses.watch"
  | "courses.certificate"
  | "enterprise.access"
  | "harpia.advanced"
  | "harpia.unlimited"
  | "reports.advanced"
  | "badge.premium";

export const FEATURE_MATRIX: Record<PlanKey, Feature[]> = {
  free: [],
  premium: [
    "courses.watch",
    "courses.certificate",
    "harpia.advanced",
    "harpia.unlimited",
    "reports.advanced",
    "badge.premium",
  ],
  enterprise: [
    "courses.watch",
    "courses.certificate",
    "harpia.advanced",
    "harpia.unlimited",
    "reports.advanced",
    "badge.premium",
    "enterprise.access",
  ],
};

export const PLAN_LABELS: Record<PlanKey, string> = {
  free: "Gratuito",
  premium: "Premium",
  enterprise: "Empresa",
};

export interface SubscriptionRecord {
  plan: PlanKey;
  status: SubscriptionStatus;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  billing_interval: BillingInterval | null;
}

/**
 * Returns the plan whose features should be unlocked right now,
 * accounting for active trials (trial of premium counts as premium).
 */
export function getEffectivePlan(sub: SubscriptionRecord | null): PlanKey {
  if (!sub) return "free";
  if (sub.status === "trialing" && sub.trial_ends_at) {
    const ends = new Date(sub.trial_ends_at).getTime();
    if (ends > Date.now()) return sub.plan;
  }
  if (sub.status === "active") return sub.plan;
  // expired / canceled / past_due fall back to free
  return "free";
}

export function hasFeature(plan: PlanKey, feature: Feature): boolean {
  return FEATURE_MATRIX[plan].includes(feature);
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

export function yearlySavingsPct(monthlyCents: number, yearlyCents: number): number {
  if (!monthlyCents || !yearlyCents) return 0;
  const fullYear = monthlyCents * 12;
  return Math.round(((fullYear - yearlyCents) / fullYear) * 100);
}
