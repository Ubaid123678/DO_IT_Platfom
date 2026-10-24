"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Briefcase } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { useAdminQuery } from "@/hooks/useAdminQuery";
import { useDebounce } from "@/hooks/useDebounce";

type JobStatus =
  | "open"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed"
  | "resolved";
type JobType = "physical" | "digital" | "errand";

interface PopulatedRef {
  _id?: string;
  fullName?: string;
  email?: string;
  name?: string;
}

interface AdminJob {
  _id: string;
  title: string;
  description: string;
  type: JobType;
  status: JobStatus;
  budget?: { type?: string; amount?: number; currency?: string };
  client?: { clientId?: PopulatedRef | null } | null;
  provider?: { providerId?: PopulatedRef | null } | null;
  requirements?: { categories?: (PopulatedRef | string)[] | null } | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminJobsResponse {
  jobs: AdminJob[];
  total: number;
  limit: number;
  skip: number;
  status_counts: Record<JobStatus, number>;
}

const DEFAULT_LIMIT = 20;

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "disputed", label: "Disputed" },
  { value: "resolved", label: "Resolved" },
];

const typeOptions = [
  { value: "", label: "All types" },
  { value: "physical", label: "Physical" },
  { value: "digital", label: "Digital" },
  { value: "errand", label: "Errand" },
];

const statusVariants: Record<JobStatus, BadgeVariant> = {
  open: "pending",
  in_progress: "partially_verified",
  completed: "approved",
  cancelled: "neutral",
  disputed: "rejected",
  resolved: "verified",
};

const titleCase = (value: string): string =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
};

const formatBudget = (job: AdminJob): string => {
  const amount = job.budget?.amount;
  if (typeof amount !== "number") return "—";
  const currency = job.budget?.currency ?? "USD";
  const major = amount / 100;
  const formatted = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(major);
  return job.budget?.type === "hourly" ? `${formatted}/hr` : formatted;
};

const categoryNames = (job: AdminJob): string => {
  const categories = job.requirements?.categories ?? [];
  const names = categories
    .map((category) =>
      typeof category === "string" ? category : category.name,
    )
    .filter((name): name is string => Boolean(name));
  return names.length ? names.join(", ") : "—";
};

const personName = (person?: PopulatedRef | null, fallback = "—"): string =>
  person?.fullName ?? person?.email ?? fallback;

const getSafeNumber = (
  value: string | null,
  fallback: number,
  maximum?: number,
): number => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return maximum ? Math.min(parsed, maximum) : parsed;
};

function DebouncedSearchInput({
  initialValue,
  onSearchChange,
}: {
  initialValue: string;
  onSearchChange: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, 350);

  useEffect(() => {
    if (debouncedValue !== initialValue) onSearchChange(debouncedValue.trim());
  }, [debouncedValue, initialValue, onSearchChange]);

  return (
    <Input
      label="Search"
      type="search"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder="Job title or description (2+ characters)"
      autoComplete="off"
    />
  );
}

export default function AdminJobsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentParams = searchParams.toString();
  const urlSearch = searchParams.get("search") ?? "";

  const status = searchParams.get("status") ?? "";
  const type = searchParams.get("type") ?? "";
  const page = getSafeNumber(searchParams.get("page"), 1);
  const limit = getSafeNumber(searchParams.get("limit"), DEFAULT_LIMIT, 100);
  const skip = (page - 1) * limit;

  const navigateParams = useCallback(
    (updates: Record<string, string | null>, replace = false) => {
      const next = new URLSearchParams(currentParams);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const queryString = next.toString();
      const destination = queryString ? `${pathname}?${queryString}` : pathname;
      if (replace) router.replace(destination, { scroll: false });
      else router.push(destination, { scroll: false });
    },
    [currentParams, pathname, router],
  );

  const apiPath = useMemo(() => {
    const query = new URLSearchParams({
      limit: String(limit),
      skip: String(skip),
    });
    if (status) query.set("status", status);
    if (type) query.set("type", type);
    if (urlSearch.trim().length >= 2) query.set("search", urlSearch.trim());
    return `/jobs/admin/list?${query.toString()}`;
  }, [limit, skip, status, type, urlSearch]);

  const { data, loading, error, refetch } =
    useAdminQuery<AdminJobsResponse>(apiPath);

  useEffect(() => {
    if (!data) return;
    const lastPage = Math.max(1, Math.ceil(data.total / limit));
    if (page > lastPage) navigateParams({ page: String(lastPage) }, true);
  }, [data, limit, navigateParams, page]);

  const updateSearch = useCallback(
    (value: string) => {
      navigateParams({ search: value || null, page: "1" });
    },
    [navigateParams],
  );

  const statusCounts = data?.status_counts;

  const columns: DataTableColumn<AdminJob>[] = [
    {
      key: "title",
      header: "Job",
      className: "min-w-56",
      render: (job) => (
        <div>
          <p className="font-semibold text-text-primary">{job.title}</p>
          <p className="mt-0.5 max-w-72 truncate text-xs text-text-hint">
            {job.description}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (job) => <Badge variant="neutral">{titleCase(job.type)}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      render: (job) => (
        <Badge variant={statusVariants[job.status] ?? "neutral"}>
          {titleCase(job.status)}
        </Badge>
      ),
    },
    {
      key: "category",
      header: "Category",
      className: "min-w-40",
      render: (job) => (
        <span className="text-sm text-text-secondary">
          {categoryNames(job)}
        </span>
      ),
    },
    {
      key: "client",
      header: "Client",
      className: "min-w-40",
      render: (job) => (
        <span className="text-sm text-text-secondary">
          {personName(job.client?.clientId)}
        </span>
      ),
    },
    {
      key: "provider",
      header: "Provider",
      className: "min-w-40",
      render: (job) => (
        <span className="text-sm text-text-secondary">
          {personName(job.provider?.providerId, "Unassigned")}
        </span>
      ),
    },
    {
      key: "budget",
      header: "Budget",
      className: "min-w-28",
      render: (job) => (
        <span className="whitespace-nowrap text-sm text-text-secondary">
          {formatBudget(job)}
        </span>
      ),
    },
    {
      key: "created",
      header: "Created",
      className: "min-w-28",
      render: (job) => (
        <span className="whitespace-nowrap text-sm text-text-secondary">
          {formatDate(job.createdAt)}
        </span>
      ),
    },
    {
      key: "action",
      header: "",
      className: "text-right",
      render: (job) => (
        <Link
          href={`/admin/jobs/${job._id}`}
          onClick={(event) => event.stopPropagation()}
          aria-label={`View ${job.title}`}
          className="inline-flex size-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      ),
    },
  ];

  const hasActiveFilters = Boolean(status || type || urlSearch.trim());
  const clearFilters = () =>
    router.push(pathname, { scroll: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Jobs</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {data
              ? `${data.total.toLocaleString()} ${status ? titleCase(status).toLowerCase() : "total"} jobs`
              : "All client jobs across the platform"}
          </p>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {statusCounts && (
        <div className="flex flex-wrap gap-2" aria-label="Job status summary">
          <button
            type="button"
            onClick={() => navigateParams({ status: null, page: "1" })}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              !status
                ? "border-primary bg-primary text-white"
                : "border-hairline bg-white text-slate hover:border-primary hover:text-primary"
            }`}
          >
            All
          </button>
          {statusOptions.slice(1).map((option) => {
            const value = option.value as JobStatus;
            const active = status === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() =>
                  navigateParams({ status: active ? null : value, page: "1" })
                }
                className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-hairline bg-white text-slate hover:border-primary hover:text-primary"
                }`}
              >
                {option.label}
                <span className="ml-1.5 text-xs opacity-70">
                  {statusCounts[value] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <section
        className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:grid-cols-3"
        aria-label="Job filters"
      >
        <DebouncedSearchInput
          key={urlSearch}
          initialValue={urlSearch}
          onSearchChange={updateSearch}
        />
        <Select
          label="Status"
          value={status}
          onChange={(event) =>
            navigateParams({ status: event.target.value || null, page: "1" })
          }
          options={statusOptions}
        />
        <Select
          label="Type"
          value={type}
          onChange={(event) =>
            navigateParams({ type: event.target.value || null, page: "1" })
          }
          options={typeOptions}
        />
      </section>

      {error ? (
        <div className="rounded-2xl border border-error/30 bg-surface p-6">
          <p className="text-sm font-semibold text-error">Failed to load jobs</p>
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
          caption="Admin job list"
          columns={columns}
          rows={data?.jobs ?? []}
          loading={loading}
          skeletonRows={8}
          rowKey={(job) => job._id}
          emptyState={
            <EmptyState
              icon={<Briefcase className="size-5" aria-hidden="true" />}
              title="No jobs found"
              subtitle={
                hasActiveFilters
                  ? "No jobs match these filters."
                  : "There are no jobs to display."
              }
              action={
                hasActiveFilters ? (
                  <Button variant="secondary" size="sm" onClick={clearFilters}>
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
              navigateParams({ limit: event.target.value, page: "1" })
            }
            options={[
              { value: "10", label: "10" },
              { value: "20", label: "20" },
              { value: "50", label: "50" },
              { value: "100", label: "100" },
            ]}
          />
          <Pagination
            mode="page"
            page={page}
            totalPages={Math.max(1, Math.ceil(data.total / limit))}
            total={data.total}
            limit={limit}
            onPageChange={(nextPage) =>
              navigateParams({ page: String(nextPage) })
            }
          />
        </div>
      )}
    </div>
  );
}
