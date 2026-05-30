type BadgeTone = "neutral" | "accent" | "success" | "info";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  return <span className={`store-badge store-badge--${tone}`}>{children}</span>;
}

function statusTone(status: string): BadgeTone {
  switch (status) {
    case "placed":
      return "info";
    case "accepted":
      return "accent";
    case "ready":
      return "success";
    default:
      return "neutral";
  }
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={statusTone(status)}>{status.replace("_", " ")}</Badge>
  );
}
