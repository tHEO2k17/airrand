export const ORDER_REFERENCE_PREFIX = "ORD";

const ORDER_REFERENCE_PATTERN = /^ORD-(\d+)$/;

export function formatOrderReference(sequenceNumber: number): string {
  if (!Number.isInteger(sequenceNumber) || sequenceNumber < 1) {
    throw new Error("Order reference sequence must be a positive integer");
  }

  return `${ORDER_REFERENCE_PREFIX}-${sequenceNumber}`;
}

export function parseOrderReference(reference: string): number | null {
  const match = ORDER_REFERENCE_PATTERN.exec(reference.trim().toUpperCase());
  if (!match) {
    return null;
  }

  return Number.parseInt(match[1]!, 10);
}

/** Normalizes merchant search input to ORD-{n} when possible. */
export function normalizeOrderReferenceQuery(input: string): string {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) {
    return trimmed;
  }

  if (ORDER_REFERENCE_PATTERN.test(trimmed)) {
    return trimmed;
  }

  if (/^\d+$/.test(trimmed)) {
    return formatOrderReference(Number.parseInt(trimmed, 10));
  }

  return trimmed;
}

export function isValidOrderReference(reference: string): boolean {
  return ORDER_REFERENCE_PATTERN.test(reference.trim().toUpperCase());
}
