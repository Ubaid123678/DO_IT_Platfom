export type StatusVariant = "kyc" | "verification" | "overall" | "ban" | "audit";

export interface StatusPillProps {
  status: string;
  variant?: StatusVariant;
}

type PillStyle = {
  bg: string;
  text: string;
  dot: string;
};

const neutralStyle: PillStyle = {
  bg: "bg-border/50",
  text: "text-text-hint",
  dot: "bg-text-hint",
};

const styleForStatus = (status: string): PillStyle => {
  const key = status.toLowerCase();
  if (["pending", "pending_review", "scheduled", "partially_verified", "requested_more_info"].includes(key)) {
    return { bg: "bg-amber-light", text: "text-amber", dot: "bg-amber" };
  }
  if (["approved", "verified", "auto_approved", "active"].includes(key)) {
    return { bg: "bg-success-light", text: "text-success", dot: "bg-success" };
  }
  if (["rejected", "expired", "banned", "suspended"].includes(key)) {
    return { bg: "bg-error-light", text: "text-error", dot: "bg-error" };
  }
  if (["incomplete", "draft", "missing"].includes(key)) {
    return neutralStyle;
  }
  return neutralStyle;
};

const humanize = (status: string) =>
  status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export function StatusPill({ status, variant = "overall" }: StatusPillProps) {
  const style = styleForStatus(status);

  if (variant === "ban") {
    const banned = status.toLowerCase() === "banned" || status.toLowerCase() === "suspended";
    const active = status.toLowerCase() === "active";
    const finalStyle = banned ? styleForStatus("banned") : active ? styleForStatus("active") : neutralStyle;
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold uppercase tracking-wide ${finalStyle.bg} ${finalStyle.text}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${finalStyle.dot}`} />
        {humanize(status)}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold uppercase tracking-wide ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {humanize(status)}
    </span>
  );
}
