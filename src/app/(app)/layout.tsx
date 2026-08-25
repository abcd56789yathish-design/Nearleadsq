import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppSidebar, MobileNav } from "@/components/app-sidebar";
import { getActiveWorkspace, listWorkspaces } from "@/lib/workspace";
import { db } from "@/lib/db";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const [workspaces, activeWorkspace] = await Promise.all([
    listWorkspaces(userId),
    getActiveWorkspace(userId),
  ]);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const followUpsDue = await db.lead.count({
    where: {
      userId,
      workspaceId: activeWorkspace.id,
      followUpAt: { lte: endOfToday },
      status: { notIn: ["WON", "LOST"] },
    },
  });

  const sidebarProps = {
    user: session.user,
    workspaces,
    activeWorkspaceId: activeWorkspace.id,
    followUpsDue,
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppSidebar {...sidebarProps} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav {...sidebarProps} />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
