/** Minimal phone validation for guest checkout — not OTP or carrier lookup. */
const CUSTOMER_PHONE_PATTERN = /^\+?[\d\s\-().]{7,20}$/;

export function isValidCustomerPhone(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 7 || trimmed.length > 20) {
    return false;
  }
  if (!CUSTOMER_PHONE_PATTERN.test(trimmed)) {
    return false;
  }
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}
