import { ApiError } from './api';

const API_CODE_MESSAGES: Record<string, string> = {
  MERCHANT_NOT_FOUND: 'This shop could not be found. Check the link and try again.',
  ORDER_NOT_FOUND: 'We could not find that order. Check the shop link and order reference.',
  PRODUCT_UNAVAILABLE: 'One or more items are no longer available. Refresh the menu and try again.',
  VALIDATION_ERROR: 'Please check your details and try again.',
  PRODUCT_NOT_FOUND: 'An item in your cart is no longer available.',
  rate_limited: 'Too many requests. Wait a moment and try again.',
  NOT_FOUND: 'We could not find what you requested. Check the link and try again.',
};

export function toCustomerErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (error instanceof ApiError) {
    const mapped = API_CODE_MESSAGES[error.code];
    if (mapped) {
      return mapped;
    }
    if (error.message && error.message.length > 12 && !error.message.includes(':')) {
      return error.message;
    }
    return fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
