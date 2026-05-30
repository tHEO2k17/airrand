import type { HTMLAttributes } from "react";

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingClass = {
  none: "",
  sm: "pos-surface--pad-sm",
  md: "pos-surface--pad-md",
  lg: "pos-surface--pad-lg",
};

export function Surface({
  padding = "md",
  className = "",
  children,
  ...props
}: SurfaceProps) {
  return (
    <div
      className={`pos-surface ${paddingClass[padding]} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
