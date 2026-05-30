export function formatOrderCancelConfirmMessage(reference: string): string {
  return `Cancel order ${reference}? The customer will need to place a new order if they still want these items.`;
}

export function confirmOrderCancel(reference: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.confirm(formatOrderCancelConfirmMessage(reference));
}
