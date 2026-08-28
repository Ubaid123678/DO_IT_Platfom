"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Table, type Column } from "@/components/ui/Table";
import { StatusPill } from "@/components/admin/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { timeAgo } from "@/lib/users";
import { Button } from "@/components/ui/Button";

interface KycSubmission {
  id: string;
  userId: string;
  userRole?: string;
  status: string;
  documentType?: string;
  countryCode?: string;
  submittedAt?: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface KycListResponse {
  submissions: KycSubmission[];
}

interface KycCounts {
  pending: number;
  approved: number;
  rejected: number;
  all: number;
}

type KycTab = "pending" | "approved" | "rejected" | "all";

const tabs: { key: KycTab; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const documentLabels: Record<string, string> = {
  pass: "Passport",
  passport: "Passport",
  driving_license: "Driving License",
  national_id: "National ID",
};

const humanizeDocumentType = (value?: string) =>
  value ? (documentLabels[value] ?? value.replace(/_/g, " ")) : "—";

const roleVariants: Record<string, "approved" | "neutral" | "pending" | "partially_verified" | "rejected"> = {
  provider: "approved",
  client: "neutral",
  admin: "partially_verified",
  pending: "pending",
};

export default function AdminKycQueuePage() {
  const router = useRouter();
  const { call } = useAdminApi();

  const [tab, setTab] = useState<KycTab>("pending");
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [counts, setCounts] = useState<KycCounts>({ pending: 0, approved: 0, rejected: 0, all: 0 });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        // Fetch counts for all statuses
        const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
          call<KycListResponse>("/kyc/admin/submissions?status=pending"),
          call<KycListResponse>("/kyc/admin/submissions?status=approved"),
          call<KycListResponse>("/kyc/admin/submissions?status=rejected"),
        ]);

        const pendingData = Array.isArray(pendingRes) ? pendingRes : pendingRes.submissions;
        const approvedData = Array.isArray(approvedRes) ? approvedRes : approvedRes.submissions;
        const rejectedData = Array.isArray(rejectedRes) ? rejectedRes : rejectedRes.submissions;

        if (cancelled) return;

        setCounts({
          pending: pendingData.length,
          approved: approvedData.length,
          rejected: rejectedData.length,
          all: pendingData.length + approvedData.length + rejectedData.length,
        });

        // Load the current tab's submissions
        const query = tab === "all" ? "" : `?status=${tab}`;
        const response = await call<KycListResponse | KycSubmission[]>(`/kyc/admin/submissions${query}`);
        if (cancelled) return;
        const data = Array.isArray(response) ? response : response.submissions;
        setSubmissions(Array.isArray(data) ? data : []);
        setError(false);
        setLoading(false);
      } catch {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [tab, call, retryCount]);

  const handleTabChange = (nextTab: KycTab) => {
    setTab(nextTab);
    setLoading(true);
  };

  // Note: the endpoint returns a flat array with no pagination fields, so no
  // pagination UI is wired here. If submission volume grows, add client-side
  // page/limit state here and slice before rendering.
  const columns: Column<KycSubmission>[] = [
    {
      key: "user",
      header: "User",
      render: (submission) => (
        <div className="min-w-[180px]">
          <p className="text-[14px] font-semibold text-text-primary">{submission.userId}</p>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              router.push(`/admin/kyc/${submission.userId}`);
            }}
            className="text-[12px] font-medium text-primary hover:text-primary-dark"
          >
            View submission →
          </button>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (submission) => (
        <Badge variant={roleVariants[submission.userRole ?? ""] ?? "neutral"}>
          {submission.userRole ?? "—"}
        </Badge>
      ),
    },
    {
      key: "document",
      header: "Document Type",
      render: (submission) => (
        <span className="text-[13px] text-text-secondary">{humanizeDocumentType(submission.documentType)}</span>
      ),
    },
    {
      key: "country",
      header: "Country",
      render: (submission) => <span className="text-[13px] text-text-secondary">{submission.countryCode ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (submission) => <StatusPill status={submission.status} variant="kyc" />,
    },
    {
      key: "submitted",
      header: "Submitted",
      render: (submission) => (
        <span className="text-[13px] text-text-secondary">
          {timeAgo(submission.submittedAt ?? submission.createdAt ?? "")}
        </span>
      ),
    },
  ];

  const isPendingHappyPath = tab === "pending" && !loading && !error && submissions.length === 0;

  const emptyState = isPendingHappyPath ? (
    <EmptyState
      icon={<CheckCircle2 className="h-5 w-5" />}
      title="No pending KYC submissions"
      subtitle="All submissions have been reviewed — you're all caught up."
    />
  ) : (
    <EmptyState title={tab === "all" ? "No submissions" : `No ${tab} submissions`} />
  );

  return (
    <div className="space-y-5">
      <h1 className="text-[24px] font-bold text-text-primary">KYC Review</h1>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-surface p-1.5">
        {tabs.map((item) => {
          const active = item.key === tab;
          const count = counts[item.key] ?? 0;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleTabChange(item.key)}
              className={`rounded-[10px] px-4 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                active
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:bg-primary-light"
              }`}
            >
              <span className="flex items-center gap-2">
                {item.label}
                {count > 0 && (
                  <span className={`inline-flex items-center justify-center h-5 min-w-5 rounded-full px-1.5 text-[11px] font-medium ${
                    active ? "bg-white/20 text-white" : "bg-white/10 text-text-secondary"
                  }`}>
                    {count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center">
          <p className="text-[14px] text-text-secondary">Failed to load KYC submissions</p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-4"
            onClick={() => {
              setLoading(true);
              setError(false);
              setRetryCount((count) => count + 1);
            }}
          >
            Retry
          </Button>
        </div>
      ) : (
        <Table
          columns={columns}
          rows={submissions}
          loading={loading}
          rowKey={(submission) => submission.id}
          onRowClick={(submission) => router.push(`/admin/kyc/${submission.userId}`)}
          empty={emptyState}
        />
      )}
    </div>
  );
}