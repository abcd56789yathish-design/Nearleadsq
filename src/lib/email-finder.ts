const EMAIL_REGEX =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const MAILTO_REGEX = /mailto:([^"'?>\s]+)/gi;

const JUNK_DOMAINS =
  /(example\.(com|org|net)|test\.com|sentry\.io|wixpress\.com|godaddy\.com|squarespace\.com|shopify\.com|domain\.com|yourdomain\.(com|org)|email\.com|localhost|\.local)$/i;

const FILE_EXT = /\.(png|jpe?g|gif|webp|svg|css|js|json|xml|ico|woff2?)$/i;

/** Local parts that are clearly hashes/ids, not humans. */
const HASH_LOCAL = /^[a-f0-9]{16,}$/i;
const ROLE_PREFIXES = [
  "info",
  "hello",
  "contact",
  "office",
  "sales",
  "admin",
  "enquiries",
  "inquiries",
  "support",
  "booking",
  "reception",
];

const MAX_PAGE_BYTES = 600_000;
const FETCH_TIMEOUT_MS = 10_000;
const CONTACT_PATHS = ["/contact", "/contact-us", "/about", "/about-us", "/impressum"];
const MIN_DOMAIN_GAP_MS = 750;

const lastFetchByHost = new Map<string, number>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function politeDelay(host: string) {
  const last = lastFetchByHost.get(host) ?? 0;
  const wait = MIN_DOMAIN_GAP_MS - (Date.now() - last);
  if (wait > 0) await sleep(wait);
  lastFetchByHost.set(host, Date.now());
}

export function normalizeWebsite(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let url = raw.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function isJunk(email: string): boolean {
  const localPart = email.split("@")[0] ?? "";
  return (
    email.length > 80 ||
    FILE_EXT.test(email) ||
    JUNK_DOMAINS.test(email.split("@")[1] ?? "") ||
    HASH_LOCAL.test(localPart)
  );
}

function scoreEmail(email: string, siteDomain: string | null): number {
  const [localPart, domain] = email.toLowerCase().split("@");
  let score = 0;
  if (siteDomain && domain === siteDomain) score += 3;
  if (ROLE_PREFIXES.includes(localPart)) score += 2;
  // Prefer short, human-ish local parts over long ones.
  score += Math.max(0, 1 - localPart.length / 30);
  return score;
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    await politeDelay(new URL(url).host);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "NearLeadsQBot/0.1 (+contact lookup for outreach)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html") && !type.includes("text")) return null;
    const text = await res.text();
    return text.slice(0, MAX_PAGE_BYTES);
  } catch {
    return null;
  }
}

function extractEmails(html: string): string[] {
  const found = new Set<string>();

  for (const match of html.matchAll(MAILTO_REGEX)) {
    const candidate = decodeURIComponent(match[1]).trim();
    const clean = candidate.match(EMAIL_REGEX)?.[0];
    if (clean && !isJunk(clean)) found.add(clean.toLowerCase());
  }

  for (const match of html.matchAll(EMAIL_REGEX)) {
    const clean = match[0].toLowerCase();
    if (!isJunk(clean)) found.add(clean);
  }

  return Array.from(found);
}

export interface EmailResult {
  email: string | null;
  sourceUrl: string | null;
}

/**
 * Look for a publicly listed email on a business's website:
 * homepage first, then common contact pages. Returns the best
 * ranked candidate and the page it was found on.
 */
export async function findEmailOnSite(rawUrl: string): Promise<EmailResult> {
  const base = normalizeWebsite(rawUrl);
  if (!base) return { email: null, sourceUrl: null };

  let siteDomain: string | null = null;
  try {
    siteDomain = new URL(base).host.replace(/^www\./, "");
  } catch {
    /* unreachable */
  }

  const pagesToTry = [base];
  try {
    const origin = new URL(base).origin;
    for (const path of CONTACT_PATHS) pagesToTry.push(origin + path);
  } catch {
    /* unreachable */
  }

  for (const url of pagesToTry.slice(0, 4)) {
    const html = await fetchPage(url);
    if (!html) continue;

    const emails = extractEmails(html);
    if (emails.length) {
      emails.sort(
        (a, b) => scoreEmail(b, siteDomain) - scoreEmail(a, siteDomain)
      );
      return { email: emails[0], sourceUrl: url };
    }
  }

  return { email: null, sourceUrl: null };
}
