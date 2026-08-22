import { StatusPill } from "./StatusPill";

export interface AuditEntry {
  id?: string;
  admin: { fullName: string; email?: string };
  action: "approved" | "rejected" | "requested_more_info" | string;
  notes?: string;
  created_at: string;
}

export interface AuditTrailListProps {
  entries: AuditEntry[];
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function AuditTrailList({ entries }: AuditTrailListProps) {
  if (entries.length === 0) {
    return <p className="py-4 text-center text-[13px] text-text-hint">No review actions yet</p>;
  }

  return (
    <ol className="relative space-y-5 border-l border-border pl-5">
      {entries.map((entry, index) => (
        <li key={entry.id ?? index} className="relative">
          <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary-light" />
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={entry.action} variant="audit" />
            <span className="text-[13px] font-medium text-text-primary">{entry.admin.fullName}</span>
            {entry.admin.email && <span className="text-[12px] text-text-hint">{entry.admin.email}</span>}
            <span className="text-[12px] text-text-hint">{formatDate(entry.created_at)}</span>
          </div>
          {entry.notes && <p className="mt-1 text-[13px] text-text-secondary">{entry.notes}</p>}
        </li>
      ))}
    </ol>
  );
}
