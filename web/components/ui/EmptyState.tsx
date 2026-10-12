import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      {icon && (
        <div className="mb-1 flex size-12 items-center justify-center rounded-full bg-primary-light text-primary">
          {icon}
        </div>
      )}
      <p className="text-base font-semibold text-text-primary">{title}</p>
      {subtitle && (
        <p className="max-w-sm text-sm text-text-hint">{subtitle}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
