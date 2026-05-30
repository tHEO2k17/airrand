export function merchantRealtimeChannel(merchantId: string): string {
  return `airrand:rt:merchant:${merchantId}`;
}

export function orderRealtimeChannel(merchantId: string, orderId: string): string {
  return `airrand:rt:order:${merchantId}:${orderId}`;
}
