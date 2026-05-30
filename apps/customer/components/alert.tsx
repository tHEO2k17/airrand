type AlertVariant = "error" | "success" | "info";

export function Alert({
  variant,
  message,
}: {
  variant: AlertVariant;
  message: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <div className={`alert alert-${variant}`} role={variant === "error" ? "alert" : "status"}>
      {message}
    </div>
  );
}
