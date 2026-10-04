// Indian mobile numbers arrive as "+91 98765 43210", "098765-43210", "9876543210"...
// normalizePhone() stores them all as the plain 10 digits. Anything that is not clearly an
// Indian mobile number is left as typed (trimmed), so nothing useful is ever thrown away.
export function normalizePhone(raw: string | null | undefined): string | null {
  const text = (raw ?? "").toString().trim();
  if (!text) return null;

  let digits = text.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2); // +91 / 91
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1); // leading 0

  return /^[6-9]\d{9}$/.test(digits) ? digits : text;
}
