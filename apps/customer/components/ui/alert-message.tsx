import { AlertCircle, CheckCircle2, Info } from "lucide-react";

type AlertVariant = "error" | "success" | "info";

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

export function AlertMessage({
  variant = "info",
  message,
}: {
  variant?: AlertVariant;
  message: string;
}) {
  const Icon = icons[variant];
  return (
    <div className={`store-alert store-alert--${variant}`} role="alert">
      <Icon size={18} aria-hidden />
      <span>{message}</span>
    </div>
  );
}
