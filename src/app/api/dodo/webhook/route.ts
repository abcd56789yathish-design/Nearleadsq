import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import type DodoPayments from "dodopayments";
import { db } from "@/lib/db";
import { planForProductId, type Plan } from "@/lib/plans";

export const runtime = "nodejs";

/**
 * Dodo Payments webhook: keeps `plan` / `dodoCustomerId` in sync.
 * Active events grant the plan of the subscribed product; terminal/failure
 * events downgrade the user back to FREE.
 */
export async function POST(request: Request) {
  const secret = process.env.DODO_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }

  const rawBody = await request.text();
  const webhookHeaders: Record<string, string> = {};
  for (const [name, value] of request.headers.entries()) {
    webhookHeaders[name] = value;
  }

  try {
    const hook = new Webhook(secret);
    await hook.verify(rawBody, webhookHeaders);
  } catch (error) {
    console.error("Dodo webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: DodoPayments.WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as DodoPayments.WebhookPayload;
  } catch (error) {
    console.error("Dodo webhook invalid JSON:", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!payload.type.startsWith("subscription.")) {
    return NextResponse.json({ received: true });
  }

  const sub = payload.data as DodoPayments.WebhookPayload.Subscription;

  try {
    const ACTIVE_EVENTS = new Set([
      "subscription.active",
      "subscription.renewed",
      "subscription.plan_changed",
      "subscription.updated",
    ]);
    const active = ACTIVE_EVENTS.has(payload.type);
    const plan: Plan = active ? planForProductId(sub.product_id) : "FREE";
    const customerId = sub.customer?.customer_id;
    const userId = (sub.metadata?.userId as string | undefined) ?? null;

    if (userId && !userId.startsWith("cus_")) {
      await db.user.update({
        where: { id: userId },
        data: { plan, ...(customerId ? { dodoCustomerId: customerId } : {}) },
      });
    } else if (customerId) {
      const existing = await db.user.findUnique({
        where: { dodoCustomerId: customerId },
        select: { id: true },
      });
      if (existing) {
        await db.user.update({
          where: { id: existing.id },
          data: { plan },
        });
      } else {
        console.warn(
          `Dodo webhook: no user found for customer ${customerId} (subscription ${sub.subscription_id})`
        );
      }
    } else {
      console.warn(
        `Dodo webhook: no userId/customerId for subscription ${sub.subscription_id}`
      );
    }
  } catch (error) {
    console.error(`Dodo webhook handler failed for ${payload.type}:`, error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}