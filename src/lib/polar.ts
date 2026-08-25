import { Polar } from "@polar-sh/sdk";

let client: Polar | null = null;

export function getPolar(): Polar | null {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) return null;
  if (!client) {
    client = new Polar({
      accessToken: token,
      server: (process.env.POLAR_SERVER as "sandbox" | "production") ?? "sandbox",
    });
  }
  return client;
}

export function isBillingConfigured(): boolean {
  return Boolean(
    process.env.POLAR_ACCESS_TOKEN &&
      process.env.POLAR_WEBHOOK_SECRET &&
      process.env.POLAR_PRODUCT_GROWTH &&
      process.env.POLAR_PRODUCT_AGENCY
  );
}
