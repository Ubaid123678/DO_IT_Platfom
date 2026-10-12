"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminDashboardStats } from "@/hooks/useAdminDashboardStats";
import type { AdminDashboardActivity } from "@/types/admin";

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const elapsed = Date.now() - date.getTime();
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function actionLabel(action: string): string {
  return action.replace(/[_-]+/g, " ");
}

function ActivityItem({ activity }: { activity: AdminDashboardActivity }) {
  const description = (
    <>
      <span className="font-semibold text-text-primary">
        {activity.admin.fullName}
      </span>{" "}
      {actionLabel(activity.action)}
      {activity.target ? (
        <>
          {" "}
          <span className="font-medium text-text-primary">
            {activity.target.fullName}
          </span>
        </>
      ) : null}
    </>
  );

  return (
    <li className="flex items-start gap-3 py-4 first:pt-1 last:pb-1">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
        <Activity className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-6 text-text-secondary">{description}</p>
        {activity.target?.email && (
          <p className="mt-0.5 truncate text-xs text-text-hint">
            {activity.target.email}
          </p>
        )}
      </div>
      <time
        dateTime={activity.created_at}
        className="shrink-0 pt-0.5 text-xs text-text-hint"
      >
        {formatRelativeTime(activity.created_at)}
      </time>
    </li>
  );
}

export default function AdminDashboardPage() {
  const { data, loading, error, refetch } = useAdminDashboardStats();

  const statCards = data
    ? [
        {
          label: "Total users",
          value: data.users.total,
          icon: Users,
          accent: "bg-text-hint",
          href: "/admin/users",
        },
        {
          label: "Providers",
          value: data.users.providers,
          icon: ShieldCheck,
          accent: "bg-primary",
          href: "/admin/users?role=provider",
        },
        {
          label: "New users · 7 days",
          value: data.users.newLast7Days,
          icon: UserPlus,
          accent: "bg-primary",
          href: "/admin/users?sort_by=createdAt&sort_order=desc",
        },
        {
          label: "Pending KYC",
          value: data.kyc.pending,
          icon: ShieldCheck,
          accent: "bg-amber",
          href: "/admin/kyc?status=pending",
        },
        {
          label: "Pending verification",
          value: data.verification.pending_review,
          icon: ClipboardCheck,
          accent: "bg-amber",
          href: "/admin/verification?status=pending_review",
        },
        {
          label: "SLA overdue",
          value: data.verification.slaOverdue,
          icon: AlertTriangle,
          accent: "bg-error",
          href: "/admin/verification?sla_overdue=true",
        },
        {
          label: "Approved today",
          value: data.verification.approvedToday,
          icon: CheckCircle2,
          accent: "bg-primary",
          href: "/admin/verification?status=approved",
        },
        {
          label: "Rejected today",
          value: data.verification.rejectedToday,
          icon: XCircle,
          accent: "bg-error",
          href: "/admin/verification?status=rejected",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="mt-1 text-sm text-text-hint">
            Platform overview and recent admin activity
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={refetch}
          loading={loading}
          aria-label="Refresh dashboard statistics"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {error ? (
        <Card>
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-text-primary">
              Failed to load dashboard statistics
            </p>
            <p className="mt-1 text-sm text-text-hint">
              Check your connection and try again.
            </p>
            <Button className="mt-4" onClick={refetch}>
              Retry
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <section
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Platform statistics"
          >
            {loading
              ? Array.from({ length: 8 }, (_, index) => (
                  <Card key={index} aria-hidden="true">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-4 h-8 w-20" />
                  </Card>
                ))
              : statCards.map((stat) => (
                  <Link
                    key={stat.label}
                    href={stat.href}
                    className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <Card className="h-full transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                          {stat.label}
                        </p>
                        <span
                          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${stat.accent} text-white`}
                        >
                          <stat.icon className="size-[18px]" aria-hidden="true" />
                        </span>
                      </div>
                      <p className="mt-3 text-3xl font-bold text-text-primary">
                        {stat.value.toLocaleString()}
                      </p>
                    </Card>
                  </Link>
                ))}
          </section>

          <Card
            title="Recent activity"
            subtitle="The latest admin actions and verification reviews"
            action={
              <Badge variant="neutral">
                {data?.recentActivity.length ?? 0} events
              </Badge>
            }
          >
            {loading ? (
              <ul className="divide-y divide-border" aria-label="Loading activity">
                {Array.from({ length: 5 }, (_, index) => (
                  <li key={index} className="flex gap-3 py-4">
                    <Skeleton className="size-9 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : data?.recentActivity.length ? (
              <ul className="divide-y divide-border">
                {data.recentActivity.map((activity, index) => (
                  <ActivityItem
                    key={`${activity.created_at}-${activity.admin.id}-${activity.action}-${index}`}
                    activity={activity}
                  />
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center py-10 text-center">
                <Activity
                  className="size-8 text-text-hint"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-medium text-text-primary">
                  No recent activity
                </p>
                <p className="mt-1 text-sm text-text-hint">
                  Admin actions will appear here.
                </p>
              </div>
            )}
            {!loading && data?.recentActivity.some((item) => item.target?.id) && (
              <div className="mt-4 flex justify-end border-t border-border pt-3">
                <Link
                  href="/admin/users"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark"
                >
                  Browse users
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
