import Stripe from "stripe";

let client: Stripe | null = null;

/** Lazily constructed Stripe SDK; null when billing isn't configured. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) client = new Stripe(key);
  return client;
}

export function isBillingConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      (process.env.STRIPE_PRICE_GROWTH || process.env.STRIPE_PRICE_AGENCY)
  );
}
