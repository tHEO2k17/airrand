import Link from "next/link";
import { buildStorePath } from "../lib/store-paths";

function merchantInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "?";
  }
  return trimmed.charAt(0).toUpperCase();
}

export function MerchantChip({
  name,
  slug,
}: {
  name: string;
  slug: string;
}) {
  return (
    <Link href={buildStorePath(slug)} className="store-merchant-chip">
      <span className="store-merchant-chip__avatar" aria-hidden>
        {merchantInitial(name)}
      </span>
      <span>{name}</span>
    </Link>
  );
}
