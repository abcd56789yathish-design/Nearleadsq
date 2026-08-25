"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { QUOTA_MESSAGES, planOf, PLANS } from "@/lib/plans";
import { WORKSPACE_COOKIE } from "@/lib/workspace";

export async function switchWorkspace(workspaceId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const owned = await db.workspace.findFirst({
    where: { id: workspaceId, userId: session.user.id },
    select: { id: true },
  });
  if (!owned) return { error: "Not found" };

  (await cookies()).set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

const nameSchema = z.string().trim().min(1).max(60);

export async function createWorkspace(name: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { error: "Name must be 1-60 characters" };

  const [user, workspaceCount] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
    db.workspace.count({ where: { userId: session.user.id } }),
  ]);
  if (workspaceCount >= PLANS[planOf(user?.plan)].workspaceLimit) {
    return { error: QUOTA_MESSAGES.workspaces };
  }

  const workspace = await db.workspace.create({
    data: { userId: session.user.id, name: parsed.data },
    select: { id: true, name: true },
  });

  (await cookies()).set(WORKSPACE_COOKIE, workspace.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
  return { ok: true, workspace };
}
