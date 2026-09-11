import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { DEFAULT_TEMPLATES } from "@/lib/message-template";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On first sign-in `user` is present. Because we don't use a DB
      // adapter, `user.id` is the Google provider id — so resolve our own
      // User row by email instead, creating it (with workspace + templates)
      // the first time.
      if (user?.email) {
        const email = user.email;
        let dbUser = await db.user.findUnique({ where: { email } });
        if (!dbUser) {
          dbUser = await db.user.create({
            data: {
              email,
              name: user.name ?? null,
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
        }
        token.id = dbUser.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
});