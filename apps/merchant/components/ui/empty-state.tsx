import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="pos-empty">
      <div className="pos-empty__icon" aria-hidden>
        <Icon size={28} strokeWidth={1.75} />
      </div>
      <p className="pos-empty__title">{title}</p>
      {description ? <p className="pos-empty__desc">{description}</p> : null}
    </div>
  );
}
