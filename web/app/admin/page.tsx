"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ClipboardCheck, AlertTriangle, Users, ArrowRight, Info } from "lucide-react";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface KycSubmission {
  id: string;
  userId: string;
  userName?: string;
  userRole?: string;
  status: string;
  documentType?: string;
  countryCode?: string;
  submittedAt: string;
  createdAt?: string;
}

interface KycListResponse {
  submissions: KycSubmission[];
}

interface VerificationRecord {
  id: string;
  provider?: { fullName?: string; email?: string };
  category?: { name?: string };
  skill_item?: { name?: string } | null;
  status: string;
  sla_due_at?: string;
  created_at: string;
}

interface VerificationListResponse {
  records: VerificationRecord[];
  total: number;
  limit: number;
  skip: number;
}

interface SectionState<T> {
  loading: boolean;
  error: boolean;
  data: T | null;
}

const formatRelativeTime = (iso?: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function AdminDashboardPage() {
  const { call } = useAdminApi();

  const [kyc, setKyc] = useState<SectionState<KycSubmission[]>>({ loading: true, error: false, data: null });
  const [verification, setVerification] = useState<SectionState<VerificationListResponse>>({
    loading: true,
    error: false,
    data: null,
  });
  const [sla, setSla] = useState<SectionState<number>>({ loading: true, error: false, data: null });

  const loadKyc = async () => {
    try {
      const response = await call<KycListResponse | KycSubmission[]>("/kyc/admin/submissions?status=pending");
      const data = Array.isArray(response) ? response : response.submissions;
      setKyc({ loading: false, error: false, data: Array.isArray(data) ? data : [] });
    } catch {
      setKyc((prev) => ({ ...prev, loading: false, error: true }));
    }
  };

  const loadVerification = async () => {
    try {
      const data = await call<VerificationListResponse>(
        "/providers/admin/records?status=pending_review&limit=5",
      );
      setVerification({ loading: false, error: false, data });
    } catch {
      setVerification((prev) => ({ ...prev, loading: false, error: true }));
    }
  };

  // SLA-overdue count is derived from the records endpoint's sla_overdue filter
  // (limit=1 just to read `total`) — no dedicated stats endpoint exists yet.
  const loadSla = async () => {
    try {
      const data = await call<VerificationListResponse>(
        "/providers/admin/records?status=pending_review&sla_overdue=true&limit=1",
      );
      setSla({ loading: false, error: false, data: data.total });
    } catch {
      setSla((prev) => ({ ...prev, loading: false, error: true }));
    }
  };

  const retryKyc = () => {
    setKyc((prev) => ({ ...prev, loading: true, error: false }));
    loadKyc();
  };

  const retryVerification = () => {
    setVerification((prev) => ({ ...prev, loading: true, error: false }));
    loadVerification();
  };

  useEffect(() => {
    const loadAll = () => {
      loadKyc();
      loadVerification();
      loadSla();
    };
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingKyc = kyc.data?.length ?? null;
  const pendingVerification = verification.data?.total ?? null;
  const slaOverdue = sla.data ?? null;
  const recentKyc = kyc.data?.slice(0, 5) ?? [];
  const recentVerification = verification.data?.records.slice(0, 5) ?? [];

  // A dedicated GET /admin/stats endpoint would be a future optimization;
  // for now all counts are computed from the fetches above.

  const statCards = [
    {
      label: "Pending KYC",
      value: pendingKyc,
      loading: kyc.loading,
      icon: ShieldCheck,
      accent: "bg-primary",
      href: "/admin/kyc?status=pending",
    },
    {
      label: "Pending Verification",
      value: pendingVerification,
      loading: verification.loading,
      icon: ClipboardCheck,
      accent: "bg-amber",
      href: "/admin/verification?status=pending_review",
    },
    {
      label: "SLA Overdue",
      value: slaOverdue,
      loading: sla.loading,
      icon: AlertTriangle,
      accent: "bg-error",
      href: "/admin/verification?sla_overdue=true",
    },
    {
      label: "Total Users",
      value: "—",
      loading: false,
      icon: Users,
      accent: "bg-text-hint",
      href: "/admin/users",
      comingSoon: true,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-[24px] font-bold text-text-primary">Dashboard</h1>

      {/* STAT CARD ROW */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href} title={card.comingSoon ? "Coming soon" : undefined}>
            <Card className="group transition-colors hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-text-secondary">
                  {card.label}
                </p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.accent} text-white`}>
                  <card.icon className="h-[18px] w-[18px]" />
                </span>
              </div>
              {card.loading ? (
                <Skeleton className="mt-3 h-8 w-16" />
              ) : (
                <p className="mt-3 text-[28px] font-bold text-text-primary">
                  {card.value}
                </p>
              )}
              {card.comingSoon && (
                <div className="mt-2 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-text-hint" />
                  <span className="text-[11px] text-text-hint">Coming soon</span>
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {/* TWO-COLUMN QUICK-ACCESS SECTION */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* LEFT: Recent KYC Submissions */}
        <Card
          title="Recent KYC Submissions"
          action={
            <Link href="/admin/kyc?status=pending" className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:text-primary-dark">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {kyc.loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : kyc.error ? (
            <div className="py-4">
              <div className="flex items-center justify-between gap-3 py-4">
                <p className="text-[13px] text-text-secondary">Failed to load KYC submissions</p>
                <button
                  type="button"
                  onClick={retryKyc}
                  className="shrink-0 text-[13px] font-medium text-primary hover:text-primary-dark"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : recentKyc.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-text-hint">
              No pending KYC submissions — all caught up.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recentKyc.map((submission) => (
                <li key={submission.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-[12px] font-semibold text-primary-dark">
                      {submission.userName ? initials(submission.userName) : submission.userId.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-text-primary">
                        {submission.userName ?? submission.userId}
                      </p>
                      <p className="text-[12px] text-text-hint">
                        Submitted {formatRelativeTime(submission.submittedAt)}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/kyc/${submission.userId}`}
                    className="shrink-0 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:text-primary-dark"
                  >
                    Review
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* RIGHT: Recent Verification Records */}
        <Card
          title="Recent Verification Records"
          action={
            <Link href="/admin/verification?status=pending_review" className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:text-primary-dark">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {verification.loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : verification.error ? (
            <div className="py-4">
              <div className="flex items-center justify-between gap-3 py-4">
                <p className="text-[13px] text-text-secondary">Failed to load verification records</p>
                <button
                  type="button"
                  onClick={retryVerification}
                  className="shrink-0 text-[13px] font-medium text-primary hover:text-primary-dark"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : recentVerification.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-text-hint">
              No pending verification records — all caught up.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recentVerification.map((record) => (
                <li key={record.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-[12px] font-semibold text-primary-dark">
                      {initials(record.provider?.fullName ?? "?")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-text-primary">
                        {record.provider?.fullName ?? "Unknown provider"}
                      </p>
                      <p className="truncate text-[12px] text-text-hint">
                        {record.skill_item?.name ?? record.category?.name ?? "—"}
                        {record.category?.name ? ` · ${record.category.name}` : ""}
                      </p>
                      <p className="text-[11px] text-text-hint mt-0.5">
                        Submitted {formatRelativeTime(record.created_at)}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/verification/${record.id}`}
                    className="shrink-0 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:text-primary-dark"
                  >
                    Review
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function SectionError({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <p className="text-[13px] text-text-secondary">{label}</p>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 text-[13px] font-medium text-primary hover:text-primary-dark"
      >
        Retry
      </button>
    </div>
  );
}