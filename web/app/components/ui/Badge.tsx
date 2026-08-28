export type BadgeVariant =
  | "pending"
  | "approved"
  | "rejected"
  | "incomplete"
  | "partially_verified"
  | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  pending: "bg-amber-light text-amber",
  approved: "bg-success-light text-success",
  rejected: "bg-error-light text-error",
  incomplete: "bg-border/50 text-text-hint",
  partially_verified: "bg-amber-light text-amber",
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