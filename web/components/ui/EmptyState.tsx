export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      {icon && (
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
          {icon}
        </div>
      )}
      <p className="text-[15px] font-semibold text-text-primary">{title}</p>
      {subtitle && <p className="max-w-sm text-[13px] text-text-hint">{subtitle}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
