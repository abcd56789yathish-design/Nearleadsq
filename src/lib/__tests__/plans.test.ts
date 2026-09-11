import { describe, it, expect } from "vitest";
import { planOf, isPaidPlan, planForProductId, PLANS, PLAN_TIERS } from "../plans";

describe("planOf", () => {
  it("returns FREE for null/undefined", () => {
    expect(planOf(null)).toBe("FREE");
    expect(planOf(undefined)).toBe("FREE");
  });

  it("returns FREE for unknown plan strings", () => {
    expect(planOf("UNKNOWN")).toBe("FREE");
    expect(planOf("free")).toBe("FREE");
  });

  it("returns GROWTH for GROWTH", () => {
    expect(planOf("GROWTH")).toBe("GROWTH");
  });

  it("returns AGENCY for AGENCY", () => {
    expect(planOf("AGENCY")).toBe("AGENCY");
  });
});

describe("isPaidPlan", () => {
  it("returns false for FREE", () => {
    expect(isPaidPlan("FREE")).toBe(false);
  });

  it("returns true for GROWTH", () => {
    expect(isPaidPlan("GROWTH")).toBe(true);
  });

  it("returns true for AGENCY", () => {
    expect(isPaidPlan("AGENCY")).toBe(true);
  });
});

describe("planForProductId", () => {
  it("returns GROWTH for matching product ID", () => {
    process.env.DODO_PRODUCT_GROWTH = "pdt_growth_123";
    expect(planForProductId("pdt_growth_123")).toBe("GROWTH");
  });

  it("returns AGENCY for matching product ID", () => {
    process.env.DODO_PRODUCT_AGENCY = "pdt_agency_456";
    expect(planForProductId("pdt_agency_456")).toBe("AGENCY");
  });

  it("returns FREE for unknown product ID", () => {
    expect(planForProductId("unknown_id")).toBe("FREE");
  });
});

describe("PLANS", () => {
  it("has all three plan tiers", () => {
    expect(PLANS).toHaveProperty("FREE");
    expect(PLANS).toHaveProperty("GROWTH");
    expect(PLANS).toHaveProperty("AGENCY");
  });

  it("has correct limits for FREE plan", () => {
    expect(PLANS.FREE.leadLimit).toBe(50);
    expect(PLANS.FREE.searchLeadLimit).toBe(50);
    expect(PLANS.FREE.workspaceLimit).toBe(1);
    expect(PLANS.FREE.monthlyPrice).toBe(0);
  });

  it("has correct limits for GROWTH plan", () => {
    expect(PLANS.GROWTH.leadLimit).toBe(2000);
    expect(PLANS.GROWTH.searchLeadLimit).toBe(200);
    expect(PLANS.GROWTH.workspaceLimit).toBe(3);
    expect(PLANS.GROWTH.monthlyPrice).toBe(29);
  });

  it("has correct limits for AGENCY plan", () => {
    expect(PLANS.AGENCY.leadLimit).toBe(10000);
    expect(PLANS.AGENCY.searchLeadLimit).toBe(500);
    expect(PLANS.AGENCY.workspaceLimit).toBe(Infinity);
    expect(PLANS.AGENCY.monthlyPrice).toBe(79);
  });

  it("FREE plan is cheaper than GROWTH", () => {
    expect(PLANS.FREE.monthlyPrice).toBeLessThan(PLANS.GROWTH.monthlyPrice);
  });

  it("GROWTH plan is cheaper than AGENCY", () => {
    expect(PLANS.GROWTH.monthlyPrice).toBeLessThan(PLANS.AGENCY.monthlyPrice);
  });
});

describe("PLAN_TIERS", () => {
  it("contains all three tiers", () => {
    expect(PLAN_TIERS).toEqual(["FREE", "GROWTH", "AGENCY"]);
  });
});
