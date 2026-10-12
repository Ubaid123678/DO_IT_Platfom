"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { ImageViewer } from "@/components/ui/ImageViewer";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "@/components/ui/Toaster";
import { useAdminApi } from "@/hooks/useAdminApi";
import { useAdminQuery } from "@/hooks/useAdminQuery";
import { ApiRequestError, API_ORIGIN } from "@/lib/api";

type ReviewAction = "approve" | "reject" | "request_info";
type ReviewableStatus = "pending_review" | "scheduled";

interface ProviderSummary {
  _id?: string;
  id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

interface VerificationRecordDetail {
  id: string;
  provider?: ProviderSummary | null;
  category?: { name?: string; job_type?: string } | null;
  skill_item?: { name?: string } | null;
  verification_track: string;
  evidence_type: string;
  evidence_payload: Record<string, unknown>;
  status: string;
  auto_check_result: Record<string, unknown> | null;
  sla_due_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  audit_trail: AuditEntry[];
}

interface AuditEntry {
  id: string;
  admin?: { fullName?: string; email?: string } | null;
  action: string;
  notes?: string | null;
  created_at: string;
}

interface ReviewResponse {
  record: { id: string; status: string };
  overall_status: string;
}

interface EvidenceUriItem {
  uri: string;
  [key: string]: unknown;
}

const REVIEWABLE_STATUSES: ReviewableStatus[] = ["pending_review", "scheduled"];

const statusVariants: Record<string, BadgeVariant> = {
  draft: "incomplete",
  pending_review: "pending",
  scheduled: "scheduled",
  auto_approved: "approved",
  approved: "approved",
  rejected: "rejected",
  expired: "overdue",
};

const humanize = (value: string): string =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isEvidenceUri = (value: unknown): value is EvidenceUriItem =>
  isPlainObject(value) && typeof value.uri === "string" && value.uri.length > 0;

const isEvidenceUriArray = (value: unknown): value is EvidenceUriItem[] =>
  Array.isArray(value) && value.length > 0 && value.every(isEvidenceUri);

const formatDate = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
};

const safeJson = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
};

const imageSource = (uri: string): string => {
  if (/^(data:|blob:|https?:\/\/)/i.test(uri)) return uri;
  if (uri.startsWith("/uploads/kyc/")) return uri;
  if (uri.startsWith("/")) return `${API_ORIGIN}${uri}`;
  return `${API_ORIGIN}/${uri}`;
};

const scoreFrom = (result: Record<string, unknown>): number | null => {
  const value = result.verification_score ?? result.github_score ?? result.score;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(1, value));
};

function DetailRows({ value }: { value: Record<string, unknown> }) {
  const visibleEntries = Object.entries(value).filter(
    ([, item]) => item !== null && item !== undefined && item !== "",
  );
  if (visibleEntries.length === 0) {
    return <p className="text-sm text-text-hint">No details provided.</p>;
  }

  return (
    <dl className="divide-y divide-border/70">
      {visibleEntries.map(([key, item]) => (
        <div
          key={key}
          className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2.5"
        >
          <dt className="text-sm text-text-secondary">{humanize(key)}</dt>
          <dd className="max-w-[70%] whitespace-pre-wrap break-words text-right text-sm font-medium text-text-primary">
            {typeof item === "object" ? safeJson(item) : String(item)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function EvidenceItemCard({ item }: { item: EvidenceUriItem }) {
  const title =
    typeof item.name === "string"
      ? item.name
      : typeof item.caption === "string"
        ? item.caption
        : "Evidence image";
  const metadata = Object.fromEntries(
    Object.entries(item).filter(([key]) => !["uri", "name", "caption"].includes(key)),
  );

  return (
    <article className="min-w-0 rounded-xl border border-border bg-surface p-3">
      <ImageViewer
        src={imageSource(item.uri)}
        alt={title}
        authenticated={item.uri.startsWith("/uploads/kyc/")}
        className="aspect-square"
      />
      {typeof item.name === "string" && (
        <h3 className="mt-3 text-sm font-semibold text-text-primary">{item.name}</h3>
      )}
      {typeof item.caption === "string" && (
        <p className="mt-1 text-sm text-text-secondary">{item.caption}</p>
      )}
      {Object.keys(metadata).length > 0 && (
        <div className="mt-2">
          <DetailRows value={metadata} />
        </div>
      )}
    </article>
  );
}

function EvidenceSection({
  fieldName,
  label,
  value,
}: {
  fieldName: string;
  label: string;
  value: unknown;
}) {
  const normalizedFieldName = fieldName.toLowerCase();
  if (isEvidenceUriArray(value)) {
    return (
      <Card title={label}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((item, index) => (
            <EvidenceItemCard key={`${label}-${item.uri}-${index}`} item={item} />
          ))}
        </div>
      </Card>
    );
  }

  if (isPlainObject(value)) {
    if (typeof value.url === "string") {
      return (
        <Card title={label}>
          <div className="space-y-3">
            <a
              href={value.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 break-all text-sm font-medium text-primary hover:text-primary-dark"
            >
              {value.url}
              <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
            </a>
            {typeof value.description === "string" && (
              <p className="whitespace-pre-wrap text-sm leading-6 text-text-secondary">
                {value.description}
              </p>
            )}
            <DetailRows
              value={Object.fromEntries(
                Object.entries(value).filter(
                  ([key]) => !["url", "description"].includes(key),
                ),
              )}
            />
          </div>
        </Card>
      );
    }

    if (typeof value.uri === "string") {
      return (
        <Card title={label}>
          <div className="grid gap-4 md:grid-cols-[minmax(0,18rem)_1fr]">
            <EvidenceItemCard item={value as EvidenceUriItem} />
            <DetailRows
              value={Object.fromEntries(
                Object.entries(value).filter(([key]) => key !== "uri"),
              )}
            />
          </div>
        </Card>
      );
    }

    if (
      normalizedFieldName.includes("oauth") ||
      "connected" in value ||
      "username" in value
    ) {
      return (
        <Card title={label}>
          <DetailRows value={value} />
        </Card>
      );
    }

    if (
      normalizedFieldName.includes("service_area") ||
      "city" in value ||
      "radius_km" in value
    ) {
      return (
        <Card title={label}>
          <pre className="max-h-96 overflow-auto rounded-xl bg-bg p-3 text-xs text-text-secondary">
            {safeJson(value)}
          </pre>
        </Card>
      );
    }

    return (
      <Card title={label}>
        <DetailRows value={value} />
      </Card>
    );
  }

  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string")) {
      return (
        <Card title={label}>
          {value.length ? (
            <ul className="list-inside list-disc space-y-1 text-sm text-text-primary">
              {value.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-hint">No items provided.</p>
          )}
        </Card>
      );
    }
    if (value.every(isPlainObject)) {
      return (
        <Card title={label}>
          <div className="space-y-3">
            {value.map((item, index) => (
              <div
                key={`${label}-${index}`}
                className="rounded-xl border border-border bg-bg/40 p-3"
              >
                <DetailRows value={item} />
              </div>
            ))}
          </div>
        </Card>
      );
    }
  }

  if (value === null || value === undefined || value === "") {
    return (
      <Card title={label}>
        <p className="text-sm text-text-hint">No details provided.</p>
      </Card>
    );
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return (
      <Card title={label}>
        <p className="whitespace-pre-wrap break-words text-sm text-text-primary">
          {String(value)}
        </p>
      </Card>
    );
  }

  return (
    <Card title={label}>
      <pre className="max-h-96 overflow-auto rounded-xl bg-bg p-3 text-xs text-text-secondary">
        {safeJson(value)}
      </pre>
    </Card>
  );
}

function AuditTrail({ entries }: { entries: AuditEntry[] }) {
  if (!entries.length) {
    return <p className="py-3 text-sm text-text-hint">No review actions yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="rounded-xl border border-border bg-bg/40 p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{humanize(entry.action)}</Badge>
            <span className="text-sm font-semibold text-text-primary">
              {entry.admin?.fullName ?? "Admin"}
            </span>
            {entry.admin?.email && (
              <span className="text-xs text-text-hint">{entry.admin.email}</span>
            )}
            <time
              dateTime={entry.created_at}
              className="text-xs text-text-hint"
            >
              {formatDate(entry.created_at)}
            </time>
          </div>
          {entry.notes && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">
              {entry.notes}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading verification record">
      <Skeleton className="h-5 w-56" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-60 w-full" />
      <Skeleton className="h-44 w-full" />
      <Skeleton className="h-36 w-full" />
    </div>
  );
}

export default function AdminVerificationDetailPage() {
  const { recordId } = useParams<{ recordId: string }>();
  const routerParams = `/providers/admin/records/${encodeURIComponent(recordId)}`;
  const { call } = useAdminApi();
  const { data: record, loading, error, refetch } =
    useAdminQuery<VerificationRecordDetail>(routerParams);
  const [busyAction, setBusyAction] = useState<ReviewAction | null>(null);
  const [activeReasonAction, setActiveReasonAction] = useState<
    Exclude<ReviewAction, "approve"> | null
  >(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [overallStatus, setOverallStatus] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  const reviewable = Boolean(
    record && REVIEWABLE_STATUSES.includes(record.status as ReviewableStatus),
  );
  const isOverdue = Boolean(
    record?.sla_due_at &&
      currentTime !== null &&
      Number.isFinite(new Date(record.sla_due_at).getTime()) &&
      new Date(record.sla_due_at).getTime() < currentTime,
  );
  const providerId = record?.provider?._id ?? record?.provider?.id;
  const providerName = record?.provider?.fullName ?? "Unknown provider";
  const subtitle = useMemo(() => {
    if (!record) return "";
    const skill = record.skill_item?.name ?? "—";
    const category = record.category?.name ?? "—";
    return `${category} · ${skill} · ${humanize(record.verification_track)} track`;
  }, [record]);
  const notFound = error instanceof ApiRequestError && error.status === 404;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setCurrentTime(Date.now()), 0);
    return () => window.clearTimeout(timeoutId);
  }, [record?.sla_due_at]);

  const handleReview = useCallback(
    async (action: ReviewAction, suppliedReason?: string) => {
      if (!record || !reviewable) return;
      const cleanReason = suppliedReason?.trim();
      if (action !== "approve" && (!cleanReason || cleanReason.length < 3)) {
        setReasonError(
          cleanReason
            ? "Reason must be at least 3 characters"
            : "Reason is required",
        );
        return;
      }

      setBusyAction(action);
      try {
        const result = await call<ReviewResponse>(
          `/providers/admin/records/${encodeURIComponent(recordId)}/review`,
          {
            method: "POST",
            body: {
              action,
              ...(cleanReason ? { reason: cleanReason } : {}),
            },
          },
        );
        setOverallStatus(result.overall_status);
        toast.success(
          `Record ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "updated"} — provider overall status: ${humanize(result.overall_status)}`,
        );
        setActiveReasonAction(null);
        setReason("");
        setReasonError("");
        refetch();
      } catch (requestError: unknown) {
        if (
          requestError instanceof ApiRequestError &&
          requestError.status === 409 &&
          requestError.code === "RECORD_NOT_PENDING"
        ) {
          toast.error("This record is no longer pending review");
          refetch();
        } else {
          toast.error("Action failed, please try again");
        }
      } finally {
        setBusyAction(null);
      }
    },
    [call, record, recordId, refetch, reviewable],
  );

  if (loading) return <DetailSkeleton />;

  if (notFound) {
    return (
      <div className="space-y-5">
        <Link
          href="/admin/verification"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to verification
        </Link>
        <div className="rounded-2xl border border-border bg-surface p-10 text-center">
          <h1 className="font-semibold text-text-primary">Record not found</h1>
          <p className="mt-1 text-sm text-text-hint">
            This verification record may have been removed.
          </p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <ErrorState
        title="Failed to load verification record"
        message={error?.message ?? "The record could not be loaded."}
        onRetry={refetch}
        retryLabel="Retry"
      />
    );
  }

  const autoScore = scoreFrom(record.auto_check_result ?? {});
  const autoScorePercent = autoScore === null ? null : Math.round(autoScore * 100);
  const isHighAutoScore = (autoScorePercent ?? 0) >= 70;
  const isMediumAutoScore =
    autoScorePercent !== null && autoScorePercent >= 40 && autoScorePercent < 70;
  const autoScoreColor =
    autoScore === null
      ? "text-text-primary"
      : isHighAutoScore
        ? "text-success"
        : isMediumAutoScore
          ? "text-amber"
          : "text-error";

  return (
    <div className="space-y-6">
      <nav
        className="flex items-center gap-2 text-sm text-text-hint"
        aria-label="Breadcrumb"
      >
        <Link href="/admin/verification" className="hover:text-primary">
          Verification
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-text-primary">{providerName}</span>
      </nav>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-text-primary">
              {providerName}
            </h1>
            {record.provider?.email && (
              <p className="mt-1 text-sm text-text-secondary">
                {record.provider.email}
              </p>
            )}
            <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariants[record.status] ?? "neutral"}>
              {humanize(record.status)}
            </Badge>
            {providerId && (
              <Link
                href={`/admin/users/${providerId}/profile`}
                className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-primary px-3 text-sm font-medium text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Provider profile
                <span className="sr-only">for {providerName}</span>
              </Link>
            )}
          </div>
          <div className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4">
            <p className="text-sm text-text-secondary">
              Submitted <time dateTime={record.created_at}>{formatDate(record.created_at)}</time>
            </p>
            {record.sla_due_at && (
              <p className={`text-sm ${isOverdue ? "font-semibold text-error" : "text-text-secondary"}`}>
                SLA due <time dateTime={record.sla_due_at}>{formatDate(record.sla_due_at)}</time>
              </p>
            )}
            {isOverdue && <Badge variant="overdue">OVERDUE</Badge>}
          </div>
        </div>
      </Card>

      <section className="space-y-4" aria-label="Evidence payload">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Evidence</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Evidence type: {humanize(record.evidence_type)}
          </p>
        </div>
        {Object.entries(record.evidence_payload ?? {}).length > 0 ? (
          Object.entries(record.evidence_payload ?? {}).map(([key, value]) => (
            <EvidenceSection
              key={key}
              fieldName={key}
              label={humanize(key)}
              value={value}
            />
          ))
        ) : (
          <Card title="Evidence payload">
            <p className="text-sm text-text-hint">No evidence payload provided.</p>
          </Card>
        )}
      </section>

      {record.auto_check_result &&
        Object.keys(record.auto_check_result).length > 0 && (
          <Card
            title="Automated checks"
            subtitle="Results generated during evidence verification."
          >
            <div className="space-y-4 rounded-xl border border-primary/30 bg-primary-light/60 p-4">
              {autoScorePercent !== null && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      Verification score
                    </p>
                    <p className={`mt-1 text-2xl font-bold ${autoScoreColor}`}>
                      {autoScorePercent}%
                    </p>
                  </div>
                  <div
                    className="h-3 min-w-40 flex-1 overflow-hidden rounded-full bg-border"
                    role="progressbar"
                    aria-label="Verification score"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={autoScorePercent}
                  >
                    <div
                      className={`h-full rounded-full ${
                        isHighAutoScore
                          ? "bg-success"
                          : isMediumAutoScore
                            ? "bg-amber"
                            : "bg-error"
                      }`}
                      style={{ width: `${autoScorePercent}%` }}
                    />
                  </div>
                </div>
              )}
              <DetailRows value={record.auto_check_result} />
            </div>
          </Card>
        )}

      <Card title="Audit trail">
        <AuditTrail entries={record.audit_trail ?? []} />
      </Card>

      <Card
        title="Review"
        subtitle={
          overallStatus
            ? `Provider overall status: ${humanize(overallStatus)}`
            : "Choose an action for this verification record."
        }
      >
        {reviewable ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                loading={busyAction === "approve"}
                disabled={busyAction !== null}
                onClick={() => void handleReview("approve")}
              >
                Approve
              </Button>
              <Button
                variant="secondary"
                disabled={busyAction !== null}
                onClick={() => {
                  setReason("");
                  setReasonError("");
                  setActiveReasonAction("request_info");
                }}
              >
                Request info
              </Button>
              <Button
                variant="danger"
                disabled={busyAction !== null}
                onClick={() => {
                  setReason("");
                  setReasonError("");
                  setActiveReasonAction("reject");
                }}
              >
                Reject
              </Button>
            </div>
            {activeReasonAction && (
              <div className="space-y-3 rounded-xl border border-border bg-bg/40 p-4">
                <Textarea
                  label={
                    activeReasonAction === "reject"
                      ? "Rejection reason"
                      : "Reason for requesting information"
                  }
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    if (reasonError) setReasonError("");
                  }}
                  rows={3}
                  maxLength={1000}
                  placeholder={
                    activeReasonAction === "reject"
                      ? "Explain why this evidence is being rejected"
                      : "Explain what additional information is needed"
                  }
                  error={reasonError}
                  aria-required="true"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyAction !== null}
                    onClick={() => {
                      setActiveReasonAction(null);
                      setReason("");
                      setReasonError("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant={activeReasonAction === "reject" ? "danger" : "primary"}
                    loading={busyAction === activeReasonAction}
                    disabled={busyAction !== null}
                    onClick={() =>
                      void handleReview(activeReasonAction, reason)
                    }
                  >
                    {activeReasonAction === "reject"
                      ? "Confirm rejection"
                      : "Send request"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            Review actions are disabled because this record is {humanize(record.status)}.
          </p>
        )}
      </Card>
    </div>
  );
}
