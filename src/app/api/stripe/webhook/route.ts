import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { planForPriceId, type Plan } from "@/lib/plans";

export const runtime = "nodejs";

/**
 * Stripe webhook: keeps `plan` / `stripeCustomerId` in sync.
 * Configure with `stripe listen --forward-to <origin>/api/stripe/webhook`.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  async function setPlanByCustomerId(customerId: string, plan: Plan) {
    await db.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: { plan },
    });
  }

  function resolvePlanFromSubscription(subscription: Stripe.Subscription): Plan {
    const priceId = subscription.items.data[0]?.price?.id;
    if (!priceId) return "FREE";
    const active =
      subscription.status === "active" || subscription.status === "trialing";
    return active ? planForPriceId(priceId) : "FREE";
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.client_reference_id ?? session.metadata?.userId;
        const customerId =
          typeof session.customer === "string" ? session.customer : null;
        if (userId && customerId) {
          const priceId = session.subscription
            ? typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id
            : null;
          let plan: Plan = "GROWTH";
          if (priceId) {
            const sub = await stripe.subscriptions.retrieve(priceId);
            plan = resolvePlanFromSubscription(sub);
          }
          await db.user.update({
            where: { id: userId },
            data: { plan, stripeCustomerId: customerId },
          });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : null;
        if (!customerId) break;
        await setPlanByCustomerId(customerId, resolvePlanFromSubscription(subscription));
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : null;
        if (customerId) await setPlanByCustomerId(customerId, "FREE");
        break;
      }
    }
  } catch (error) {
    console.error(`Stripe webhook handler failed for ${event.type}:`, error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
