"use client";

import { forwardRef, useId, type TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const descriptionId = error || hint ? `${textareaId}-description` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionId}
          className={`min-h-24 w-full resize-y rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-primary/60 ${error ? "border-error" : ""} ${className}`}
          {...props}
        />
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

Textarea.displayName = "Textarea";
