import { cookies } from "next/headers";
import { cache } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const WORKSPACE_COOKIE = "lp_ws";

export async function listWorkspaces(userId: string) {
  return db.workspace.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
}

/**
 * Returns the active workspace for the current user, creating a default one
 * on first use. The active choice is stored in a cookie and validated against
 * ownership on every call.
 */
export const getActiveWorkspace = cache(async (userId: string) => {
  const [workspaces, activeId] = await Promise.all([
    listWorkspaces(userId),
    (await cookies()).get(WORKSPACE_COOKIE)?.value,
  ]);
  let workspace = workspaces.find((w) => w.id === activeId) ?? workspaces[0];

  if (!workspace) {
    workspace = await db.workspace.create({
      data: { userId, name: "My workspace" },
      select: { id: true, name: true },
    });
  }
  return workspace;
});

/** Auth + active workspace in one call for pages and route handlers. */
export async function requireWorkspace() {
  const session = await auth();
  if (!session?.user) return null;
  return {
    userId: session.user.id,
    userName: session.user.name ?? null,
    workspace: await getActiveWorkspace(session.user.id),
  };
}
