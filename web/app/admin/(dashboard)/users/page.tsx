"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, ArrowUpRight, Users } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select, type SelectOption } from "@/components/ui/Select";
import { useAdminQuery } from "@/hooks/useAdminQuery";
import { useDebounce } from "@/hooks/useDebounce";
import type {
  AdminKycStatus,
  AdminOverallStatus,
  AdminSortOrder,
  AdminTrack,
  AdminUserListItem,
  AdminUserRole,
  AdminUserSortField,
  AdminUsersQuery,
  AdminUsersResponse,
} from "@/types/admin";

const DEFAULT_LIMIT = 20;
const DEFAULT_SORT_BY: AdminUserSortField = "createdAt";
const DEFAULT_SORT_ORDER: AdminSortOrder = "desc";

const roleOptions: SelectOption[] = [
  { value: "", label: "All roles" },
  { value: "client", label: "Client" },
  { value: "provider", label: "Provider" },
  { value: "admin", label: "Admin" },
  { value: "pending", label: "Pending" },
];

const verificationOptions: SelectOption[] = [
  { value: "", label: "Any" },
  { value: "true", label: "Verified" },
  { value: "false", label: "Not verified" },
];

const kycOptions: SelectOption[] = [
  { value: "", label: "All KYC statuses" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "missing", label: "Missing" },
];

const overallOptions: SelectOption[] = [
  { value: "", label: "All overall statuses" },
  { value: "incomplete", label: "Incomplete" },
  { value: "pending", label: "Pending" },
  { value: "partially_verified", label: "Partially verified" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

const trackOptions: SelectOption[] = [
  { value: "", label: "All tracks" },
  { value: "physical", label: "Physical" },
  { value: "digital", label: "Digital" },
  { value: "errand", label: "Errand" },
];

const sortOptions: SelectOption[] = [
  { value: "createdAt", label: "Joined date" },
  { value: "updatedAt", label: "Updated date" },
  { value: "fullName", label: "Name" },
  { value: "email", label: "Email" },
];

const roleVariants: Record<AdminUserRole, BadgeVariant> = {
  client: "neutral",
  provider: "approved",
  admin: "partially_verified",
  pending: "pending",
};

const kycVariants: Record<AdminKycStatus, BadgeVariant> = {
  approved: "approved",
  pending: "pending",
  rejected: "rejected",
  missing: "neutral",
};

const overallVariants: Record<AdminOverallStatus, BadgeVariant> = {
  incomplete: "incomplete",
  pending: "pending",
  partially_verified: "partially_verified",
  verified: "verified",
  rejected: "rejected",
};

const titleCase = (value: string): string =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const getParam = (params: URLSearchParams, key: string): string =>
  params.get(key) ?? "";

const getSafeNumber = (
  value: string | null,
  fallback: number,
  maximum?: number,
): number => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return maximum ? Math.min(parsed, maximum) : parsed;
};

const buildQuery = (params: URLSearchParams): AdminUsersQuery => {
  const query: AdminUsersQuery = {
    page: getSafeNumber(params.get("page"), 1),
    limit: getSafeNumber(params.get("limit"), DEFAULT_LIMIT, 100),
    sort_by: sortOptions.some((option) => option.value === params.get("sort_by"))
      ? (params.get("sort_by") as AdminUserSortField)
      : DEFAULT_SORT_BY,
    sort_order: params.get("sort_order") === "asc" ? "asc" : DEFAULT_SORT_ORDER,
  };

  const search = params.get("search")?.trim();
  if (search && search.length >= 2) query.search = search;

  const role = params.get("role");
  if (roleOptions.some((option) => option.value === role && role)) {
    query.role = role as AdminUserRole;
  }

  const emailVerified = params.get("email_verified");
  if (emailVerified === "true" || emailVerified === "false") {
    query.email_verified = emailVerified === "true";
  }

  const phoneVerified = params.get("phone_verified");
  if (phoneVerified === "true" || phoneVerified === "false") {
    query.phone_verified = phoneVerified === "true";
  }

  const kycStatus = params.get("kyc_status");
  if (kycOptions.some((option) => option.value === kycStatus && kycStatus)) {
    query.kyc_status = kycStatus as AdminKycStatus;
  }

  const overallStatus = params.get("overall_status");
  if (
    overallOptions.some(
      (option) => option.value === overallStatus && overallStatus,
    )
  ) {
    query.overall_status = overallStatus as AdminOverallStatus;
  }

  const track = params.get("track");
  if (trackOptions.some((option) => option.value === track && track)) {
    query.track = track as AdminTrack;
  }

  return query;
};

const createApiSearch = (query: AdminUsersQuery): string => {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    sort_by: query.sort_by,
    sort_order: query.sort_order,
  });

  if (query.search) params.set("search", query.search);
  if (query.role) params.set("role", query.role);
  if (query.email_verified !== undefined) {
    params.set("email_verified", String(query.email_verified));
  }
  if (query.phone_verified !== undefined) {
    params.set("phone_verified", String(query.phone_verified));
  }
  if (query.kyc_status) params.set("kyc_status", query.kyc_status);
  if (query.overall_status) params.set("overall_status", query.overall_status);
  if (query.track) params.set("track", query.track);

  return params.toString();
};

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
      placeholder="Name, email, or phone (2+ characters)"
      autoComplete="off"
    />
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentParams = searchParams.toString();
  const urlSearch = searchParams.get("search") ?? "";

  const query = useMemo(
    () => buildQuery(new URLSearchParams(currentParams)),
    [currentParams],
  );
  const apiPath = useMemo(
    () => `/admin/users?${createApiSearch(query)}`,
    [query],
  );
  const { data, loading, error, refetch } =
    useAdminQuery<AdminUsersResponse>(apiPath);

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

  useEffect(() => {
    const params = new URLSearchParams(currentParams);
    let needsReplace = false;
    if (!params.has("page")) {
      params.set("page", "1");
      needsReplace = true;
    } else if (getSafeNumber(params.get("page"), 1) !== Number(params.get("page"))) {
      params.set("page", "1");
      needsReplace = true;
    }
    if (!params.has("limit")) {
      params.set("limit", String(DEFAULT_LIMIT));
      needsReplace = true;
    } else if (
      getSafeNumber(params.get("limit"), DEFAULT_LIMIT, 100) !==
      Number(params.get("limit"))
    ) {
      params.set("limit", String(getSafeNumber(params.get("limit"), DEFAULT_LIMIT, 100)));
      needsReplace = true;
    }
    if (!params.has("sort_by")) {
      params.set("sort_by", DEFAULT_SORT_BY);
      needsReplace = true;
    } else if (
      !sortOptions.some((option) => option.value === params.get("sort_by"))
    ) {
      params.set("sort_by", DEFAULT_SORT_BY);
      needsReplace = true;
    }
    if (!params.has("sort_order")) {
      params.set("sort_order", DEFAULT_SORT_ORDER);
      needsReplace = true;
    } else if (params.get("sort_order") !== "asc" && params.get("sort_order") !== "desc") {
      params.set("sort_order", DEFAULT_SORT_ORDER);
      needsReplace = true;
    }
    const validFilterValues: Record<string, string[]> = {
      role: roleOptions.map((option) => option.value).filter(Boolean),
      email_verified: ["true", "false"],
      phone_verified: ["true", "false"],
      kyc_status: kycOptions.map((option) => option.value).filter(Boolean),
      overall_status: overallOptions.map((option) => option.value).filter(Boolean),
      track: trackOptions.map((option) => option.value).filter(Boolean),
    };
    for (const [key, validValues] of Object.entries(validFilterValues)) {
      const value = params.get(key);
      if (value !== null && !validValues.includes(value)) {
        params.delete(key);
        needsReplace = true;
      }
    }
    const search = params.get("search");
    if (search !== null && search !== search.trim()) {
      if (search.trim()) params.set("search", search.trim());
      else params.delete("search");
      needsReplace = true;
    }
    if (needsReplace) {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [currentParams, pathname, router]);

  useEffect(() => {
    if (!data) return;
    const lastPage = Math.max(1, data.pagination.totalPages);
    if (query.page > lastPage) {
      navigateParams({ page: String(lastPage) }, true);
    }
  }, [data, navigateParams, query.page]);

  const updateFilter = (key: string, value: string) => {
    navigateParams(
      {
        [key]: value || null,
        page: "1",
      },
    );
  };

  const clearFilters = () => {
    router.push(
      `${pathname}?${new URLSearchParams({
        page: "1",
        limit: String(query.limit),
        sort_by: DEFAULT_SORT_BY,
        sort_order: DEFAULT_SORT_ORDER,
      })}`,
      { scroll: false },
    );
  };

  const hasActiveFilters = Boolean(
    urlSearch.trim() ||
      searchParams.get("role") ||
      searchParams.get("email_verified") ||
      searchParams.get("phone_verified") ||
      searchParams.get("kyc_status") ||
      searchParams.get("overall_status") ||
      searchParams.get("track") ||
      query.sort_by !== DEFAULT_SORT_BY ||
      query.sort_order !== DEFAULT_SORT_ORDER,
  );

  const toggleSortOrder = () =>
    navigateParams({
      sort_by: "createdAt",
      sort_order:
        query.sort_by === "createdAt"
          ? query.sort_order === "asc"
            ? "desc"
            : "asc"
          : DEFAULT_SORT_ORDER,
      page: "1",
    });

  const updateSearch = useCallback(
    (value: string) => {
      const next = new URLSearchParams(currentParams);
      if (value) next.set("search", value);
      else next.delete("search");
      next.set("page", "1");
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [currentParams, pathname, router],
  );

  const columns: DataTableColumn<AdminUserListItem>[] = [
    {
      key: "name",
      header: "Name",
      className: "min-w-48",
      render: (user) => (
        <div>
          <p className="font-semibold text-text-primary">{user.fullName}</p>
          {user.headline && (
            <p className="mt-0.5 max-w-52 truncate text-xs text-text-hint">
              {user.headline}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      className: "min-w-52",
      render: (user) => (
        <span className="text-text-secondary">{user.email}</span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      className: "min-w-36",
      render: (user) => (
        <span className="whitespace-nowrap text-text-secondary">{user.phone}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (user) => (
        <Badge variant={roleVariants[user.role]}>{titleCase(user.role)}</Badge>
      ),
    },
    {
      key: "verification",
      header: "Verification",
      className: "min-w-36",
      render: (user) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant={user.emailVerified ? "approved" : "neutral"}>
            Email {user.emailVerified ? "verified" : "unverified"}
          </Badge>
          <Badge variant={user.phoneVerified ? "approved" : "neutral"}>
            Phone {user.phoneVerified ? "verified" : "unverified"}
          </Badge>
        </div>
      ),
    },
    {
      key: "kyc",
      header: "KYC status",
      render: (user) => (
        <Badge variant={kycVariants[user.kyc_status]}>
          {titleCase(user.kyc_status)}
        </Badge>
      ),
    },
    {
      key: "overall",
      header: "Overall status",
      className: "min-w-40",
      render: (user) => (
        <Badge variant={overallVariants[user.overall_status]}>
          {titleCase(user.overall_status)}
        </Badge>
      ),
    },
    {
      key: "track",
      header: "Track",
      render: (user) => (
        <span className="text-text-secondary">
          {user.track ? titleCase(user.track) : "—"}
        </span>
      ),
    },
    {
      key: "joined",
      header: (
        <button
          type="button"
          onClick={toggleSortOrder}
          className="inline-flex items-center gap-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={`Sort by joined date, currently ${query.sort_order}`}
        >
          Joined
          {query.sort_by === "createdAt" ? (
            query.sort_order === "asc" ? (
              <ArrowUp className="size-3.5" aria-hidden="true" />
            ) : (
              <ArrowDown className="size-3.5" aria-hidden="true" />
            )
          ) : (
            <ArrowUpDown className="size-3.5" aria-hidden="true" />
          )}
        </button>
      ),
      className: "min-w-32",
      render: (user) => (
        <span className="whitespace-nowrap text-text-secondary">
          {formatDate(user.createdAt)}
        </span>
      ),
    },
    {
      key: "action",
      header: "",
      className: "text-right",
      render: (user) => (
        <Link
          href={`/admin/users/${user.id}`}
          onClick={(event) => event.stopPropagation()}
          aria-label={`View ${user.fullName}`}
          className="inline-flex size-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      ),
    },
  ];

  const emptyState = (
    <EmptyState
      icon={<Users className="size-5" aria-hidden="true" />}
      title="No users found"
      subtitle={
        hasActiveFilters
          ? "No users match these search and filter criteria."
          : "There are no users to display."
      }
      action={
        hasActiveFilters ? (
          <Button variant="secondary" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : undefined
      }
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Users</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {data
              ? `${data.pagination.total.toLocaleString()} total users`
              : "Manage platform accounts"}
          </p>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      <section
        className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5"
        aria-label="User search and filters"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DebouncedSearchInput
            key={urlSearch}
            initialValue={urlSearch}
            onSearchChange={updateSearch}
          />
          <Select
            label="Role"
            value={getParam(new URLSearchParams(currentParams), "role")}
            onChange={(event) => updateFilter("role", event.target.value)}
            options={roleOptions}
          />
          <Select
            label="Email verification"
            value={getParam(new URLSearchParams(currentParams), "email_verified")}
            onChange={(event) =>
              updateFilter("email_verified", event.target.value)
            }
            options={verificationOptions}
          />
          <Select
            label="Phone verification"
            value={getParam(new URLSearchParams(currentParams), "phone_verified")}
            onChange={(event) =>
              updateFilter("phone_verified", event.target.value)
            }
            options={verificationOptions}
          />
          <Select
            label="KYC status"
            value={getParam(new URLSearchParams(currentParams), "kyc_status")}
            onChange={(event) => updateFilter("kyc_status", event.target.value)}
            options={kycOptions}
          />
          <Select
            label="Overall status"
            value={getParam(new URLSearchParams(currentParams), "overall_status")}
            onChange={(event) =>
              updateFilter("overall_status", event.target.value)
            }
            options={overallOptions}
          />
          <Select
            label="Track"
            value={getParam(new URLSearchParams(currentParams), "track")}
            onChange={(event) => updateFilter("track", event.target.value)}
            options={trackOptions}
          />
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
            <Select
              label="Sort by"
              value={query.sort_by}
              onChange={(event) =>
                navigateParams({ sort_by: event.target.value, page: "1" })
              }
              options={sortOptions}
            />
            <Select
              label="Order"
              value={query.sort_order}
              onChange={(event) =>
                navigateParams({ sort_order: event.target.value, page: "1" })
              }
              options={[
                { value: "desc", label: "Descending" },
                { value: "asc", label: "Ascending" },
              ]}
            />
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-error/30 bg-surface p-6">
          <p className="text-sm font-semibold text-error">Failed to load users</p>
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
          caption="Admin user list"
          columns={columns}
          rows={data?.users ?? []}
          loading={loading}
          skeletonRows={8}
          rowKey={(user) => user.id}
          onRowClick={(user) => router.push(`/admin/users/${user.id}`)}
          emptyState={emptyState}
        />
      )}

      {!error && data && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Select
            label="Rows per page"
            className="w-32"
            value={String(query.limit)}
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
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            limit={data.pagination.limit}
            onPageChange={(page) => navigateParams({ page: String(page) })}
          />
        </div>
      )}
    </div>
  );
}
