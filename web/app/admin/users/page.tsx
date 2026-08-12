"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users as UsersIcon, CheckCircle2, XCircle } from "lucide-react";
import { FilterBar } from "@/components/admin/FilterBar";
import { Table, type Column } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { StatusPill } from "@/components/admin/StatusPill";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { timeAgo, type AdminUser, type UsersResponse } from "@/lib/users";

const LIMIT = 20;

const roleVariant: Record<string, BadgeVariant> = {
  provider: "primary",
  client: "neutral",
  admin: "amber",
  pending: "warning",
};

const roleOptions = [
  { value: "all", label: "All Roles" },
  { value: "client", label: "Client" },
  { value: "provider", label: "Provider" },
  { value: "admin", label: "Admin" },
  { value: "pending", label: "Pending" },
];

const kycOptions = [
  { value: "all", label: "All KYC" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "missing", label: "Missing" },
];

const overallOptions = [
  { value: "all", label: "All Status" },
  { value: "verified", label: "Verified" },
  { value: "partially_verified", label: "Partially Verified" },
  { value: "pending", label: "Pending" },
  { value: "incomplete", label: "Incomplete" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const { fetchUsers } = useAdminUsers();

  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [kycStatus, setKycStatus] = useState("all");
  const [overallStatus, setOverallStatus] = useState("all");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const result = await fetchUsers({
          page,
          limit: LIMIT,
          search,
          role,
          kyc_status: kycStatus,
          overall_status: overallStatus,
        });
        if (cancelled) return;
        setData(result);
        setError(false);
        setLoading(false);
        // Page-overflow guard: a filter/search change can push the current page
        // past the last valid one — clamp and refetch.
        if (result.pagination.total > 0 && page > result.pagination.totalPages) {
          setPage(result.pagination.totalPages);
        }
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
  }, [page, search, role, kycStatus, overallStatus, fetchUsers]);

  const hasActiveFilters =
    search.trim().length > 0 || role !== "all" || kycStatus !== "all" || overallStatus !== "all";

  const handleClearFilters = () => {
    setSearch("");
    setRole("all");
    setKycStatus("all");
    setOverallStatus("all");
    setPage(1);
    setLoading(true);
  };

  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
    setLoading(true);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    setLoading(true);
  };

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      header: "Name",
      render: (user) => (
        <div className="min-w-[220px]">
          <p className="text-[14px] font-semibold text-text-primary">{user.fullName}</p>
          <p className="mt-0.5 text-[12px] text-text-hint">
            {user.email} · {user.phone}
          </p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (user) => (
        <Badge variant={roleVariant[user.role] ?? "neutral"}>{user.role}</Badge>
      ),
    },
    {
      key: "country",
      header: "Country",
      render: (user) => <span className="text-[13px] text-text-secondary">{user.countryCode}</span>,
    },
    {
      key: "verified",
      header: "Verified",
      render: (user) => (
        <div className="flex flex-col gap-0.5">
          <span className={`flex items-center gap-1 text-[12px] ${user.emailVerified ? "text-success" : "text-text-hint"}`}>
            {user.emailVerified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            Email
          </span>
          <span className={`flex items-center gap-1 text-[12px] ${user.phoneVerified ? "text-success" : "text-text-hint"}`}>
            {user.phoneVerified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            Phone
          </span>
        </div>
      ),
    },
    {
      key: "kyc",
      header: "KYC",
      render: (user) =>
        user.role === "provider" ? (
          <StatusPill status={user.kyc_status ?? "missing"} variant="kyc" />
        ) : (
          <span className="text-[13px] text-text-hint">—</span>
        ),
    },
    {
      key: "overall",
      header: "Overall Status",
      render: (user) =>
        user.role === "provider" ? (
          <StatusPill status={user.overall_status ?? "incomplete"} variant="overall" />
        ) : (
          <span className="text-[13px] text-text-hint">—</span>
        ),
    },
    {
      key: "joined",
      header: "Joined",
      render: (user) => <span className="text-[13px] text-text-secondary">{timeAgo(user.createdAt)}</span>,
    },
  ];

  const emptyTitle = search.trim()
    ? "No users match your search"
    : hasActiveFilters
      ? "No users match these filters"
      : "No users found";

  const emptySubtitle = search.trim()
    ? "Try a different name, email, or phone number."
    : hasActiveFilters
      ? "Try removing some filters to see more users."
      : undefined;

  const emptyAction = hasActiveFilters ? (
    <Button size="sm" variant="secondary" onClick={handleClearFilters}>
      Clear filters
    </Button>
  ) : undefined;

  return (
    <div className="space-y-5">
      <h1 className="text-[24px] font-bold text-text-primary">Users</h1>

      <FilterBar
        search={{
          value: search,
          onChange: handleFilterChange(setSearch),
          placeholder: "Search name, email, or phone…",
        }}
        filters={[
          { key: "role", label: "Role", value: role, onChange: handleFilterChange(setRole), options: roleOptions },
          { key: "kyc", label: "KYC Status", value: kycStatus, onChange: handleFilterChange(setKycStatus), options: kycOptions },
          { key: "overall", label: "Overall Status", value: overallStatus, onChange: handleFilterChange(setOverallStatus), options: overallOptions },
        ]}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {error ? (
        <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center">
          <p className="text-[14px] text-text-secondary">Failed to load users</p>
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
          rows={data?.users ?? []}
          loading={loading}
          rowKey={(user) => user.id}
          onRowClick={(user) => router.push(`/admin/users/${user.id}`)}
          empty={
            <EmptyState icon={<UsersIcon className="h-5 w-5" />} title={emptyTitle} subtitle={emptySubtitle} action={emptyAction} />
          }
        />
      )}

      {!error && data && data.pagination.totalPages > 1 && (
        <Pagination
          mode="page"
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
