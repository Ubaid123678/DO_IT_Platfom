"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useAdminApi } from "@/hooks/useAdminApi";
import { FilterBar } from "@/components/admin/FilterBar";
import { Table, type Column } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { StatusPill } from "@/components/admin/StatusPill";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { timeAgo } from "@/lib/users";

interface VerificationRecord {
  id: string;
  provider?: { fullName?: string; email?: string } | null;
  category?: string | { name?: string } | null;
  skill_item?: string | { name?: string } | null;
  evidence_type: string;
  status: string;
  sla_due_at?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
}

interface VerificationListResponse {
  records: VerificationRecord[];
  total: number;
  limit: number;
  skip: number;
}

interface CategoryOption {
  id: string;
  name: string;
  job_type?: string;
}

const DEFAULT_LIMIT = 50;

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending Review" },
  { value: "scheduled", label: "Scheduled" },
  { value: "auto_approved", label: "Auto Approved" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

const humanize = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const categoryName = (record: VerificationRecord): string => {
  const category = record.category;
  if (!category) return "—";
  return typeof category === "string" ? category : category.name ?? "—";
};

const skillItemName = (record: VerificationRecord): string => {
  // skill_item is null for the category-level bundle evidence types
  // (digital/physical/errand) — those rows show "—".
  const item = record.skill_item;
  if (!item) return "—";
  return typeof item === "string" ? item : item.name ?? "—";
};

const isOverdue = (record: VerificationRecord): boolean => {
  if (!record.sla_due_at) return false;
  if (!["pending_review", "scheduled"].includes(record.status)) return false;
  return new Date(record.sla_due_at).getTime() < Date.now();
};

export default function AdminVerificationQueuePage() {
  const router = useRouter();
  const { call } = useAdminApi();

  const [status, setStatus] = useState("pending_review");
  const [categoryId, setCategoryId] = useState("all");
  const [slaOverdue, setSlaOverdue] = useState(false);
  const [skip, setSkip] = useState(0);

  const [data, setData] = useState<VerificationListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [categories, setCategories] = useState<CategoryOption[] | null>(null);

  // Category filter options come from GET /verification/categories when
  // available. If that endpoint is unavailable in a deployment, we fall back to
  // a free-text category_id input (see renderCategoryFilter).
  useEffect(() => {
    let cancelled = false;
    call<{ categories: CategoryOption[] }>("/verification/categories")
      .then((result) => {
        if (cancelled) return;
        setCategories(Array.isArray(result.categories) ? result.categories : null);
      })
      .catch(() => {
        if (cancelled) return;
        setCategories(null);
      });
    return () => {
      cancelled = true;
    };
  }, [call]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const params = new URLSearchParams();
        if (status !== "all") params.set("status", status);
        if (categoryId !== "all") params.set("category_id", categoryId);
        if (slaOverdue) params.set("sla_overdue", "true");
        params.set("limit", String(DEFAULT_LIMIT));
        params.set("skip", String(skip));
        const result = await call<VerificationListResponse>(`/providers/admin/records?${params.toString()}`);
        if (cancelled) return;
        setData(result);
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
  }, [status, categoryId, slaOverdue, skip, call]);

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setSkip(0);
    setLoading(true);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setSkip(0);
    setLoading(true);
  };

  const handleToggleSlaOverdue = () => {
    setSlaOverdue((prev) => !prev);
    setSkip(0);
    setLoading(true);
  };

  const handleSkipChange = (nextSkip: number) => {
    setSkip(nextSkip);
    setLoading(true);
  };

  const clearFilters = () => {
    setStatus("all");
    setCategoryId("all");
    setSlaOverdue(false);
    setSkip(0);
    setLoading(true);
  };

  const hasActiveFilters = status !== "all" || categoryId !== "all" || slaOverdue;

  const columns: Column<VerificationRecord>[] = [
    {
      key: "provider",
      header: "Provider",
      render: (record) => (
        <div className="min-w-[200px]">
          <p className="text-[14px] font-semibold text-text-primary">
            {record.provider?.fullName ?? "Unknown provider"}
          </p>
          {record.provider?.email && <p className="mt-0.5 text-[12px] text-text-hint">{record.provider.email}</p>}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (record) => <span className="text-[13px] text-text-secondary">{categoryName(record)}</span>,
    },
    {
      key: "skill",
      header: "Skill Item",
      render: (record) => <span className="text-[13px] text-text-secondary">{skillItemName(record)}</span>,
    },
    {
      key: "evidence",
      header: "Evidence Type",
      render: (record) => <Badge variant="neutral">{humanize(record.evidence_type)}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      render: (record) => <StatusPill status={record.status} variant="verification" />,
    },
    {
      key: "sla",
      header: "SLA Due",
      render: (record) => {
        const overdue = isOverdue(record);
        return (
          <span
            className={`flex items-center gap-1.5 text-[13px] ${
              overdue ? "font-semibold text-error" : "text-text-secondary"
            }`}
          >
            {record.sla_due_at ? timeAgo(record.sla_due_at) : "—"}
            {overdue && (
              <span className="rounded-full bg-error-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-error">
                Overdue
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: "submitted",
      header: "Submitted",
      render: (record) => <span className="text-[13px] text-text-secondary">{timeAgo(record.created_at ?? "")}</span>,
    },
  ];

  const isPendingHappyPath = status === "pending_review" && !loading && !error && (data?.records.length ?? 0) === 0;

  const emptyState = isPendingHappyPath ? (
    <EmptyState
      icon={<CheckCircle2 className="h-5 w-5" />}
      title="No verification records"
      subtitle="No records pending review — you're all caught up."
    />
  ) : (
    <EmptyState
      title={hasActiveFilters ? "No verification records match your filters" : "No verification records"}
    />
  );

  const renderCategoryFilter = () => {
    if (categories && categories.length > 0) {
      return {
        key: "category",
        label: "Category",
        value: categoryId,
        onChange: handleCategoryChange,
        options: [
          { value: "all", label: "All Categories" },
          ...categories.map((category) => ({ value: category.id, label: category.name })),
        ],
      };
    }
    // Fallback: categories endpoint unavailable — free-text category_id input.
    return null;
  };

  const categoryFilter = renderCategoryFilter();

  return (
    <div className="space-y-5">
      <h1 className="text-[24px] font-bold text-text-primary">Verification Review</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[320px] flex-1">
          <FilterBar
            filters={[
              { key: "status", label: "Status", value: status, onChange: handleStatusChange, options: statusOptions },
              ...(categoryFilter ? [categoryFilter] : []),
            ]}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {!categoryFilter && (
          <input
            type="text"
            value={categoryId === "all" ? "" : categoryId}
            onChange={(event) => handleCategoryChange(event.target.value.trim())}
            placeholder="Filter by category ID…"
            className="h-10 rounded-[10px] border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
        )}

        <button
          type="button"
          role="switch"
          aria-checked={slaOverdue}
          onClick={handleToggleSlaOverdue}
          className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-surface px-3 py-2.5 text-[13px] font-medium text-text-secondary transition-colors hover:border-primary"
        >
          <span
            className={`relative h-5 w-9 rounded-full transition-colors ${slaOverdue ? "bg-primary" : "bg-border"}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                slaOverdue ? "left-[18px]" : "left-0.5"
              }`}
            />
          </span>
          SLA Overdue only
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center">
          <p className="text-[14px] text-text-secondary">Failed to load verification records</p>
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
      ) : (
        <Table
          columns={columns}
          rows={data?.records ?? []}
          loading={loading}
          rowKey={(record) => record.id}
          onRowClick={(record) => router.push(`/admin/verification/${record.id}`)}
          empty={emptyState}
        />
      )}

      {!error && data && data.total > 0 && (
        <Pagination
          mode="skip-limit"
          skip={data.skip}
          limit={data.limit}
          total={data.total}
          onSkipChange={handleSkipChange}
        />
      )}
    </div>
  );
}
