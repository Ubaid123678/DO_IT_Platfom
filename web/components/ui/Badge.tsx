export type BadgeVariant = "primary" | "amber" | "success" | "error" | "warning" | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  primary: "bg-primary-light text-primary-dark",
  amber: "bg-amber-light text-amber",
  success: "bg-success-light text-success",
  error: "bg-error-light text-error",
  warning: "bg-warning-light text-warning",
  neutral: "bg-border/50 text-text-hint",
};

export function Badge({ variant = "neutral", className = "", children, ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
