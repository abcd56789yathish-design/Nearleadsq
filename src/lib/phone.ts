import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

/**
 * Normalize a messy OSM phone string to E.164.
 * Handles multi-number strings ("+1 555-123; +1 555-456") by taking the
 * first valid number. Country hint comes from the geocoded location.
 */
export function toE164(raw: string | null | undefined, country?: string | null): string | null {
  if (!raw) return null;

  const candidates = raw.split(/[;,/]/).map((part) => part.trim()).filter(Boolean);
  for (const candidate of candidates) {
    try {
      const phone = parsePhoneNumberFromString(
        candidate,
        (country as CountryCode) ?? undefined
      );
      if (phone?.isValid()) return phone.number;
    } catch {
      // fall through to next candidate
    }
  }
  return null;
}
