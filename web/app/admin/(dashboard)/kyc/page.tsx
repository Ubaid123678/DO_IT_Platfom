"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { useAdminQuery } from "@/hooks/useAdminQuery";
import { useDebounce } from "@/hooks/useDebounce";
import type { KycStatus, KycSubmission, KycSubmissionsResponse } from "@/types/kyc";

type KycTab = KycStatus | "all";

const DEFAULT_LIMIT = 20;
const tabs: { value: KycTab; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const statusVariant: Record<KycStatus, BadgeVariant> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
};

const documentLabel = (value: string): string => {
  const labels: Record<string, string> = {
    pass: "Passport",
    passport: "Passport",
    driving_license: "Driving license",
  };
  return labels[value] ?? value.replaceAll("_", " ");
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

const parsePositiveInteger = (
  value: string | null,
  fallback: number,
  max?: number,
): number => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return max ? Math.min(parsed, max) : parsed;
};

function DebouncedSearch({
  initialValue,
  onSearch,
}: {
  initialValue: string;
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, 350);

  useEffect(() => {
    const search = debouncedValue.trim();
    if (search === initialValue) return;
    if (search.length >= 2 || search.length === 0) onSearch(search);
  }, [debouncedValue, initialValue, onSearch]);

  return (
    <Input
      label="Search"
      type="search"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder="Name or email (2+ characters)"
      autoComplete="off"
    />
  );
}

export default function AdminKycQueuePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const params = useMemo(() => new URLSearchParams(currentQuery), [currentQuery]);
  const page = parsePositiveInteger(params.get("page"), 1);
  const limit = parsePositiveInteger(params.get("limit"), DEFAULT_LIMIT, 100);
  const rawStatus = params.get("status");
  const status: KycTab = tabs.some((tab) => tab.value === rawStatus)
    ? (rawStatus as KycTab)
    : "pending";
  const search = params.get("search")?.trim() ?? "";

  const updateUrl = useCallback(
    (updates: Record<string, string | null>, replace = false) => {
      const next = new URLSearchParams(currentQuery);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const query = next.toString();
      const target = query ? `${pathname}?${query}` : pathname;
      if (replace) router.replace(target, { scroll: false });
      else router.push(target, { scroll: false });
    },
    [currentQuery, pathname, router],
  );

  useEffect(() => {
    const next = new URLSearchParams(currentQuery);
    let changed = false;
    if (!next.has("page") || parsePositiveInteger(next.get("page"), 1) !== page) {
      next.set("page", String(page));
      changed = true;
    }
    if (!next.has("limit") || parsePositiveInteger(next.get("limit"), DEFAULT_LIMIT, 100) !== limit) {
      next.set("limit", String(limit));
      changed = true;
    }
    if (!tabs.some((tab) => tab.value === rawStatus)) {
      next.set("status", "pending");
      changed = true;
    }
    if (params.has("search") && search !== params.get("search")) {
      if (search) next.set("search", search);
      else next.delete("search");
      changed = true;
    }
    if (search.length === 1) {
      next.delete("search");
      changed = true;
    }
    if (changed) router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [currentQuery, limit, page, params, pathname, rawStatus, router, search]);

  const apiSearch = useMemo(() => {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sort_order: "desc",
    });
    if (status !== "all") query.set("status", status);
    if (search.length >= 2) query.set("search", search);
    return query.toString();
  }, [limit, page, search, status]);
  const { data, loading, error, refetch } = useAdminQuery<KycSubmissionsResponse>(
    `/kyc/admin/submissions?${apiSearch}`,
  );

  useEffect(() => {
    if (!data) return;
    const lastPage = Math.max(1, data.pagination.totalPages);
    if (page > lastPage) updateUrl({ page: String(lastPage) }, true);
  }, [data, page, updateUrl]);

  const onSearch = useCallback(
    (value: string) => {
      const next = new URLSearchParams(currentQuery);
      if (value.length >= 2) next.set("search", value);
      else next.delete("search");
      next.set("page", "1");
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [currentQuery, pathname, router],
  );

  const columns: DataTableColumn<KycSubmission>[] = [
    {
      key: "user",
      header: "User",
      className: "min-w-56",
      render: (submission) => (
        <div>
          <p className="font-semibold text-text-primary">
            {submission.user.fullName}
          </p>
          <p className="mt-0.5 text-xs text-text-hint">{submission.user.email}</p>
        </div>
      ),
    },
    {
      key: "document",
      header: "Document type",
      render: (submission) => (
        <span className="text-sm text-text-secondary">
          {documentLabel(submission.documentType)}
        </span>
      ),
    },
    {
      key: "country",
      header: "Country",
      render: (submission) => (
        <span className="text-sm text-text-secondary">
          {submission.countryCode}
        </span>
      ),
    },
    {
      key: "submitted",
      header: "Submitted",
      className: "min-w-40",
      render: (submission) => (
        <span className="whitespace-nowrap text-sm text-text-secondary">
          {formatDate(submission.submittedAt)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (submission) => (
        <Badge variant={statusVariant[submission.status]}>
          {submission.status[0].toUpperCase() + submission.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: "action",
      header: "",
      className: "text-right",
      render: (submission) => (
        <Link
          href={`/admin/kyc/${submission.userId}`}
          onClick={(event) => event.stopPropagation()}
          className="rounded-lg px-2 py-1 text-sm font-medium text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Review
        </Link>
      ),
    },
  ];

  const clearFilters = () => {
    const next = new URLSearchParams({
      page: "1",
      limit: String(limit),
      status: "pending",
    });
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const emptyState =
    status === "pending" && !search ? (
      <EmptyState
        icon={<CheckCircle2 className="size-5" aria-hidden="true" />}
        title="No pending KYC submissions"
        subtitle="There are no pending submissions to review right now."
      />
    ) : (
      <EmptyState
        title="No submissions found"
        subtitle="Try another status or search term."
        action={
          search ? (
            <Button size="sm" variant="secondary" onClick={clearFilters}>
              Clear search
            </Button>
          ) : undefined
        }
      />
    );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">KYC Review</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {data
              ? `${data.pagination.total.toLocaleString()} submissions`
              : "Review submitted identity documents"}
          </p>
        </div>
        {search && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </header>

      <nav
        className="flex flex-wrap gap-1 rounded-2xl border border-border bg-surface p-1.5"
        aria-label="KYC status filters"
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={status === tab.value}
            onClick={() =>
              updateUrl({
                status: tab.value,
                page: "1",
              })
            }
            className={`min-h-10 rounded-xl px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              status === tab.value
                ? "bg-primary text-white"
                : "text-text-secondary hover:bg-primary-light"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="max-w-xl">
        <DebouncedSearch key={search} initialValue={search} onSearch={onSearch} />
      </div>

      {error ? (
        <div className="rounded-2xl border border-error/30 bg-surface p-6">
          <p className="text-sm font-semibold text-error">
            Failed to load KYC submissions
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
          caption="KYC submissions"
          columns={columns}
          rows={data?.submissions ?? []}
          loading={loading}
          skeletonRows={8}
          rowKey={(submission) => submission.id}
          onRowClick={(submission) =>
            router.push(`/admin/kyc/${submission.userId}`)
          }
          emptyState={emptyState}
        />
      )}

      {!error && data && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Select
            label="Rows per page"
            className="w-32"
            value={String(limit)}
            onChange={(event) =>
              updateUrl({ limit: event.target.value, page: "1" })
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
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            limit={data.pagination.limit}
            onPageChange={(nextPage) =>
              updateUrl({ page: String(nextPage) })
            }
          />
        </div>
      )}
    </div>
  );
}
