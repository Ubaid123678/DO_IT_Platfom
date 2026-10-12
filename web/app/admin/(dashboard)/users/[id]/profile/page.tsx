"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MapPin, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { CompletenessRing } from "@/app/components/admin/CompletenessRing";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminQuery } from "@/hooks/useAdminQuery";
import { ApiRequestError, API_ORIGIN } from "@/lib/api";
import type { ProviderProfileResponse, Track } from "@/lib/profiles";

const TRACK_TITLES: Record<Track, string> = {
  physical: "Physical services",
  digital: "Digital services",
  errand: "Errand services",
};

const TRACK_FIELDS: Record<Track, readonly [string, string][]> = {
  physical: [
    ["years_experience", "Years of experience"],
    ["service_radius_km", "Service radius"],
    ["tools_equipment", "Tools and equipment"],
    ["hourly_rate", "Hourly rate"],
    ["on_site_availability", "On-site availability"],
    ["can_travel", "Can travel"],
    ["team_size", "Team size"],
    ["insurance", "Insurance"],
    ["has_transport", "Has transport"],
  ],
  digital: [
    ["skills", "Skills"],
    ["tech_stack", "Technology stack"],
    ["hourly_rate", "Hourly rate"],
    ["project_rate", "Project rate"],
    ["timezone", "Timezone"],
    ["english_proficiency", "English proficiency"],
    ["work_history", "Work history"],
    ["education", "Education"],
    ["resume_file_url", "Resume"],
  ],
  errand: [
    ["service_area", "Service area"],
    ["transport_mode", "Transport mode"],
    ["base_fee", "Base fee"],
    ["per_km_fee", "Per-kilometer fee"],
    ["working_hours", "Working hours"],
    ["same_day_express", "Same-day express"],
    ["delivery_capabilities", "Delivery capabilities"],
    ["max_payload_kg", "Maximum payload"],
    ["max_package_size", "Maximum package size"],
    ["goods_insurance", "Goods insurance"],
  ],
};

function labelFor(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveAssetUrl(value: string): string {
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return value.startsWith("/") ? `${API_ORIGIN}${value}` : value;
}

function LoadingState() {
  return (
    <div className="space-y-5" aria-label="Loading provider profile">
      <Skeleton className="h-36 w-full rounded-2xl" />
      <Skeleton className="h-56 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-6 border-b border-border py-3 last:border-b-0">
      <dt className="shrink-0 text-sm text-text-hint">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium text-text-primary">
        {children}
      </dd>
    </div>
  );
}

function ValueView({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-text-hint">—</span>;
  }

  if (typeof value === "boolean") {
    return <Badge variant={value ? "approved" : "neutral"}>{value ? "Yes" : "No"}</Badge>;
  }

  if (typeof value === "string" || typeof value === "number") {
    return <span className="break-words">{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-text-hint">—</span>;
    return (
      <ul className="space-y-2">
        {value.map((item, index) => (
          <li key={`${index}-${typeof item === "object" ? "object" : String(item)}`}>
            {isRecord(item) ? (
              <ObjectValues value={item} />
            ) : (
              <span>{String(item)}</span>
            )}
          </li>
        ))}
      </ul>
    );
  }

  if (isRecord(value)) {
    return <ObjectValues value={value} />;
  }

  return <span className="text-text-hint">—</span>;
}

function ObjectValues({ value }: { value: Record<string, unknown> }) {
  const entries = Object.entries(value);
  if (entries.length === 0) return <span className="text-text-hint">—</span>;

  return (
    <dl className="space-y-1 rounded-lg bg-bg px-3 py-2 text-left">
      {entries.map(([key, item]) => (
        <div key={key} className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-3">
          <dt className="text-text-hint">{labelFor(key)}</dt>
          <dd className="break-words text-text-primary">
            {typeof item === "object" && item !== null
              ? JSON.stringify(item)
              : item === null || item === undefined
                ? "—"
                : String(item)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Avatar({ src, name }: { src?: string | null; name: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSrc = src ? resolveAssetUrl(src) : null;

  if (!imageSrc || failedSrc === imageSrc) {
    return (
      <div
        className="flex size-20 shrink-0 items-center justify-center rounded-full bg-bg text-text-hint"
        role="img"
        aria-label={`${name} avatar unavailable`}
      >
        <UserRound className="size-8" aria-hidden="true" />
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={imageSrc}
      alt={`${name} avatar`}
      className="size-20 shrink-0 rounded-full border border-border bg-bg object-cover"
      onError={() => setFailedSrc(imageSrc)}
    />
  );
}

export default function AdminProviderProfilePage() {
  const params = useParams<{ id: string }>();
  const providerId = params.id;
  const path = useMemo(
    () => `/providers/admin/profiles/${encodeURIComponent(providerId)}`,
    [providerId],
  );
  const { data, loading, error, refetch } =
    useAdminQuery<ProviderProfileResponse>(path);

  if (loading) return <LoadingState />;

  const notFound = error instanceof ApiRequestError && error.status === 404;
  if (error || !data) {
    return (
      <Card>
        <div className="py-10 text-center">
          <p className="text-sm font-medium text-text-primary">
            {notFound ? "Provider not found" : "Failed to load provider profile"}
          </p>
          {!notFound && (
            <Button className="mt-4" onClick={refetch}>
              Retry
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const { user, provider_profile: profile, categories } = data;
  const track = data.track;
  const trackData = data.track_data[track] ?? {};
  const completeness = Number.isFinite(data.completeness)
    ? Math.max(0, Math.min(100, data.completeness))
    : 0;
  const missingFields = data.missing_fields ?? [];
  const hasProfile = completeness > 0;

  return (
    <div className="space-y-5">
      <Link
        href={`/admin/users/${encodeURIComponent(providerId)}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to user
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar src={profile.avatar_url} name={user.fullName} />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-text-primary">
                {user.fullName}
              </h1>
              <p className="mt-1 break-all text-sm text-text-secondary">{user.email}</p>
              <p className="mt-1 text-sm text-text-hint">
                {profile.headline || "No headline"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="neutral">{TRACK_TITLES[track]}</Badge>
                <Badge variant={profile.public_profile ? "approved" : "neutral"}>
                  {profile.public_profile ? "Public profile" : "Private profile"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-3 border-t border-border pt-4 sm:w-auto sm:border-0 sm:pt-0">
            <CompletenessRing value={completeness} size={104} />
            <div className="w-full min-w-52 sm:w-auto">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Missing fields
              </p>
              {missingFields.length === 0 && completeness > 0 ? (
                <p className="text-sm font-medium text-success">All fields complete</p>
              ) : missingFields.length === 0 ? (
                <p className="text-sm text-text-hint">No missing-field details available</p>
              ) : (
                <ul className="list-inside list-disc space-y-1 text-sm text-text-hint">
                  {missingFields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </Card>

      {completeness === 0 && (
        <Card>
          <p className="py-4 text-center text-sm text-text-hint">
            Provider has not completed their profile
          </p>
        </Card>
      )}

      <Card title="Universal profile">
        <dl className="grid gap-x-10 lg:grid-cols-2">
          <InfoRow label="Headline">{profile.headline || "—"}</InfoRow>
          <InfoRow label="Bio">{profile.bio || "—"}</InfoRow>
          <InfoRow label="Languages">
            {profile.languages?.length ? (
              <span className="flex flex-wrap justify-end gap-2">
                {profile.languages.map((language) => (
                  <Badge key={`${language.code}-${language.level}`} variant="neutral">
                    {language.code} · {language.level}
                  </Badge>
                ))}
              </span>
            ) : (
              "—"
            )}
          </InfoRow>
          <InfoRow label="City">
            {profile.city ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4 text-text-hint" aria-hidden="true" />
                {profile.city}
              </span>
            ) : (
              "—"
            )}
          </InfoRow>
          <InfoRow label="Availability">
            {profile.availability ? (
              <span>
                {profile.availability.days.join(", ")}
                <br />
                {profile.availability.shifts.join(", ")} ·{" "}
                {profile.availability.hours_per_week} hours/week
              </span>
            ) : (
              "—"
            )}
          </InfoRow>
          <InfoRow label="Public profile">
            <Badge variant={profile.public_profile ? "approved" : "neutral"}>
              {profile.public_profile ? "Public" : "Private"}
            </Badge>
          </InfoRow>
        </dl>
      </Card>

      {hasProfile && (
        <>
          <Card title={TRACK_TITLES[track]}>
            <dl className="grid gap-x-10 lg:grid-cols-2">
              {TRACK_FIELDS[track].map(([key, label]) => {
                const value = trackData[key];
                if (value === undefined) return null;
                if (
                  key === "resume_file_url" &&
                  typeof value === "string" &&
                  value.length > 0
                ) {
                  return (
                    <InfoRow key={key} label={label}>
                      <a
                        href={resolveAssetUrl(value)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        Open resume
                      </a>
                    </InfoRow>
                  );
                }
                if (key === "insurance" && isRecord(value)) {
                  const insurance = value;
                  return (
                    <InfoRow key={key} label={label}>
                      <div className="space-y-2">
                        <ValueView value={insurance.covered ?? insurance} />
                        {typeof insurance.doc_uri === "string" && (
                          <a
                            href={resolveAssetUrl(insurance.doc_uri)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-primary underline"
                          >
                            View insurance document
                          </a>
                        )}
                      </div>
                    </InfoRow>
                  );
                }
                return (
                  <InfoRow key={key} label={label}>
                    <ValueView value={value} />
                  </InfoRow>
                );
              })}
            </dl>
          </Card>

          <Card title="Categories">
            {categories.length === 0 ? (
              <p className="text-sm text-text-hint">No categories selected</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Badge variant="neutral">
                      {category.name} · {category.job_type}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

    </div>
  );
}
