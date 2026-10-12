import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export function Card({
  title,
  subtitle,
  action,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-border bg-surface p-5 shadow-sm ${className}`}
      {...props}
    >
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-text-hint">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
