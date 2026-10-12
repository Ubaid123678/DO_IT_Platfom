"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Select, type SelectOption } from "@/components/ui/Select";
import { useAdminQuery } from "@/hooks/useAdminQuery";

type VerificationStatus =
  | "draft"
  | "pending_review"
  | "scheduled"
  | "auto_approved"
  | "approved"
  | "rejected"
  | "expired";

interface VerificationRecord {
  id: string;
  provider?: { fullName?: string; email?: string } | null;
  category?: string | { name?: string } | null;
  skill_item?: string | { name?: string } | null;
  evidence_type: string;
  status: VerificationStatus;
  sla_due_at?: string | null;
  created_at: string;
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
  job_type: string;
}

interface CategoriesResponse {
  categories: CategoryOption[];
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const statusOptions: SelectOption[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending review" },
  { value: "scheduled", label: "Scheduled" },
  { value: "auto_approved", label: "Auto-approved" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

const statusVariants: Record<VerificationStatus, BadgeVariant> = {
  draft: "incomplete",
  pending_review: "pending",
  scheduled: "scheduled",
  auto_approved: "approved",
  approved: "approved",
  rejected: "rejected",
  expired: "overdue",
};

const titleCase = (value: string): string =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const getPositiveInteger = (
  value: string | null,
  fallback: number,
  maximum?: number,
): number => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return maximum ? Math.min(parsed, maximum) : parsed;
};

const getNonNegativeInteger = (value: string | null): number => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
};

const getCategoryName = (category: VerificationRecord["category"]): string => {
  if (!category) return "—";
  return typeof category === "string" ? category : category.name ?? "—";
};

const getSkillItemName = (skill: VerificationRecord["skill_item"]): string => {
  if (!skill) return "—";
  return typeof skill === "string" ? skill : skill.name ?? "—";
};

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

const isPastDue = (value?: string | null): boolean => {
  if (!value) return false;
  const dueAt = new Date(value).getTime();
  return Number.isFinite(dueAt) && dueAt < Date.now();
};

export default function AdminVerificationQueuePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const params = useMemo(() => new URLSearchParams(currentQuery), [currentQuery]);

  const rawStatus = params.get("status");
  const status = statusOptions.some((option) => option.value === rawStatus)
    ? rawStatus ?? "pending_review"
    : "pending_review";
  const categoryId = params.get("category_id") ?? "";
  const slaOverdue = params.get("sla_overdue") === "true";
  const skip = getNonNegativeInteger(params.get("skip"));
  const limit = getPositiveInteger(params.get("limit"), DEFAULT_LIMIT, MAX_LIMIT);

  const updateUrl = useCallback(
    (updates: Record<string, string | null>, replace = false) => {
      const next = new URLSearchParams(currentQuery);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const query = next.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      if (replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [currentQuery, pathname, router],
  );

  useEffect(() => {
    const next = new URLSearchParams(currentQuery);
    let changed = false;
    if (!next.has("status") || !statusOptions.some((item) => item.value === rawStatus)) {
      next.set("status", "pending_review");
      changed = true;
    }
    if (!next.has("limit") || getPositiveInteger(next.get("limit"), DEFAULT_LIMIT, MAX_LIMIT) !== limit) {
      next.set("limit", String(limit));
      changed = true;
    }
    if (!next.has("skip") || getNonNegativeInteger(next.get("skip")) !== skip) {
      next.set("skip", String(skip));
      changed = true;
    }
    if (params.has("sla_overdue") && params.get("sla_overdue") !== "true" && params.get("sla_overdue") !== "false") {
      next.delete("sla_overdue");
      changed = true;
    }
    if (changed) router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [currentQuery, limit, params, pathname, rawStatus, router, skip]);

  const apiQuery = useMemo(() => {
    const query = new URLSearchParams({
      limit: String(limit),
      skip: String(skip),
    });
    if (status !== "all") query.set("status", status);
    if (categoryId) query.set("category_id", categoryId);
    if (slaOverdue) query.set("sla_overdue", "true");
    return query.toString();
  }, [categoryId, limit, slaOverdue, skip, status]);

  const {
    data,
    loading,
    error,
    refetch,
  } = useAdminQuery<VerificationListResponse>(
    `/providers/admin/records?${apiQuery}`,
  );
  const categoriesQuery = useAdminQuery<CategoriesResponse>(
    "/providers/categories?active_only=false",
  );

  useEffect(() => {
    if (!data) return;
    const lastSkip =
      data.total > 0 ? Math.floor((data.total - 1) / limit) * limit : 0;
    if (skip > lastSkip) updateUrl({ skip: String(lastSkip) }, true);
  }, [data, limit, skip, updateUrl]);

  const categories = categoriesQuery.data?.categories ?? [];
  const categoryOptions: SelectOption[] = [
    { value: "", label: "All categories" },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  const columns: DataTableColumn<VerificationRecord>[] = [
    {
      key: "provider",
      header: "Provider",
      className: "min-w-52",
      render: (record) => (
        <div>
          <p className="font-semibold text-text-primary">
            {record.provider?.fullName ?? "Unknown provider"}
          </p>
          {record.provider?.email && (
            <p className="mt-0.5 text-xs text-text-hint">
              {record.provider.email}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (record) => (
        <span className="text-sm text-text-secondary">
          {getCategoryName(record.category)}
        </span>
      ),
    },
    {
      key: "skill-item",
      header: "Skill item",
      render: (record) => (
        <span className="text-sm text-text-secondary">
          {getSkillItemName(record.skill_item)}
        </span>
      ),
    },
    {
      key: "evidence",
      header: "Evidence type",
      render: (record) => (
        <Badge variant="neutral">{titleCase(record.evidence_type)}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (record) => (
        <Badge variant={statusVariants[record.status]}>
          {titleCase(record.status)}
        </Badge>
      ),
    },
    {
      key: "sla",
      header: "SLA due",
      className: "min-w-48",
      render: (record) => {
        const overdue = isPastDue(record.sla_due_at);
        return (
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`whitespace-nowrap text-sm ${
                overdue ? "font-semibold text-error" : "text-text-secondary"
              }`}
            >
              {record.sla_due_at ? formatDate(record.sla_due_at) : "—"}
            </span>
            {overdue && <Badge variant="overdue">OVERDUE</Badge>}
          </div>
        );
      },
    },
    {
      key: "created",
      header: "Created",
      className: "min-w-44",
      render: (record) => (
        <span className="whitespace-nowrap text-sm text-text-secondary">
          {formatDate(record.created_at)}
        </span>
      ),
    },
  ];

  const hasActiveFilters =
    status !== "pending_review" || Boolean(categoryId) || slaOverdue;
  const clearFilters = () =>
    router.push(
      `${pathname}?${new URLSearchParams({
        status: "pending_review",
        skip: "0",
        limit: String(limit),
      })}`,
      { scroll: false },
    );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Verification review
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {data
              ? `${data.total.toLocaleString()} verification records`
              : "Review provider verification evidence"}
          </p>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </header>

      <section
        className="grid gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm md:grid-cols-3"
        aria-label="Verification filters"
      >
        <Select
          label="Status"
          value={status}
          onChange={(event) =>
            updateUrl({ status: event.target.value, skip: "0" })
          }
          options={statusOptions}
        />
        <Select
          label="Category"
          value={categoryId}
          onChange={(event) =>
            updateUrl({
              category_id: event.target.value || null,
              skip: "0",
            })
          }
          options={categoryOptions}
          disabled={categoriesQuery.loading || Boolean(categoriesQuery.error)}
          hint={
            categoriesQuery.error
              ? "Category list could not be loaded."
              : undefined
          }
        />
        <div className="flex flex-col justify-end">
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            SLA
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={slaOverdue}
            onClick={() =>
              updateUrl({
                sla_overdue: slaOverdue ? null : "true",
                skip: "0",
              })
            }
            className="flex min-h-10 items-center gap-3 rounded-xl border border-border px-3 text-left text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                slaOverdue ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${
                  slaOverdue ? "left-[18px]" : "left-0.5"
                }`}
              />
            </span>
            SLA overdue only
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-error/30 bg-surface p-6">
          <p className="text-sm font-semibold text-error">
            Failed to load verification records
          </p>
          <p className="mt-1 text-sm text-text-secondary">{error.message}</p>
          <Button
            className="mt-4"
            variant="secondary"
            size="sm"
            onClick={refetch}
          >
            Retry
          </Button>
        </div>
      ) : (
        <DataTable
          caption="Provider verification records"
          columns={columns}
          rows={data?.records ?? []}
          loading={loading}
          skeletonRows={8}
          rowKey={(record) => record.id}
          onRowClick={(record) =>
            router.push(`/admin/verification/${record.id}`)
          }
          emptyState={
            <EmptyState
              title="No verification records"
              subtitle={
                hasActiveFilters
                  ? "No records match these filter settings."
                  : "No records are available for review."
              }
              action={
                hasActiveFilters ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          }
        />
      )}

      {!error && data && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Select
            label="Rows per page"
            className="w-32"
            value={String(limit)}
            onChange={(event) =>
              updateUrl({
                limit: event.target.value,
                skip: "0",
              })
            }
            options={[
              { value: "50", label: "50" },
              { value: "100", label: "100" },
              { value: "200", label: "200" },
            ]}
          />
          <Pagination
            mode="skip-limit"
            skip={data.skip}
            limit={data.limit}
            total={data.total}
            onSkipChange={(nextSkip) =>
              updateUrl({ skip: String(nextSkip) })
            }
          />
        </div>
      )}
    </div>
  );
}
