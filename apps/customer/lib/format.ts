export function formatMoney(cents: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}
