"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { DEFAULT_TEMPLATES } from "@/lib/message-template";

export type AuthState = { error?: string } | undefined;

const credentialsSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const name = String(formData.get("name") ?? "").trim() || null;
  const email = parsed.data.email.toLowerCase().trim();

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await db.user.create({
    data: {
      email,
      passwordHash,
      name,
      workspaces: {
        create: { name: "My workspace" },
      },
      templates: {
        create: DEFAULT_TEMPLATES.map((template) => ({
          name: template.name,
          body: template.body,
          isDefault: template.isDefault,
        })),
      },
    },
  });

  await signIn("credentials", { email, password: parsed.data.password, redirectTo: "/dashboard" });
}

export async function logIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Email and password are required" };
  }
  try {
    await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
