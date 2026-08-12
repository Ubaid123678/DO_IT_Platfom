"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, ExternalLink, ShieldAlert } from "lucide-react";
import { ApiRequestError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/admin/StatusPill";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { formatDate, timeAgo, type AdminUserDetail, type UserRole } from "@/lib/users";

const roleVariant: Record<string, BadgeVariant> = {
  provider: "primary",
  client: "neutral",
  admin: "amber",
  pending: "warning",
};

const roleOptions = [
  { value: "client", label: "Client" },
  { value: "provider", label: "Provider" },
  { value: "admin", label: "Admin" },
  { value: "pending", label: "Pending" },
];

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-[13px] text-text-secondary">{label}</span>
      <span className="text-right text-[13px] font-medium text-text-primary">{children}</span>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { fetchUserDetail, updateUser } = useAdminUsers();

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [roleDraft, setRoleDraft] = useState<UserRole>("client");
  const [savingRole, setSavingRole] = useState(false);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const data = await fetchUserDetail(id);
        if (cancelled) return;
        setUser(data);
        setRoleDraft(data.role);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiRequestError && err.status === 404) setNotFound(true);
        else setError(true);
        setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [id, fetchUserDetail]);

  const handleSaveRole = async () => {
    if (!user || roleDraft === user.role) return;
    setSavingRole(true);
    try {
      const updated = await updateUser(user.id, { role: roleDraft });
      setUser(updated);
      setRoleDraft(updated.role);
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role — please try again");
    } finally {
      setSavingRole(false);
    }
  };

  const openDeactivateModal = () => {
    setBanReason("");
    setReasonError(null);
    setDeactivateOpen(true);
  };

  const closeDeactivateModal = () => {
    setDeactivateOpen(false);
    setReasonError(null);
  };

  const handleDeactivate = async () => {
    if (!user) return;
    const reason = banReason.trim();
    if (reason.length < 3) {
      setReasonError("Reason is required (min 3 characters)");
      return;
    }
    setDeactivating(true);
    try {
      const updated = await updateUser(user.id, { isBanned: true, banReason: reason });
      setUser(updated);
      setDeactivateOpen(false);
      setBanReason("");
      toast.success("Account deactivated");
    } catch {
      toast.error("Failed to deactivate account — please try again");
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivate = async () => {
    if (!user) return;
    setReactivating(true);
    try {
      const updated = await updateUser(user.id, { isBanned: false, banReason: null });
      setUser(updated);
      toast.success("Account reactivated");
    } catch {
      toast.error("Failed to reactivate account — please try again");
    } finally {
      setReactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center">
        <p className="text-[15px] font-semibold text-text-primary">User not found</p>
        <p className="mt-1 text-[13px] text-text-hint">This user may have been removed.</p>
        <Link
          href="/admin/users"
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Back to users
        </Link>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center">
        <p className="text-[14px] text-text-secondary">Failed to load user</p>
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
    );
  }

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-[13px] text-text-hint">
        <Link href="/admin/users" className="transition-colors hover:text-primary">
          Users
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{user.fullName}</span>
      </nav>

      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-light text-[18px] font-bold text-primary-dark">
            {initials(user.fullName)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[24px] font-bold text-text-primary">{user.fullName}</h1>
            <p className="mt-0.5 text-[13px] text-text-hint">
              {user.email} · {user.phone}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={roleVariant[user.role] ?? "neutral"}>{user.role}</Badge>
              {user.role === "provider" && (
                <>
                  <StatusPill status={user.kyc_status ?? "missing"} variant="kyc" />
                  <StatusPill status={user.overall_status ?? "incomplete"} variant="overall" />
                </>
              )}
              <StatusPill status={user.isBanned ? "banned" : "active"} variant="ban" />
            </div>
          </div>
          {user.role === "provider" && (
            <Link
              href={`/admin/users/${user.id}/profile`}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-primary bg-transparent px-3 py-2 text-[13px] font-medium text-primary transition-colors hover:bg-primary-light"
            >
              View Provider Profile <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Account Info">
          <div className="grid gap-x-8 sm:grid-cols-2">
            <InfoRow label="Country">{user.countryCode}</InfoRow>
            <InfoRow label="Joined">{formatDate(user.createdAt)}</InfoRow>
            <InfoRow label="Last Seen">{timeAgo(user.lastSeen)}</InfoRow>
            <InfoRow label="Registration IP">{user.ipAtRegistration}</InfoRow>
            <InfoRow label="Email Verified">
              {user.emailVerified ? (
                <span className="flex items-center justify-end gap-1.5 text-success">
                  <CheckCircle2 className="h-4 w-4" /> Verified
                </span>
              ) : (
                <span className="flex items-center justify-end gap-1.5 text-text-hint">
                  <XCircle className="h-4 w-4" /> Not verified
                </span>
              )}
            </InfoRow>
            <InfoRow label="Phone Verified">
              {user.phoneVerified ? (
                <span className="flex items-center justify-end gap-1.5 text-success">
                  <CheckCircle2 className="h-4 w-4" /> Verified
                </span>
              ) : (
                <span className="flex items-center justify-end gap-1.5 text-text-hint">
                  <XCircle className="h-4 w-4" /> Not verified
                </span>
              )}
            </InfoRow>
          </div>
        </Card>

        <Card title="Actions">
          <div className="mb-5">
            <p className="mb-2 text-[13px] font-medium text-text-secondary">Change Role</p>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Select
                  value={roleDraft}
                  onChange={(event) => setRoleDraft(event.target.value as UserRole)}
                  options={roleOptions}
                  aria-label="Role"
                />
              </div>
              <Button
                loading={savingRole}
                disabled={roleDraft === user.role}
                onClick={handleSaveRole}
                className="shrink-0"
              >
                Save
              </Button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium text-text-secondary">Account Status</p>
            {user.isBanned ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 rounded-xl bg-error-light px-3 py-2.5 text-[13px] text-error">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <span className="font-semibold">Ban reason:</span> {user.banReason ?? "Not provided"}
                  </span>
                </div>
                <Button variant="secondary" loading={reactivating} onClick={handleReactivate}>
                  Reactivate Account
                </Button>
              </div>
            ) : (
              <Button variant="danger" onClick={openDeactivateModal}>
                Deactivate Account
              </Button>
            )}
          </div>
        </Card>
      </div>

      <Modal
        open={deactivateOpen}
        onClose={closeDeactivateModal}
        title={`Deactivate ${user.fullName}?`}
        footer={
          <>
            <Button variant="ghost" onClick={closeDeactivateModal}>
              Cancel
            </Button>
            <Button variant="danger" loading={deactivating} onClick={handleDeactivate}>
              Deactivate
            </Button>
          </>
        }
      >
        <p className="mb-3 text-[13px] text-text-secondary">
          This will ban the account immediately. Provide a reason for the record.
        </p>
        <textarea
          value={banReason}
          onChange={(event) => {
            setBanReason(event.target.value);
            if (reasonError) setReasonError(null);
          }}
          rows={3}
          placeholder="Reason for deactivation (required)…"
          className="w-full rounded-[10px] border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-primary/60"
        />
        {reasonError && <p className="mt-1 text-xs text-error">{reasonError}</p>}
      </Modal>
    </div>
  );
}
