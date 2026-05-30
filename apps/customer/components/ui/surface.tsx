import type { HTMLAttributes } from "react";

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingClass = {
  none: "",
  sm: "store-surface--pad-sm",
  md: "store-surface--pad-md",
  lg: "store-surface--pad-lg",
};

export function Surface({
  padding = "md",
  className = "",
  children,
  ...props
}: SurfaceProps) {
  return (
    <div
      className={`store-surface ${paddingClass[padding]} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
