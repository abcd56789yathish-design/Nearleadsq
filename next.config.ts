import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Keep `standalone` for self-hosted builds (Docker), but disable it on Vercel:
  // Vercel's adapter-based builds crash on Next 16.3 with a missing
  // .next/next-server.js.nft.json otherwise.
  ...(process.env.VERCEL === "1" ? {} : { output: "standalone" }),
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
