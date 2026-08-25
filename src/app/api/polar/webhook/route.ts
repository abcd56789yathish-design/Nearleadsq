import { NextResponse } from "next/server";
import { validateEvent } from "@polar-sh/sdk/webhooks";
import { db } from "@/lib/db";
import { planForProductId, type Plan } from "@/lib/plans";

export const runtime = "nodejs";

/**
 * Polar webhook: keeps `plan` / `polarCustomerId` in sync.
 * Events: subscription.created, subscription.updated, subscription.canceled
 */
export async function POST(request: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const body = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let event;
  try {
    event = validateEvent(body, headers, secret);
  } catch (error) {
    console.error("Polar webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "subscription.created":
      case "subscription.updated":
      case "subscription.canceled":
      case "subscription.revoked": {
        const sub = event.data;
        const active =
          sub.status === "active" || sub.status === "trialing";
        const plan: Plan = active ? planForProductId(sub.productId) : "FREE";

        // Try to find user via checkout metadata (userId) or externalCustomerId
        const userId =
          (sub.metadata?.userId as string | undefined) ??
          sub.customer?.externalId ??
          null;

        if (userId) {
          await db.user.update({
            where: { id: userId },
            data: { plan, polarCustomerId: sub.customerId },
          });
        } else {
          console.warn(
            `Polar webhook: no userId found for subscription ${sub.id} — cannot update plan`
          );
        }
        break;
      }
    }
  } catch (error) {
    console.error(`Polar webhook handler failed for ${event.type}:`, error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
