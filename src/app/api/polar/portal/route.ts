import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isPaidPlan, planOf } from "@/lib/plans";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  if (!user || !isPaidPlan(planOf(user.plan))) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
  }

  // Polar manages subscriptions via email — redirect to Polar's customer portal
  // Users can manage their subscription from the Polar dashboard
  const polarUrl = process.env.POLAR_SERVER === "production"
    ? "https://polar.sh"
    : "https://sandbox.polar.sh";

  return NextResponse.json({
    url: `${polarUrl}/dashboard`,
    message: "Please manage your subscription from the Polar dashboard.",
  });
}
