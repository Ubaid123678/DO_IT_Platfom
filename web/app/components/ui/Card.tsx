export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

export function Card({ title, subtitle, action, className = "", children, ...rest }: CardProps) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-5 ${className}`} {...rest}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="text-[18px] font-semibold text-text-primary">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-[13px] text-text-hint">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
