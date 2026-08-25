export const TEMPLATE_VARIABLES = [
  { key: "{{business_name}}", description: "The business's name" },
  { key: "{{category}}", description: "Business category, e.g. Cafes & Coffee" },
  { key: "{{address}}", description: "The business's street address" },
  { key: "{{phone}}", description: "The business's phone number" },
  { key: "{{website}}", description: "The business's website URL" },
  { key: "{{email}}", description: "The business's email address" },
  { key: "{{sender_name}}", description: "Your account name" },
  { key: "{{sender_company}}", description: "Your company name" },
] as const;

export interface TemplateLead {
  name: string;
  category?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  email?: string | null;
}

export function renderTemplate(
  body: string,
  lead: TemplateLead,
  senderName?: string | null,
  senderCompany?: string | null
): string {
  return body
    .replaceAll("{{business_name}}", lead.name)
    .replaceAll("{{category}}", lead.category ?? "local business")
    .replaceAll("{{address}}", lead.address ?? "your area")
    .replaceAll("{{phone}}", lead.phone ?? "")
    .replaceAll("{{website}}", lead.website ?? "")
    .replaceAll("{{email}}", lead.email ?? "")
    .replaceAll("{{sender_name}}", senderName ?? "")
    .replaceAll("{{sender_company}}", senderCompany ?? "");
}

export function buildWhatsAppUrl(phoneE164: string, message: string): string {
  return `https://wa.me/${phoneE164.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

export const DEFAULT_TEMPLATES = [
  {
    name: "Friendly intro",
    body:
      "Hi {{business_name}}! 👋 I came across your listing while looking at great {{category}} in the area. " +
      "I help local businesses like yours grow online and had a couple of quick ideas. " +
      "Would you be open to a short chat this week?\n\n— {{sender_name}}, {{sender_company}}",
    isDefault: true,
  },
  {
    name: "No website pitch",
    body:
      "Hi {{business_name}}! I noticed you don't have a website listed yet — customers search online first these days. " +
      "I build simple, affordable sites for local {{category}} businesses. Interested in seeing a free mockup? 🚀\n\n" +
      "— {{sender_name}}, {{sender_company}}",
    isDefault: false,
  },
  {
    name: "Location-based opener",
    body:
      "Hey {{business_name}}! I was looking at {{category}} near {{address}} and found your listing. " +
      "Love what you're doing — I work with similar businesses in the area to help them get more customers online. " +
      "Mind if I share a quick idea?\n\n— {{sender_name}}",
    isDefault: false,
  },
  {
    name: "Follow-up",
    body:
      "Hi {{business_name}}! Just following up on my last message. " +
      "I'd love 5 minutes to show you how I helped a similar {{category}} business increase their foot traffic. " +
      "Would Thursday work?\n\n— {{sender_name}}",
    isDefault: false,
  },
] as const;
