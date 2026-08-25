import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getStripe, isBillingConfigured } from "@/lib/stripe";

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
    select: { stripeCustomerId: true, plan: true },
  });
  if (!user?.stripeCustomerId || user.plan === "FREE") {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
  }

  try {
    const portal = await getStripe()!.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${new URL(request.url).origin}/billing`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error("Stripe portal failed:", error);
    return NextResponse.json(
      { error: "Could not open the billing portal — make sure it's enabled in Stripe" },
      { status: 502 }
    );
  }
}
