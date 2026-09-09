import { describe, it, expect } from "vitest";
import { CATEGORIES, CATEGORY_GROUPS, categoryLabel } from "../categories";

describe("CATEGORIES", () => {
  it("has at least 25 categories", () => {
    expect(Object.keys(CATEGORIES).length).toBeGreaterThanOrEqual(25);
  });

  it("every category has label, group, and tags", () => {
    for (const [key, cat] of Object.entries(CATEGORIES)) {
      expect(cat.label, `${key} missing label`).toBeTruthy();
      expect(cat.group, `${key} missing group`).toBeTruthy();
      expect(cat.tags, `${key} missing tags`).toBeTruthy();
      expect(Object.keys(cat.tags).length, `${key} has empty tags`).toBeGreaterThan(0);
    }
  });

  it("has expected categories", () => {
    expect(CATEGORIES).toHaveProperty("restaurant");
    expect(CATEGORIES).toHaveProperty("cafe");
    expect(CATEGORIES).toHaveProperty("dentist");
    expect(CATEGORIES).toHaveProperty("gym");
    expect(CATEGORIES).toHaveProperty("hotel");
    expect(CATEGORIES).toHaveProperty("plumber");
    expect(CATEGORIES).toHaveProperty("electrician");
    expect(CATEGORIES).toHaveProperty("retail");
  });
});

describe("CATEGORY_GROUPS", () => {
  it("contains unique groups", () => {
    const unique = new Set(CATEGORY_GROUPS);
    expect(unique.size).toBe(CATEGORY_GROUPS.length);
  });

  it("contains expected groups", () => {
    expect(CATEGORY_GROUPS).toContain("Food & Drink");
    expect(CATEGORY_GROUPS).toContain("Health");
    expect(CATEGORY_GROUPS).toContain("Trades");
  });
});

describe("categoryLabel", () => {
  it("returns the label for a valid key", () => {
    expect(categoryLabel("restaurant")).toBe("Restaurants");
    expect(categoryLabel("cafe")).toBe("Cafes & Coffee");
  });

  it("returns the key itself for unknown keys", () => {
    expect(categoryLabel("unknown")).toBe("unknown");
  });
});
