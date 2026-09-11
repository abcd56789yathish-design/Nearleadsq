import DodoPayments from "dodopayments";

let client: DodoPayments | null = null;

export function getDodo(): DodoPayments | null {
  const apiKey = process.env.DODO_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = new DodoPayments({
      bearerToken: apiKey,
      environment:
        process.env.DODO_ENV === "live_mode" ? "live_mode" : "test_mode",
    });
  }
  return client;
}

export function isBillingConfigured(): boolean {
  return Boolean(
    process.env.DODO_API_KEY &&
      process.env.DODO_WEBHOOK_SECRET &&
      process.env.DODO_PRODUCT_GROWTH &&
      process.env.DODO_PRODUCT_AGENCY
  );
}