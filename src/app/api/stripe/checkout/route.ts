import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getStripe, isBillingConfigured } from "@/lib/stripe";
import { isPaidPlan, planOf } from "@/lib/plans";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isBillingConfigured()) {
    return NextResponse.json(
      { error: "Billing is not configured on this deployment" },
      { status: 503 }
    );
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, stripeCustomerId: true, plan: true },
  });
  if (isPaidPlan(planOf(user?.plan))) {
    return NextResponse.json({ error: "You already have an active subscription" }, { status: 400 });
  }

  const { targetPlan } = await request.json().catch(() => ({})) as { targetPlan?: string };
  const priceId =
    targetPlan === "AGENCY"
      ? process.env.STRIPE_PRICE_AGENCY
      : process.env.STRIPE_PRICE_GROWTH;

  if (!priceId) {
    return NextResponse.json(
      { error: "The selected plan is not available on this deployment" },
      { status: 503 }
    );
  }

  const origin = new URL(request.url).origin;
  const sessionParams = {
    mode: "subscription" as const,
    client_reference_id: user?.id,
    customer: user?.stripeCustomerId ?? undefined,
    customer_email: user?.stripeCustomerId ? undefined : (user?.email ?? undefined),
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/billing?checkout=success`,
    cancel_url: `${origin}/billing?checkout=cancelled`,
    allow_promotion_codes: true,
  };

  try {
    const checkout = await getStripe()!.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("Stripe checkout failed:", error);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 502 });
  }
}
