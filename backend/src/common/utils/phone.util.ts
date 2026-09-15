/** Last 10 digits for Indian mobiles so +91, 91, and 0-prefix match. */
export function normalizeMobile(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

export function mobileMatchVariants(raw: string): string[] {
  const ten = normalizeMobile(raw);
  if (!ten) return [raw.trim()];
  return [...new Set([raw.trim(), ten, `+91${ten}`, `91${ten}`, `0${ten}`])];
}
