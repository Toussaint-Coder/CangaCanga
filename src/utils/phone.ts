/**
 * Phone helpers for Burundi (+257, 8 local digits).
 *
 * Supabase Auth is used with a phone->email strategy so that no SMS/OTP
 * provider is required (see README). We derive a stable, deterministic
 * pseudo-email from the normalized phone number.
 */

import { env } from "@/config/env";

const BURUNDI_CODE = "257";

/** Normalize any user input to E.164-ish digits, e.g. "+25779123456". */
export function normalizePhone(input: string): string {
  let digits = input.replace(/[^\d]/g, "");

  // Strip leading zeros used in local dialing.
  digits = digits.replace(/^0+/, "");

  // Add country code if the user typed only the 8 local digits.
  if (digits.length === 8) {
    digits = BURUNDI_CODE + digits;
  }
  return `+${digits}`;
}

export function isValidBurundiPhone(input: string): boolean {
  const normalized = normalizePhone(input);
  // +257 followed by 8 digits.
  return /^\+257\d{8}$/.test(normalized);
}

/** Deterministic pseudo-email backing the Supabase Auth account. */
export function phoneToAuthEmail(phone: string): string {
  const normalized = normalizePhone(phone).replace("+", "");
  return `${normalized}@${env.auth.emailDomain}`;
}

export function formatPhoneDisplay(phone: string): string {
  const n = normalizePhone(phone);
  const m = n.match(/^\+257(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!m) return phone;
  return `+257 ${m[1]} ${m[2]} ${m[3]} ${m[4]}`;
}
