import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getDodo, isBillingConfigured } from "@/lib/dodo";
import { isPaidPlan, planOf } from "@/lib/plans";

export async function POST(request: Request) {
  const session = await auth();

  const origin = new URL(request.url).origin;
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
    select: { plan: true, dodoCustomerId: true },
  });
  if (!user || !isPaidPlan(planOf(user.plan)) || !user.dodoCustomerId) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
  }

  const dodo = getDodo();
  if (!dodo) {
    return NextResponse.json(
      { error: "Dodo Payments client not available" },
      { status: 500 }
    );
  }

  try {
    const portalSession = await dodo.customers.customerPortal.create(
      user.dodoCustomerId,
      { return_url: `${origin}/billing` }
    );
    return NextResponse.json({ url: portalSession.link });
  } catch (error: unknown) {
    console.error("Dodo customer portal error:", error);
    return NextResponse.json(
      { error: "Could not generate portal link" },
      { status: 502 }
    );
  }
}