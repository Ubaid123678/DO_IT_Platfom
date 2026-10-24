"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminQuery } from "@/hooks/useAdminQuery";
import { ApiRequestError } from "@/lib/api";

interface PopulatedRef {
  _id?: string;
  fullName?: string;
  email?: string;
  name?: string;
}

interface AdminJobDetail {
  _id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  budget?: { type?: string; amount?: number; currency?: string };
  schedule?: {
    startsAt?: string;
    endsAt?: string;
    isFlexible?: boolean;
    timezone?: string;
  };
  location?: { city?: string; country?: string; address?: string };
  client?: { clientId?: PopulatedRef | null } | null;
  provider?: { providerId?: PopulatedRef | null } | null;
  requirements?: {
    categories?: (PopulatedRef | string)[] | null;
    skillItems?: (PopulatedRef | string)[] | null;
    experienceLevel?: string;
  } | null;
  metadata?: { isUrgent?: boolean; views?: number };
  createdAt: string;
  updatedAt: string;
}

interface JobResponse {
  job: AdminJobDetail;
}

const statusVariants: Record<string, BadgeVariant> = {
  open: "pending",
  in_progress: "partially_verified",
  completed: "approved",
  cancelled: "neutral",
  disputed: "rejected",
  resolved: "verified",
};

const titleCase = (value: string): string =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value?: string): string => {
  if (!value) return "—";
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

const formatBudget = (job: AdminJobDetail): string => {
  const amount = job.budget?.amount;
  if (typeof amount !== "number") return "—";
  const currency = job.budget?.currency ?? "USD";
  const formatted = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount / 100);
  return job.budget?.type === "hourly" ? `${formatted}/hr` : formatted;
};

const refNames = (refs?: (PopulatedRef | string)[] | null): string => {
  const names = (refs ?? [])
    .map((ref) => (typeof ref === "string" ? ref : ref.name))
    .filter((name): name is string => Boolean(name));
  return names.length ? names.join(", ") : "—";
};

const personName = (person?: PopulatedRef | null, fallback = "—"): string =>
  person?.fullName ?? person?.email ?? fallback;

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-1 border-b border-border/60 py-3 last:border-0">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="max-w-[70%] text-right text-sm font-medium text-text-primary">
        {value}
      </dd>
    </div>
  );
}

export default function AdminJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const path = `/jobs/${encodeURIComponent(id)}`;
  const { data, loading, error, refetch } = useAdminQuery<JobResponse>(path);

  const notFound = error instanceof ApiRequestError && error.status === 404;

  if (loading) {
    return (
      <div className="space-y-5" aria-busy="true" aria-label="Loading job">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-5">
        <Link
          href="/admin/jobs"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to jobs
        </Link>
        <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center">
          <h1 className="text-base font-semibold text-text-primary">Job not found</h1>
          <p className="mt-1 text-sm text-text-hint">
            This job may have been removed.
          </p>
        </div>
      </div>
    );
  }

  if (error || !data?.job) {
    return (
      <ErrorState
        title="Failed to load job"
        message={error?.message ?? "The job could not be loaded."}
        onRetry={refetch}
        retryLabel="Retry"
      />
    );
  }

  const job = data.job;
  const clientId = job.client?.clientId?._id;
  const providerId = job.provider?.providerId?._id;

  return (
    <div className="space-y-5">
      <Link
        href="/admin/jobs"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to jobs
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-text-primary">{job.title}</h1>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
              {job.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariants[job.status] ?? "neutral"}>
              {titleCase(job.status)}
            </Badge>
            <Badge variant="neutral">{titleCase(job.type)}</Badge>
            {job.metadata?.isUrgent && <Badge variant="overdue">Urgent</Badge>}
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Details">
          <dl>
            <DetailRow label="Budget" value={formatBudget(job)} />
            <DetailRow
              label="Experience level"
              value={job.requirements?.experienceLevel ?? "—"}
            />
            <DetailRow label="Category" value={refNames(job.requirements?.categories)} />
            <DetailRow label="Skills" value={refNames(job.requirements?.skillItems)} />
            <DetailRow label="Created" value={formatDate(job.createdAt)} />
            <DetailRow label="Updated" value={formatDate(job.updatedAt)} />
          </dl>
        </Card>

        <Card title="Parties & location">
          <dl>
            <DetailRow
              label="Client"
              value={
                clientId ? (
                  <Link
                    href={`/admin/users/${clientId}`}
                    className="text-primary hover:text-primary-dark"
                  >
                    {personName(job.client?.clientId)}
                  </Link>
                ) : (
                  personName(job.client?.clientId)
                )
              }
            />
            <DetailRow
              label="Provider"
              value={
                providerId ? (
                  <Link
                    href={`/admin/users/${providerId}`}
                    className="text-primary hover:text-primary-dark"
                  >
                    {personName(job.provider?.providerId)}
                  </Link>
                ) : (
                  "Unassigned"
                )
              }
            />
            <DetailRow
              label="Location"
              value={
                [job.location?.city, job.location?.country]
                  .filter(Boolean)
                  .join(", ") || "—"
              }
            />
            <DetailRow
              label="Schedule"
              value={
                job.schedule?.isFlexible
                  ? "Flexible"
                  : formatDate(job.schedule?.startsAt)
              }
            />
            <DetailRow
              label="Views"
              value={String(job.metadata?.views ?? 0)}
            />
          </dl>
        </Card>
      </div>
    </div>
  );
}
