import { describe, it, expect } from "vitest";
import { renderTemplate, buildWhatsAppUrl, TEMPLATE_VARIABLES, DEFAULT_TEMPLATES } from "../message-template";

describe("renderTemplate", () => {
  const lead = {
    name: "Joe's Coffee",
    category: "Cafes & Coffee",
    address: "123 Main St",
    phone: "+15551234567",
    website: "https://joescoffee.com",
    email: "joe@joescoffee.com",
  };

  it("replaces all variables", () => {
    const result = renderTemplate(
      "{{business_name}} - {{category}} at {{address}}",
      lead,
      "John",
      "Acme Inc"
    );
    expect(result).toBe("Joe's Coffee - Cafes & Coffee at 123 Main St");
  });

  it("replaces sender variables", () => {
    const result = renderTemplate(
      "— {{sender_name}}, {{sender_company}}",
      lead,
      "John",
      "Acme Inc"
    );
    expect(result).toBe("— John, Acme Inc");
  });

  it("uses defaults for missing lead fields", () => {
    const minimalLead = { name: "Test" };
    const result = renderTemplate(
      "{{business_name}} - {{category}} at {{address}}",
      minimalLead
    );
    expect(result).toBe("Test - local business at your area");
  });

  it("handles null sender info", () => {
    const result = renderTemplate("— {{sender_name}}", lead, null, null);
    expect(result).toBe("— ");
  });

  it("returns original string when no variables present", () => {
    const result = renderTemplate("Hello world", lead);
    expect(result).toBe("Hello world");
  });
});

describe("buildWhatsAppUrl", () => {
  it("builds a valid WhatsApp URL", () => {
    const url = buildWhatsAppUrl("+15551234567", "Hello!");
    expect(url).toBe("https://wa.me/15551234567?text=Hello!");
  });

  it("strips non-digit characters from phone", () => {
    const url = buildWhatsAppUrl("+1 (555) 123-4567", "Test");
    expect(url).toBe("https://wa.me/15551234567?text=Test");
  });

  it("encodes special characters in message", () => {
    const url = buildWhatsAppUrl("+15551234567", "Hello & goodbye!");
    expect(url).toContain("text=Hello%20%26%20goodbye!");
  });
});

describe("TEMPLATE_VARIABLES", () => {
  it("has 8 variables defined", () => {
    expect(TEMPLATE_VARIABLES).toHaveLength(8);
  });

  it("all variables start with {{ and end with }}", () => {
    for (const v of TEMPLATE_VARIABLES) {
      expect(v.key).toMatch(/^\{\{.+\}\}$/);
    }
  });
});

describe("DEFAULT_TEMPLATES", () => {
  it("has at least one default template", () => {
    const defaults = DEFAULT_TEMPLATES.filter((t) => t.isDefault);
    expect(defaults.length).toBeGreaterThanOrEqual(1);
  });

  it("all templates have name and body", () => {
    for (const t of DEFAULT_TEMPLATES) {
      expect(t.name).toBeTruthy();
      expect(t.body).toBeTruthy();
    }
  });
});
