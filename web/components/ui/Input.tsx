"use client";

import { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...rest }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-10 w-full rounded-[10px] border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-primary/60 ${
            error ? "border-error" : ""
          } ${className}`}
          aria-invalid={!!error}
          {...rest}
        />
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
        {!error && hint && <p className="mt-1 text-xs text-text-hint">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
