import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { getLeadQuota, PLANS, isPaidPlan, planOf } from "@/lib/plans";
import { db } from "@/lib/db";
import { isBillingConfigured } from "@/lib/dodo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BillingActions, PlanFeature } from "@/components/billing-panel";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const ctx = await requireWorkspace();
  if (!ctx) redirect("/login");

  const [user, quota, workspaceCount] = await Promise.all([
    db.user.findUnique({
      where: { id: ctx.userId },
      select: { plan: true },
    }),
    getLeadQuota(ctx.userId),
    db.workspace.count({ where: { userId: ctx.userId } }),
  ]);
  const plan = planOf(user?.plan);
  const planConfig = PLANS[plan];

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your plan and usage. Upgrades are handled securely by Dodo Payments.
      </p>

      {checkout === "success" && (
        <p className="mt-4 rounded-md bg-success/10 px-3 py-2 text-sm text-success">
          Payment received — your subscription activates as soon as Dodo confirms it
          (usually a few seconds; refresh to see your updated plan).
        </p>
      )}
      {checkout === "cancelled" && (
        <p className="mt-4 rounded-md bg-secondary px-3 py-2 text-sm text-muted-foreground">
          Checkout cancelled — no charge was made.
        </p>
      )}

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardDescription>Current plan</CardDescription>
          <CardTitle className="flex items-baseline gap-2 text-2xl">
            {planConfig.label}
            {isPaidPlan(plan) && (
              <span className="text-sm font-normal text-muted-foreground">subscription active</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BillingActions plan={plan} configured={isBillingConfigured()} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Usage</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <UsageRow
            label="Leads stored"
            used={quota.used}
            limit={quota.limit}
            blocked={quota.blocked}
            href="/leads"
          />
          <UsageRow
            label="Client workspaces"
            used={workspaceCount}
            limit={planConfig.workspaceLimit}
            blocked={false}
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Compare plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3 text-sm">
            {(["FREE", "GROWTH", "AGENCY"] as const).map((tier) => {
              const cfg = PLANS[tier];
              const isCurrent = tier === plan;
              return (
                <div key={tier} className={isCurrent ? "font-medium" : ""}>
                  <p className="font-semibold">{cfg.label}</p>
                  <p className="mt-1 text-muted-foreground">{cfg.priceLabel}</p>
                  <ul className="mt-3 space-y-1.5">
                    {cfg.features.map((f) => (
                      <PlanFeature key={f} included={true}>{f}</PlanFeature>
                    ))}
                  </ul>
                  {isCurrent && (
                    <p className="mt-3 text-xs text-primary">Current plan</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsageRow({
  label,
  used,
  limit,
  blocked,
  href,
}: {
  label: string;
  used: number;
  limit: number;
  blocked: boolean;
  href?: string;
}) {
  const isUnlimited = !isFinite(limit);
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span>{label}</span>
        <span className={blocked ? "font-medium text-destructive" : "text-muted-foreground"}>
          {used.toLocaleString()} / {isUnlimited ? "unlimited" : limit.toLocaleString()}
          {href && blocked ? (
            <>
              {" · "}
              <a href={href} className="underline hover:text-foreground">
                review
              </a>{" "}
              or{" "}
              <a href="/billing" className="underline hover:text-foreground">
                upgrade
              </a>
            </>
          ) : null}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${blocked ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
