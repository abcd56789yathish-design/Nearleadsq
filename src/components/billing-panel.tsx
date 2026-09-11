"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Check, ExternalLink, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BillingActions({
  plan,
  configured,
}: {
  plan: string;
  configured: boolean;
}) {
  const [pending, setPending] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isPaid = plan === "GROWTH" || plan === "AGENCY";

  async function call(kind: "checkout" | "portal", targetPlan?: string) {
    setPending(kind);
    setError(null);
    try {
      const res = await fetch(`/api/dodo/${kind}`, {
        method: "POST",
        ...(kind === "checkout" && targetPlan
          ? { body: JSON.stringify({ targetPlan }), headers: { "Content-Type": "application/json" } }
          : {}),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Something went wrong");
        return;
      }
      window.location.href = payload.url;
    } catch {
      setError("Network error — please try again");
    } finally {
      setPending(null);
    }
  }

  if (!configured) {
    return (
      <p className="rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
        Billing isn&apos;t configured on this deployment yet — set{" "}
        <code className="font-mono">DODO_API_KEY</code>,{" "}
        <code className="font-mono">DODO_PRODUCT_GROWTH</code>, and{" "}
        <code className="font-mono">DODO_PRODUCT_AGENCY</code> to enable upgrades.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap gap-2">
        {plan === "FREE" && (
          <>
            <Button pending={pending === "checkout"} onClick={() => call("checkout", "GROWTH")}>
              <Sparkles />
              Upgrade to Growth — $29/mo
            </Button>
            <Button variant="outline" pending={pending === "checkout"} onClick={() => call("checkout", "AGENCY")}>
              <Zap />
              Agency — $79/mo
            </Button>
          </>
        )}
        {isPaid && (
          <Button variant="outline" pending={pending === "portal"} onClick={() => call("portal")}>
            <ExternalLink />
            Manage subscription
          </Button>
        )}
      </div>
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

export function PlanFeature({ children, included }: { children: ReactNode; included: boolean }) {
  return (
    <li
      className={`flex items-center gap-2 text-sm ${
        included ? "text-foreground" : "text-muted-foreground/60 line-through"
      }`}
    >
      <Check className={`size-4 shrink-0 ${included ? "text-success" : ""}`} />
      {children}
    </li>
  );
}
