import { LoaderCircle } from "lucide-react";

export interface SpinnerProps {
  label?: string;
  className?: string;
  size?: number;
}

export function Spinner({
  label = "Loading",
  className = "",
  size = 20,
}: SpinnerProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-sm text-text-secondary ${className}`}
      role="status"
    >
      <LoaderCircle
        className="animate-spin text-primary"
        size={size}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
