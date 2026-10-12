"use client";

import { forwardRef, useId, type SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, className = "", id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const descriptionId = error || hint ? `${selectId}-description` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionId}
          className={`min-h-10 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/60 ${error ? "border-error" : ""} ${className}`}
          {...props}
        >
          {options
            ? options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))
            : children}
        </select>
        {(error || hint) && (
          <p
            id={descriptionId}
            className={`mt-1 text-xs ${error ? "text-error" : "text-text-hint"}`}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
