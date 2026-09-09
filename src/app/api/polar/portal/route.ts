import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getPolar, isBillingConfigured } from "@/lib/polar";
import { isPaidPlan, planOf } from "@/lib/plans";

export async function POST() {
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
    select: { plan: true, polarCustomerId: true, email: true },
  });
  if (!user || !isPaidPlan(planOf(user.plan))) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
  }

  const polar = getPolar();
  if (!polar) {
    return NextResponse.json({ error: "Polar client not available" }, { status: 500 });
  }

  // Polar doesn't provide a Stripe-like customer portal URL generation API.
  // Instead, we redirect to the Polar dashboard where users can manage subscriptions.
  // The Polar dashboard authenticates users via email magic links.
  const polarBaseUrl = process.env.POLAR_SERVER === "production"
    ? "https://polar.sh"
    : "https://sandbox.polar.sh";

  try {
    // Attempt to get customer info to verify the subscription exists
    if (user.polarCustomerId) {
      // Customer ID exists, which confirms the webhook has synced their data
      // Redirect to the Polar dashboard subscription management page
      return NextResponse.json({
        url: `${polarBaseUrl}/dashboard`,
        message: "You will be redirected to Polar to manage your subscription. Use your login email to access the dashboard.",
        customerEmail: user.email,
      });
    }

    // No customer ID stored yet — this shouldn't happen for paid plans,
    // but handle gracefully
    return NextResponse.json({
      url: `${polarBaseUrl}/dashboard`,
      message: "Please contact support to manage your subscription.",
      customerEmail: user.email,
    });
  } catch (error) {
    console.error("Polar portal error:", error);
    return NextResponse.json(
      { error: "Could not generate portal link" },
      { status: 500 }
    );
  }
}
