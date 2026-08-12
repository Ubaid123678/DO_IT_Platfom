"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/admin/StatusPill";
import { ImageLightbox } from "@/components/admin/ImageLightbox";
import { ReviewActionBar, type ReviewAction } from "@/components/admin/ReviewActionBar";
import { toast } from "@/components/ui/Toast";
import { timeAgo } from "@/lib/users";

interface KycDetail {
  id: string;
  userId: string;
  status: string;
  documentType: string;
  documentImages: { front?: string | null; back?: string | null };
  livenessImages: { face_clear?: string | null; move_left?: string | null; move_right?: string | null; smile?: string | null };
  countryCode?: string;
  submittedAt?: string;
  rejectionReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
}

const documentLabels: Record<string, string> = {
  passport: "Passport",
  driving_license: "Driving License",
  national_id: "National ID",
};

function ImageThumb({
  src,
  label,
  onOpen,
}: {
  src?: string | null;
  label: string;
  onOpen: (src: string) => void;
}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Images may be `data:` base64 URIs (mobile camera capture) — must use a
  // plain <img> (NOT next/image) so the browser can render them directly.
  return (
    <button
      type="button"
      onClick={() => onOpen(src ?? "")}
      className="group w-full overflow-hidden rounded-xl border border-border bg-bg text-left transition-colors hover:border-primary"
    >
      <div className="relative flex aspect-square items-center justify-center bg-bg">
        {!src ? (
          <p className="px-3 text-center text-xs text-text-hint">Not required for this document type</p>
        ) : error ? (
          <p className="px-3 text-center text-xs text-text-hint">Image unavailable</p>
        ) : !loaded ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <img
            src={src}
            alt={label}
            className="h-full w-full max-w-full object-cover"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        )}
      </div>
      <p className="truncate px-2 py-1.5 text-[12px] font-medium text-text-secondary">{label}</p>
    </button>
  );
}

export default function AdminKycDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { call } = useAdminApi();

  const [detail, setDetail] = useState<KycDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [busyAction, setBusyAction] = useState<ReviewAction | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const data = await call<KycDetail>(`/kyc/admin/submissions/${userId}`);
        if (cancelled) return;
        setDetail(data);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((err as any)?.status === 404) setNotFound(true);
        else setError(true);
        setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [userId, call]);

  const refetch = async () => {
    const data = await call<KycDetail>(`/kyc/admin/submissions/${userId}`);
    setDetail(data);
  };

  const handleApprove = async () => {
    setBusyAction("approve");
    try {
      await call(`/kyc/admin/${userId}/approve`, { method: "PATCH" });
      toast.success("KYC approved");
      await refetch();
    } catch {
      toast.error("Action failed, please try again");
    } finally {
      setBusyAction(null);
    }
  };

  const handleReject = async (reason: string) => {
    setBusyAction("reject");
    try {
      await call(`/kyc/admin/${userId}/reject`, { method: "PATCH", body: { reason } });
      toast.success("KYC rejected");
      await refetch();
    } catch {
      toast.error("Action failed, please try again");
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center">
        <p className="text-[15px] font-semibold text-text-primary">KYC submission not found</p>
        <p className="mt-1 text-[13px] text-text-hint">This submission may have been removed.</p>
        <Link
          href="/admin/kyc"
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Back to KYC review
        </Link>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center">
        <p className="text-[14px] text-text-secondary">Failed to load KYC submission</p>
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

  const isPending = detail.status === "pending";
  const documentThumbs = [
    { key: "front", label: "Front", src: detail.documentImages.front },
    { key: "back", label: "Back", src: detail.documentImages.back },
  ];
  const livenessThumbs = [
    { key: "face_clear", label: "Face", src: detail.livenessImages.face_clear },
    { key: "move_left", label: "Look Left", src: detail.livenessImages.move_left },
    { key: "move_right", label: "Look Right", src: detail.livenessImages.move_right },
    { key: "smile", label: "Smile", src: detail.livenessImages.smile },
  ];

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-[13px] text-text-hint">
        <Link href="/admin/kyc" className="transition-colors hover:text-primary">
          KYC Review
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{detail.userId}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[24px] font-bold text-text-primary">KYC Review — {detail.userId}</h1>
        <StatusPill status={detail.status} variant="kyc" />
      </div>
      <p className="-mt-3 text-[13px] text-text-hint">Submitted {timeAgo(detail.submittedAt ?? "")}</p>

      <Card title="Identity Document">
        <div className="grid gap-4 sm:grid-cols-2">
          {documentThumbs.map((thumb) => (
            <ImageThumb key={thumb.key} src={thumb.src} label={thumb.label} onOpen={setLightboxSrc} />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1 border-t border-border pt-4">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-text-secondary">Document Type:</span>
            <span className="font-medium text-text-primary">
              {documentLabels[detail.documentType] ?? detail.documentType}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-text-secondary">Country:</span>
            <span className="font-medium text-text-primary">{detail.countryCode ?? "—"}</span>
          </div>
        </div>
      </Card>

      <Card title="Liveness Photos">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {livenessThumbs.map((thumb) => (
            <ImageThumb key={thumb.key} src={thumb.src} label={thumb.label} onOpen={setLightboxSrc} />
          ))}
        </div>
      </Card>

      <Card title="Review">
        {isPending ? (
          <ReviewActionBar
            onApprove={handleApprove}
            onReject={handleReject}
            busyAction={busyAction}
          />
        ) : (
          <div className="space-y-2">
            {detail.status === "approved" ? (
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status="approved" variant="kyc" />
                <p className="text-[13px] text-text-secondary">
                  Approved by {detail.reviewedBy ?? "admin"} on{" "}
                  {detail.reviewedAt ? timeAgo(detail.reviewedAt) : "—"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <StatusPill status={detail.status} variant="kyc" />
                {detail.rejectionReason && (
                  <p className="text-[13px] text-text-secondary">
                    Rejected: {detail.rejectionReason}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      <ImageLightbox src={lightboxSrc ?? ""} open={lightboxSrc !== null} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
