"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApiRequestError } from "@/lib/api";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/admin/StatusPill";
import { EvidenceViewer } from "@/components/admin/EvidenceViewer";
import { AuditTrailList, type AuditEntry } from "@/components/admin/AuditTrailList";
import { ReviewActionBar, type ReviewAction } from "@/components/admin/ReviewActionBar";
import { toast } from "@/components/ui/Toast";
import { timeAgo } from "@/lib/users";

interface VerificationRecordDetail {
  id: string;
  provider?: { fullName?: string; email?: string; phone?: string } | null;
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

interface ReviewResponse {
  record: { id: string; status: string; reviewed_by: string; reviewed_at: string };
  overall_status: string;
}

const REVIEWABLE_STATUSES = ["pending_review", "scheduled"];

const humanize = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default function AdminVerificationDetailPage() {
  const { recordId } = useParams<{ recordId: string }>();
  const { call } = useAdminApi();

  const [record, setRecord] = useState<VerificationRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [busyAction, setBusyAction] = useState<ReviewAction | null>(null);
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const data = await call<VerificationRecordDetail>(`/providers/admin/records/${recordId}`);
        if (cancelled) return;
        setRecord(data);
        setIsOverdue(
          !!data.sla_due_at &&
            new Date(data.sla_due_at).getTime() < Date.now() &&
            REVIEWABLE_STATUSES.includes(data.status),
        );
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiRequestError && err.status === 404) setNotFound(true);
        else setError(true);
        setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [recordId, call]);

  const refetch = async () => {
    const data = await call<VerificationRecordDetail>(`/providers/admin/records/${recordId}`);
    setRecord(data);
    setIsOverdue(
      !!data.sla_due_at &&
        new Date(data.sla_due_at).getTime() < Date.now() &&
        REVIEWABLE_STATUSES.includes(data.status),
    );
  };

  const handleReview = async (action: "approve" | "reject" | "request_info", reason?: string) => {
    setBusyAction(action);
    try {
      const result = await call<ReviewResponse>(`/providers/admin/records/${recordId}/review`, {
        method: "POST",
        body: { action, ...(reason ? { reason } : {}) },
      });
      if (action === "approve") {
        toast.success(`Record approved — provider is now ${humanize(result.overall_status)}`);
      } else if (action === "reject") {
        toast.success(`Record rejected — provider is now ${humanize(result.overall_status)}`);
      } else {
        toast.success(`Info requested — provider is now ${humanize(result.overall_status)}`);
      }
      await refetch();
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        toast.error("This record is no longer pending review");
        await refetch().catch(() => undefined);
      } else {
        toast.error("Action failed, please try again");
      }
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center">
        <p className="text-[15px] font-semibold text-text-primary">Record not found</p>
        <p className="mt-1 text-[13px] text-text-hint">This verification record may have been removed.</p>
        <Link
          href="/admin/verification"
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Back to verification
        </Link>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center">
        <p className="text-[14px] text-text-secondary">Failed to load verification record</p>
        <Button
          size="sm"
          variant="secondary"
          className="mt-4"
          onClick={() => {
            setLoading(true);
            setError(false);
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  const providerName = record.provider?.fullName ?? "Unknown provider";
  const reviewable = REVIEWABLE_STATUSES.includes(record.status);

  const subtitle = [
    record.skill_item?.name ?? record.category?.name ?? "—",
    record.category?.name ? `${record.category.name}` : null,
    `${humanize(record.verification_track)} track`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-[13px] text-text-hint">
        <Link href="/admin/verification" className="transition-colors hover:text-primary">
          Verification
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{providerName}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[24px] font-bold text-text-primary">Verification Review — {providerName}</h1>
        <StatusPill status={record.status} variant="verification" />
      </div>
      <div className="-mt-3 flex flex-wrap items-center gap-3">
        <p className="text-[13px] text-text-hint">
          {subtitle} · Submitted {timeAgo(record.created_at ?? "")}
        </p>
        {record.sla_due_at && (
          <span className={`text-[13px] ${isOverdue ? "font-semibold text-error" : "text-text-secondary"}`}>
            SLA due {timeAgo(record.sla_due_at)}
          </span>
        )}
        {isOverdue && (
          <span className="rounded-full bg-error-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-error">
            Overdue
          </span>
        )}
      </div>

      <Card title="Evidence">
        <EvidenceViewer
          evidencePayload={record.evidence_payload}
          evidenceType={record.evidence_type}
          autoCheckResult={record.auto_check_result}
        />
      </Card>

      {record.auto_check_result && Object.keys(record.auto_check_result).length > 0 && (
        <Card title="Auto-check">
          <EvidenceViewer evidencePayload={record.auto_check_result} />
        </Card>
      )}

      <Card title="Audit Trail">
        <AuditTrailList entries={record.audit_trail ?? []} />
      </Card>

      <Card title="Review">
        {reviewable ? (
          <ReviewActionBar
            onApprove={() => handleReview("approve")}
            onReject={(reason) => handleReview("reject", reason)}
            onRequestInfo={(reason) => handleReview("request_info", reason)}
            busyAction={busyAction}
          />
        ) : (
          <ReviewActionBar
            disabled
            disabledNote={`This record has already been reviewed — status: ${humanize(record.status)}`}
          />
        )}
      </Card>
    </div>
  );
}
