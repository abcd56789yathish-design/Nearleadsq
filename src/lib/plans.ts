import { db } from "@/lib/db";

export type Plan = "FREE" | "GROWTH" | "AGENCY";

export const PLANS = {
  FREE: {
    label: "Starter",
    priceLabel: "$0",
    monthlyPrice: 0,
    annualPrice: 0,
    leadLimit: 50,
    searchLeadLimit: 50,
    workspaceLimit: 1,
    emailEnrichmentLimit: 20,
    templateLimit: 2,
    csvImportLimit: 100,
    teamSeats: 1,
    features: [
      "50 stored leads",
      "1 workspace",
      "25+ category local search",
      "20 email enrichments/mo",
      "2 WhatsApp templates",
      "CSV export",
    ],
    cta: { label: "Get started free", href: "/signup" },
  },
  GROWTH: {
    label: "Growth",
    priceLabel: "$29/mo",
    monthlyPrice: 29,
    annualPrice: 24,
    leadLimit: 2000,
    searchLeadLimit: 200,
    workspaceLimit: 3,
    emailEnrichmentLimit: 500,
    templateLimit: 10,
    csvImportLimit: 5000,
    teamSeats: 2,
    features: [
      "2,000 stored leads",
      "3 client workspaces",
      "25+ category local search",
      "500 email enrichments/mo",
      "10 WhatsApp templates",
      "CSV import & export",
      "2 team seats",
    ],
    cta: { label: "Upgrade to Growth", href: "/billing" },
  },
  AGENCY: {
    label: "Agency",
    priceLabel: "$79/mo",
    monthlyPrice: 79,
    annualPrice: 65,
    leadLimit: 10000,
    searchLeadLimit: 500,
    workspaceLimit: Infinity,
    emailEnrichmentLimit: 3000,
    templateLimit: Infinity,
    csvImportLimit: Infinity,
    teamSeats: 5,
    features: [
      "10,000 stored leads",
      "Unlimited client workspaces",
      "25+ category local search",
      "3,000 email enrichments/mo",
      "Unlimited WhatsApp templates",
      "CSV import & export",
      "5 team seats",
      "Priority support",
    ],
    cta: { label: "Upgrade to Agency", href: "/billing" },
  },
} as const;

export type PlanTier = keyof typeof PLANS;
export const PLAN_TIERS: PlanTier[] = ["FREE", "GROWTH", "AGENCY"];

export function planOf(plan: string | null | undefined): Plan {
  if (plan === "GROWTH" || plan === "AGENCY") return plan;
  return "FREE";
}

/** Whether the given plan is a paid tier. */
export function isPaidPlan(plan: Plan): boolean {
  return plan === "GROWTH" || plan === "AGENCY";
}

/** Map a Polar product ID to a plan tier. */
export function planForProductId(productId: string): Plan {
  if (productId === process.env.POLAR_PRODUCT_GROWTH) return "GROWTH";
  if (productId === process.env.POLAR_PRODUCT_AGENCY) return "AGENCY";
  return "FREE";
}

export interface LeadQuota {
  plan: Plan;
  used: number;
  limit: number;
  remaining: number;
  blocked: boolean;
}

/** Current lead usage vs. plan limit for a user (across all workspaces). */
export async function getLeadQuota(userId: string, plan?: string): Promise<LeadQuota> {
  const resolved =
    plan !== undefined ? planOf(plan) : planOf((await db.user.findUnique({ where: { id: userId }, select: { plan: true } }))?.plan);
  const used = await db.lead.count({ where: { userId } });
  const limit = PLANS[resolved].leadLimit;
  return { plan: resolved, used, limit, remaining: Math.max(0, limit - used), blocked: used >= limit };
}

export const QUOTA_MESSAGES = {
  leads:
    "You've reached your plan's lead limit. Upgrade to store more leads.",
  workspaces:
    "You've reached your plan's workspace limit. Upgrade to manage more clients.",
};
