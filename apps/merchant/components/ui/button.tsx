import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "pos-btn--primary",
  secondary: "pos-btn--secondary",
  ghost: "pos-btn--ghost",
  danger: "pos-btn--danger",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "pos-btn--sm",
  md: "pos-btn--md",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`pos-btn ${variantClass[variant]} ${sizeClass[size]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
