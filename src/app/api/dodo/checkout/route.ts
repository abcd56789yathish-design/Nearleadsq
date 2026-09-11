import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getDodo, isBillingConfigured } from "@/lib/dodo";
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
    select: { id: true, email: true, name: true, plan: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (isPaidPlan(planOf(user.plan))) {
    return NextResponse.json(
      { error: "You already have an active subscription. Manage it from the customer portal." },
      { status: 400 }
    );
  }

  const { targetPlan } = (await request.json().catch(() => ({}))) as {
    targetPlan?: string;
  };
  const productId =
    targetPlan === "AGENCY"
      ? process.env.DODO_PRODUCT_AGENCY
      : process.env.DODO_PRODUCT_GROWTH;

  if (!productId) {
    return NextResponse.json(
      { error: "The selected plan is not available on this deployment" },
      { status: 503 }
    );
  }

  const dodo = getDodo();
  if (!dodo) {
    return NextResponse.json(
      { error: "Dodo Payments client not available" },
      { status: 500 }
    );
  }

  const origin = new URL(request.url).origin;

  try {
    const sessionResponse = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email: user.email, name: user.name ?? undefined },
      metadata: { userId: user.id },
      billing_currency: "USD",
      return_url: `${origin}/billing?checkout=success`,
      cancel_url: `${origin}/billing?checkout=cancelled`,
    });
    if (!sessionResponse.checkout_url) {
      return NextResponse.json(
        { error: "Checkout URL not returned" },
        { status: 502 }
      );
    }
    return NextResponse.json({ url: sessionResponse.checkout_url });
  } catch (error: unknown) {
    console.error("Dodo checkout failed:", JSON.stringify(error, null, 2));
    const message =
      error instanceof Error ? error.message : "Could not start checkout";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}