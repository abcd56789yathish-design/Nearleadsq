import { redirect } from "next/navigation";
import { SearchForm } from "@/components/search-form";
import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { PLANS, planOf } from "@/lib/plans";

export default async function SearchPage() {
  const ctx = await requireWorkspace();
  if (!ctx) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: ctx.userId },
    select: { plan: true },
  });
  const plan = planOf(user?.plan);
  const searchCap = PLANS[plan].searchLeadLimit;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">New Search</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Search a location and category to build a fresh lead list.
      </p>
      <SearchForm searchCap={searchCap} />
    </div>
  );
}