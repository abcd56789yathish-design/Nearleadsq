import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn", () => {
  it("merges class names", () => {
    const result = cn("foo", "bar");
    expect(result).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "extra");
    expect(result).toBe("base extra");
  });

  it("handles undefined and null", () => {
    const result = cn("base", undefined, null, "extra");
    expect(result).toBe("base extra");
  });

  it("handles Tailwind merge conflicts", () => {
    const result = cn("px-4 py-2", "px-8");
    expect(result).toBe("py-2 px-8");
  });

  it("handles empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });
});
