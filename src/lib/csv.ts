/**
 * Minimal RFC 4180-style CSV parsing with support for quoted fields,
 * escaped quotes, CRLF line endings, and auto-detected delimiters
 * (comma, semicolon, or tab — common in Excel exports).
 */

export type CsvDelimiter = "," | ";" | "\t";

export function detectDelimiter(text: string): CsvDelimiter {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  let inQuotes = false;
  const counts: Record<CsvDelimiter, number> = { ",": 0, ";": 0, "\t": 0 };
  for (const char of firstLine) {
    if (char === '"') inQuotes = !inQuotes;
    else if (!inQuotes && char in counts) counts[char as CsvDelimiter]++;
  }
  if (counts[","] >= counts[";"] && counts[","] >= counts["\t"]) return ",";
  if (counts[";"] >= counts["\t"]) return ";";
  return "\t";
}

export function parseCsv(text: string, delimiter?: CsvDelimiter): string[][] {
  // Strip Excel UTF-8 BOM.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const delim = delimiter ?? detectDelimiter(text);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (char === delim) {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (char === "\r") {
      i++;
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += char;
    i++;
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

const FIELD_ALIASES: Record<string, string[]> = {
  name: [
    "name",
    "business",
    "business name",
    "company",
    "company name",
    "organization",
    "organisation",
    "title",
    "store",
    "shop",
  ],
  phone: [
    "phone",
    "phone number",
    "telephone",
    "tel",
    "tel number",
    "mobile",
    "cell",
    "whatsapp",
    "contact number",
    "contact",
  ],
  email: ["email", "e mail", "email address", "mail"],
  website: ["website", "web site", "url", "site", "web", "homepage", "domain"],
  address: ["address", "street", "street address", "location", "full address"],
  city: ["city", "town", "locality"],
  category: ["category", "type", "industry", "segment", "sector"],
  notes: ["notes", "note", "comment", "comments", "description"],
};

export type LeadCsvField = keyof typeof FIELD_ALIASES;

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Map each column index to a known lead field (or null when unrecognized). */
export function mapHeaders(headers: string[]): (LeadCsvField | null)[] {
  return headers.map((header) => {
    const normalized = normalizeHeader(header);
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (aliases.includes(normalized)) return field as LeadCsvField;
    }
    return null;
  });
}
