import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getPolar, isBillingConfigured } from "@/lib/polar";
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
    select: { id: true, email: true, plan: true },
  });
  if (isPaidPlan(planOf(user?.plan))) {
    return NextResponse.json({ error: "You already have an active subscription" }, { status: 400 });
  }

  const { targetPlan } = (await request.json().catch(() => ({}))) as {
    targetPlan?: string;
  };
  const productId =
    targetPlan === "AGENCY"
      ? process.env.POLAR_PRODUCT_AGENCY
      : process.env.POLAR_PRODUCT_GROWTH;

  if (!productId) {
    return NextResponse.json(
      { error: "The selected plan is not available on this deployment" },
      { status: 503 }
    );
  }

  const polar = getPolar();
  if (!polar) {
    return NextResponse.json({ error: "Polar client not available" }, { status: 500 });
  }

  const origin = new URL(request.url).origin;

  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      externalCustomerId: user?.id ?? undefined,
      successUrl: `${origin}/billing?checkout=success`,
      metadata: { userId: user?.id ?? "", targetPlan: targetPlan ?? "GROWTH" },
    });
    return NextResponse.json({ url: checkout.url });
  } catch (error: any) {
    console.error("Polar checkout failed:", JSON.stringify(error, null, 2));
    const message = error?.message ?? "Could not start checkout";
    return NextResponse.json({ error: message, status: error?.statusCode }, { status: 502 });
  }
}
