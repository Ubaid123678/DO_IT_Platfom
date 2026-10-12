"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toaster";
import { useAdminQuery } from "@/hooks/useAdminQuery";
import { ApiRequestError, apiRequest } from "@/lib/api";
import type {
  AdminUserDetailResponse,
  AdminUserRole,
  AdminVerificationStatus,
} from "@/types/admin";

type UserAction = "role" | "deactivate" | "reactivate" | "delete";

const roleOptions: SelectOption[] = [
  { value: "client", label: "Client" },
  { value: "provider", label: "Provider" },
  { value: "admin", label: "Admin" },
  { value: "pending", label: "Pending" },
];

const roleVariants: Record<AdminUserRole, BadgeVariant> = {
  client: "neutral",
  provider: "approved",
  admin: "partially_verified",
  pending: "pending",
};

const statusVariants: Record<string, BadgeVariant> = {
  approved: "approved",
  auto_approved: "approved",
  verified: "verified",
  pending: "pending",
  pending_review: "pending",
  scheduled: "scheduled",
  rejected: "rejected",
  expired: "overdue",
  draft: "incomplete",
  missing: "neutral",
  incomplete: "incomplete",
  partially_verified: "partially_verified",
};

const verificationStatusLabels: Record<AdminVerificationStatus, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  scheduled: "Scheduled",
  auto_approved: "Auto-approved",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
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
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
};

const formatValue = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) {
    return value.map(formatValue).filter((entry) => entry !== "—").join(", ") || "—";
  }
  return JSON.stringify(value) ?? String(value);
};

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-1 border-b border-border/60 py-3 last:border-0">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="max-w-[70%] text-right text-sm font-medium text-text-primary">
        {children}
      </dd>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  return (
    <Badge variant={statusVariants[value] ?? "neutral"}>{titleCase(value)}</Badge>
  );
}

function StringPills({ values }: { values: string[] }) {
  return values.length ? (
    <span className="flex flex-wrap justify-end gap-1.5">
      {values.map((value, index) => (
        <Badge key={`${value}-${index}`} variant="neutral">
          {value}
        </Badge>
      ))}
    </span>
  ) : (
    <span className="text-text-hint">—</span>
  );
}

function RecordList({
  items,
  emptyLabel,
}: {
  items: Array<Record<string, unknown>>;
  emptyLabel: string;
}) {
  if (!items.length) {
    return <p className="text-sm text-text-hint">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={`${String(item.title ?? item.degree ?? item.institution ?? "item")}-${index}`}
          className="rounded-xl border border-border/70 bg-bg/50 p-4"
        >
          {Object.entries(item).map(([key, value]) => (
            <div
              key={key}
              className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-1 first:pt-0 last:pb-0"
            >
              <span className="text-xs text-text-hint">{titleCase(key)}</span>
              <span className="max-w-[70%] text-right text-sm text-text-primary">
                {formatValue(value)}
              </span>
            </div>
          ))}
        </li>
      ))}
    </ul>
  );
}

function UserDetailSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading user details" aria-busy="true">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <Skeleton className="h-56 w-full" />
    </div>
  );
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const userPath = `/admin/users/${encodeURIComponent(id)}`;
  const { data, loading, error, refetch } =
    useAdminQuery<AdminUserDetailResponse>(userPath);
  const [roleDraft, setRoleDraft] = useState<AdminUserRole | null>(null);
  const [action, setAction] = useState<UserAction | null>(null);
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const user = data?.user;
  const verificationCounts = data?.verification_counts;
  const isNotFound = error instanceof ApiRequestError && error.status === 404;
  const providerProfileRows = useMemo(
    () =>
      Object.entries(user?.provider_profile ?? {}).filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      ),
    [user?.provider_profile],
  );

  const openAction = (nextAction: UserAction) => {
    setReason("");
    setAction(nextAction);
  };

  const closeAction = () => {
    if (actionLoading) return;
    setAction(null);
    setReason("");
  };

  const submitAction = async () => {
    if (!user || !action) return;
    setActionLoading(true);
    const trimmedReason = reason.trim();

    try {
      if (action === "delete") {
        await apiRequest<{ user: unknown }>(userPath, {
          method: "DELETE",
          body: trimmedReason ? { reason: trimmedReason } : {},
        });
        toast.success("User deactivated");
      } else {
        const body =
          action === "role"
            ? {
                role: roleDraft ?? user.role,
                ...(trimmedReason ? { reason: trimmedReason } : {}),
              }
            : {
                isActive: action === "reactivate",
                ...(trimmedReason ? { reason: trimmedReason } : {}),
              };
        await apiRequest<{ user: unknown }>(userPath, {
          method: "PATCH",
          body,
        });
        toast.success(
          action === "role"
            ? "Role updated"
            : action === "deactivate"
              ? "Account deactivated"
              : "Account reactivated",
        );
      }

      setAction(null);
      setReason("");
      refetch();
    } catch (requestError: unknown) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "The user action failed.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <UserDetailSkeleton />;

  if (isNotFound) {
    return (
      <div className="space-y-5">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to users
        </Link>
        <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center">
          <UserRound className="mx-auto size-8 text-text-hint" aria-hidden="true" />
          <p className="mt-3 text-base font-semibold text-text-primary">
            User not found
          </p>
          <p className="mt-1 text-sm text-text-hint">
            This user may have been removed or the URL may be incorrect.
          </p>
        </div>
      </div>
    );
  }

  if (error || !user || !verificationCounts) {
    return (
      <ErrorState
        title="Failed to load user"
        message={error?.message ?? "User details could not be loaded."}
        onRetry={refetch}
        retryLabel="Retry"
      />
    );
  }

  const actionTitle: Record<UserAction, string> = {
    role: `Change ${user.fullName}'s role to ${titleCase(roleDraft ?? user.role)}?`,
    deactivate: `Deactivate ${user.fullName}?`,
    reactivate: `Reactivate ${user.fullName}?`,
    delete: `Delete ${user.fullName}?`,
  };
  const actionMessage: Record<UserAction, string> = {
    role: "Confirm the role change. An optional reason will be recorded in the admin action log.",
    deactivate: "This will prevent the account from signing in. An optional reason will be recorded.",
    reactivate: "This will restore the account's ability to sign in. An optional reason will be recorded.",
    delete: "This is a soft delete that deactivates the account. An optional reason will be recorded.",
  };
  const actionLabels: Record<UserAction, string> = {
    role: "Confirm role change",
    deactivate: "Deactivate",
    reactivate: "Reactivate",
    delete: "Delete user",
  };
  const actionVariant: Record<UserAction, "primary" | "danger"> = {
    role: "primary",
    deactivate: "danger",
    reactivate: "primary",
    delete: "danger",
  };
  const dialogMessage = action ? (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-text-secondary">
        {action === "role"
          ? `The role will be changed to ${titleCase(roleDraft ?? user.role)}. ${actionMessage[action]}`
          : actionMessage[action]}
      </p>
      <Input
        label="Reason (optional)"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        maxLength={500}
        placeholder="Add context for the admin action log"
      />
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <nav
        className="flex items-center gap-2 text-sm text-text-hint"
        aria-label="Breadcrumb"
      >
        <Link href="/admin/users" className="hover:text-primary">
          Users
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-text-primary">{user.fullName}</span>
      </nav>

      <Card>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
            <UserRound className="size-7" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-text-primary">{user.fullName}</h1>
            <p className="mt-1 break-all text-sm text-text-secondary">
              {user.email} · {user.phone}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={roleVariants[user.role]}>{titleCase(user.role)}</Badge>
              <Badge variant={user.isActive ? "active" : "inactive"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
              {user.track && <Badge variant="scheduled">{titleCase(user.track)} track</Badge>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.kyc_status !== "missing" && (
              <Link
                href={`/admin/kyc/${user.id}`}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium text-text-primary hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                View KYC <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            )}
            {user.role === "provider" && (
              <Link
                href={`/admin/users/${user.id}/profile`}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-primary px-3 text-sm font-medium text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                View provider profile
                <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Account information">
          <dl>
            <InfoRow label="Email">{user.email}</InfoRow>
            <InfoRow label="Phone">
              {user.countryCode} {user.phone}
            </InfoRow>
            <InfoRow label="Role">{titleCase(user.role)}</InfoRow>
            <InfoRow label="Account status">
              <Badge variant={user.isActive ? "active" : "inactive"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </InfoRow>
            <InfoRow label="Public profile">
              {user.public_profile ? "Public" : "Private"}
            </InfoRow>
            <InfoRow label="Joined">{formatDate(user.createdAt)}</InfoRow>
            <InfoRow label="Last updated">{formatDate(user.updatedAt)}</InfoRow>
          </dl>
        </Card>

        <Card title="Verification status">
          <dl>
            <InfoRow label="Email">
              <Badge variant={user.emailVerified ? "approved" : "neutral"}>
                {user.emailVerified ? "Verified" : "Not verified"}
              </Badge>
            </InfoRow>
            <InfoRow label="Phone">
              <Badge variant={user.phoneVerified ? "approved" : "neutral"}>
                {user.phoneVerified ? "Verified" : "Not verified"}
              </Badge>
            </InfoRow>
            <InfoRow label="KYC">
              <StatusBadge value={user.kyc_status} />
            </InfoRow>
            <InfoRow label="Overall status">
              <StatusBadge value={user.overall_status} />
            </InfoRow>
          </dl>
        </Card>
      </div>

      <Card
        title="Verification record counts"
        subtitle={`${verificationCounts.total} total verification records`}
      >
        <dl className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(verificationStatusLabels).map(([status, label]) => (
            <InfoRow key={status} label={label}>
              {verificationCounts[status as AdminVerificationStatus]}
            </InfoRow>
          ))}
        </dl>
      </Card>

      <Card
        title="Provider information"
        subtitle="Phase 3 profile details"
        action={
          user.role === "provider" ? (
            <Link
              href={`/admin/users/${user.id}/profile`}
              className="text-sm font-medium text-primary hover:text-primary-dark"
            >
              View profile
            </Link>
          ) : undefined
        }
      >
        <div className="grid gap-x-8 lg:grid-cols-2">
          <dl>
            <InfoRow label="Headline">{user.headline || "—"}</InfoRow>
            <InfoRow label="Track">
              {user.track ? titleCase(user.track) : "—"}
            </InfoRow>
            <InfoRow label="Languages">
              <StringPills values={user.languages} />
            </InfoRow>
            <InfoRow label="Categories">
              <StringPills values={user.categories_selected} />
            </InfoRow>
            <InfoRow label="Skills">
              <StringPills values={user.skill_items_selected} />
            </InfoRow>
          </dl>
          <div className="py-3">
            <h3 className="text-sm font-medium text-text-secondary">Bio</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-primary">
              {user.bio || "No bio provided."}
            </p>
          </div>
        </div>

        {providerProfileRows.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <h3 className="mb-2 text-sm font-semibold text-text-primary">
              Track profile
            </h3>
            <dl className="grid gap-x-8 sm:grid-cols-2">
              {providerProfileRows.map(([key, value]) => (
                <InfoRow key={key} label={titleCase(key)}>
                  {formatValue(value)}
                </InfoRow>
              ))}
            </dl>
          </div>
        )}

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section aria-labelledby="work-history-title">
            <h3
              id="work-history-title"
              className="mb-3 text-sm font-semibold text-text-primary"
            >
              Work history
            </h3>
            <RecordList
              items={user.work_history}
              emptyLabel="No work history provided."
            />
          </section>
          <section aria-labelledby="education-title">
            <h3
              id="education-title"
              className="mb-3 text-sm font-semibold text-text-primary"
            >
              Education
            </h3>
            <RecordList
              items={user.education}
              emptyLabel="No education details provided."
            />
          </section>
        </div>
      </Card>

      <Card title="Admin actions" subtitle="Changes are recorded in the admin action log.">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            label="Role"
            className="max-w-56"
            value={roleDraft ?? user.role}
            onChange={(event) => setRoleDraft(event.target.value as AdminUserRole)}
            options={roleOptions}
          />
          <Button
            className="mt-6"
            disabled={(roleDraft ?? user.role) === user.role}
            onClick={() => openAction("role")}
          >
            Change role
          </Button>

          {user.isActive ? (
            <Button
              className="mt-6"
              variant="danger"
              onClick={() => openAction("deactivate")}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              className="mt-6"
              variant="secondary"
              onClick={() => openAction("reactivate")}
            >
              Reactivate
            </Button>
          )}
          <Button
            className="mt-6"
            variant="danger"
            onClick={() => openAction("delete")}
          >
            <ShieldAlert className="size-4" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={action !== null}
        title={action ? actionTitle[action] : ""}
        message={dialogMessage}
        confirmLabel={action ? actionLabels[action] : "Confirm"}
        variant={action ? actionVariant[action] : "danger"}
        loading={actionLoading}
        onConfirm={() => void submitAction()}
        onCancel={closeAction}
      />
    </div>
  );
}
