import type { LucideIcon } from "lucide-react";
import { ShoppingBag } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon = ShoppingBag,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="store-empty">
      <div className="store-empty__icon" aria-hidden>
        <Icon size={28} strokeWidth={1.75} />
      </div>
      <p className="store-empty__title">{title}</p>
      {description ? <p className="store-empty__desc">{description}</p> : null}
    </div>
  );
}
