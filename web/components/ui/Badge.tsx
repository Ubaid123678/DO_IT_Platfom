import type { HTMLAttributes } from "react";

export type BadgeVariant =
  | "approved"
  | "pending"
  | "rejected"
  | "overdue"
  | "incomplete"
  | "partially_verified"
  | "verified"
  | "active"
  | "inactive"
  | "scheduled"
  | "neutral";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  approved: "bg-success-light text-success",
  pending: "bg-amber-light text-amber",
  rejected: "bg-error-light text-error",
  overdue: "bg-error-light text-error",
  incomplete: "bg-border/60 text-text-hint",
  partially_verified: "bg-amber-light text-amber",
  verified: "bg-success-light text-success",
  active: "bg-success-light text-success",
  inactive: "bg-border/60 text-text-hint",
  scheduled: "bg-primary-light text-primary-dark",
  neutral: "bg-border/60 text-text-secondary",
};

export function Badge({
  variant = "neutral",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
