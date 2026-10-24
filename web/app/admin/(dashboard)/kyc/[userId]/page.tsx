"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { ImageViewer } from "@/components/ui/ImageViewer";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "@/components/ui/Toaster";
import { useAdminQuery } from "@/hooks/useAdminQuery";
import { ApiRequestError, apiRequest } from "@/lib/api";
import type { KycSubmissionDetail } from "@/types/kyc";

type ReviewAction = "approve" | "reject";

const statusVariants: Record<string, BadgeVariant> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
};

const documentLabels: Record<string, string> = {
  pass: "Passport",
  passport: "Passport",
  driving_license: "Driving license",
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
};

function KycDetailSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading KYC submission" aria-busy="true">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-72 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-36 w-full" />
    </div>
  );
}

export default function AdminKycDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const path = `/kyc/admin/submissions/${encodeURIComponent(userId)}`;
  const { data, loading, error, refetch } =
    useAdminQuery<KycSubmissionDetail>(path);
  const [dialogAction, setDialogAction] = useState<ReviewAction | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const isNotFound = error instanceof ApiRequestError && error.status === 404;
  const isPending = data?.status === "pending";
  const isApproved = data?.status === "approved";
  const canApprove = isPending;
  const canReject = isPending || isApproved;

  const submitReview = async () => {
    if (!dialogAction) return;
    if (dialogAction === "approve" && !canApprove) return;
    if (dialogAction === "reject" && !canReject) return;
    const trimmedReason = reason.trim();
    if (dialogAction === "reject" && !trimmedReason) {
      setReasonError("Rejection reason is required");
      return;
    }

    setActionLoading(true);
    try {
      const endpoint =
        dialogAction === "approve"
          ? `/kyc/admin/${encodeURIComponent(userId)}/approve`
          : `/kyc/admin/${encodeURIComponent(userId)}/reject`;
      await apiRequest(endpoint, {
        method: "PATCH",
        ...(dialogAction === "reject" ? { body: { reason: trimmedReason } } : {}),
      });
      toast.success(dialogAction === "approve" ? "KYC approved" : "KYC rejected");
      router.push("/admin/kyc");
    } catch {
      toast.error("Action failed, please try again");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <KycDetailSkeleton />;

  if (isNotFound) {
    return (
      <div className="space-y-5">
        <Link
          href="/admin/kyc"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to KYC review
        </Link>
        <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center">
          <h1 className="text-base font-semibold text-text-primary">
            KYC submission not found
          </h1>
          <p className="mt-1 text-sm text-text-hint">
            This user does not have a KYC submission to review.
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Failed to load KYC submission"
        message={error?.message ?? "The submission could not be loaded."}
        onRetry={refetch}
        retryLabel="Retry"
      />
    );
  }

  const documentImages = [
    { key: "front", label: "Document front", src: data.documentImages.front },
    { key: "back", label: "Document back", src: data.documentImages.back },
  ];
  const livenessImages = [
    {
      key: "face_clear",
      label: "Face clear",
      src: data.livenessImages.face_clear,
    },
    {
      key: "move_left",
      label: "Move left",
      src: data.livenessImages.move_left,
    },
    {
      key: "move_right",
      label: "Move right",
      src: data.livenessImages.move_right,
    },
    { key: "smile", label: "Smile", src: data.livenessImages.smile },
  ];

  const dialogMessage = (
    <div className="space-y-4">
      {dialogAction === "approve" ? (
        <p className="text-sm leading-6 text-text-secondary">
          Approve this KYC submission? The user&apos;s verification status will
          be updated.
        </p>
      ) : (
        <>
          <p className="text-sm leading-6 text-text-secondary">
            Provide a reason for rejecting this KYC submission.
          </p>
          <Textarea
            label="Rejection reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (reasonError) setReasonError("");
            }}
            rows={4}
            maxLength={500}
            placeholder="Explain why the submission is being rejected"
            error={reasonError}
            aria-required="true"
          />
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <nav
        className="flex items-center gap-2 text-sm text-text-hint"
        aria-label="Breadcrumb"
      >
        <Link href="/admin/kyc" className="hover:text-primary">
          KYC Review
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-text-primary">{data.userId}</span>
      </nav>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">KYC submission</h1>
          <p className="mt-1 text-sm text-text-secondary">
            User ID: {data.userId}
          </p>
        </div>
        <Badge variant={statusVariants[data.status] ?? "neutral"}>
          {data.status[0].toUpperCase() + data.status.slice(1)}
        </Badge>
      </header>

      <Card title="Identity document">
        <div className="grid gap-4 sm:grid-cols-2">
          {documentImages.map((image) => (
            <section key={image.key} aria-label={image.label}>
              <h2 className="mb-2 text-sm font-medium text-text-secondary">
                {image.label}
              </h2>
              <ImageViewer
                src={image.src}
                alt={image.label}
                authenticated
                className="min-h-52"
                maxHeight="max-h-[32rem]"
              />
            </section>
          ))}
        </div>
        <dl className="mt-5 grid gap-x-8 border-t border-border pt-3 sm:grid-cols-2">
          <div className="flex justify-between gap-3 border-b border-border/60 py-3">
            <dt className="text-sm text-text-secondary">Document type</dt>
            <dd className="text-right text-sm font-medium text-text-primary">
              {documentLabels[data.documentType] ?? data.documentType}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-border/60 py-3">
            <dt className="text-sm text-text-secondary">Country</dt>
            <dd className="text-right text-sm font-medium text-text-primary">
              {data.countryCode || "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3 py-3 sm:col-span-2">
            <dt className="text-sm text-text-secondary">Submitted</dt>
            <dd className="text-right text-sm font-medium text-text-primary">
              {formatDate(data.submittedAt)}
            </dd>
          </div>
        </dl>
      </Card>

      <Card title="Liveness photos">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {livenessImages.map((image) => (
            <section key={image.key} aria-label={image.label}>
              <h2 className="mb-2 text-sm font-medium text-text-secondary">
                {image.label}
              </h2>
              <ImageViewer
                src={image.src}
                alt={image.label}
                authenticated
                className="aspect-square"
                imageClassName="max-h-full"
              />
            </section>
          ))}
        </div>
      </Card>

      {(data.rejectionReason || data.status === "rejected") && (
        <Card title="Rejection details">
          <p className="whitespace-pre-wrap text-sm leading-6 text-text-secondary">
            {data.rejectionReason || "No rejection reason was provided."}
          </p>
        </Card>
      )}

      <Card title="Review decision">
        {canApprove || canReject ? (
          <div className="space-y-3">
            {isApproved && (
              <p className="text-sm leading-6 text-text-secondary">
                This KYC is currently approved. You can revoke it by rejecting
                with a reason.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {canApprove && (
                <Button onClick={() => setDialogAction("approve")}>
                  Approve
                </Button>
              )}
              <Button
                variant="danger"
                onClick={() => {
                  setReason("");
                  setReasonError("");
                  setDialogAction("reject");
                }}
              >
                {isApproved ? "Reject approved KYC" : "Reject"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            This submission has already been reviewed. Actions are unavailable.
          </p>
        )}
      </Card>

      <ConfirmDialog
        open={dialogAction !== null}
        title={dialogAction === "approve" ? "Approve KYC?" : "Reject KYC?"}
        message={dialogMessage}
        confirmLabel={dialogAction === "approve" ? "Approve" : "Reject"}
        variant={dialogAction === "approve" ? "primary" : "danger"}
        loading={actionLoading}
        onConfirm={() => void submitReview()}
        onCancel={() => {
          if (!actionLoading) {
            setDialogAction(null);
            setReasonError("");
          }
        }}
      />
    </div>
  );
}
