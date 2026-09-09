import { describe, it, expect } from "vitest";
import { toE164 } from "../phone";

describe("toE164", () => {
  it("returns null for null/undefined/empty input", () => {
    expect(toE164(null)).toBeNull();
    expect(toE164(undefined)).toBeNull();
    expect(toE164("")).toBeNull();
  });

  it("normalizes a US phone number", () => {
    const result = toE164("+1 202-555-0147", "US");
    expect(result).toBe("+12025550147");
  });

  it("normalizes a phone number without country code using hint", () => {
    const result = toE164("2025550147", "US");
    expect(result).toBe("+12025550147");
  });

  it("takes the first valid number from semicolon-separated strings", () => {
    const result = toE164("+44 20 7946 0958; +44 20 7946 0959", "GB");
    expect(result).toBe("+442079460958");
  });

  it("handles comma-separated numbers", () => {
    const result = toE164("+44 20 7946 0958, +44 20 7946 0959", "GB");
    expect(result).toBe("+442079460958");
  });

  it("handles slash-separated numbers", () => {
    const result = toE164("+44 20 7946 0958 / +44 20 7946 0959", "GB");
    expect(result).toBe("+442079460958");
  });

  it("returns null for completely invalid input", () => {
    expect(toE164("not a phone number", "US")).toBeNull();
    expect(toE164("abc", "US")).toBeNull();
  });

  it("handles numbers with spaces", () => {
    const result = toE164("+44 20 7946 0958", "GB");
    expect(result).toBe("+442079460958");
  });

  it("handles French phone numbers", () => {
    const result = toE164("+33 1 42 68 53 00", "FR");
    expect(result).toBe("+33142685300");
  });
});
