import { AlertCircle, CheckCircle2, Info } from "lucide-react";

type AlertVariant = "error" | "success" | "info";

const variantClass: Record<AlertVariant, string> = {
  error: "pos-alert--error",
  success: "pos-alert--success",
  info: "pos-alert--info",
};

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
    <div className={`pos-alert ${variantClass[variant]}`} role="alert">
      <Icon size={18} aria-hidden />
      <span>{message}</span>
    </div>
  );
}
