"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileImage, MapPin } from "lucide-react";
import { ApiRequestError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { CompletenessRing } from "@/components/admin/CompletenessRing";
import { ImageLightbox } from "@/components/admin/ImageLightbox";
import { useAdminProviderProfiles } from "@/hooks/useAdminProviderProfiles";
import { languageLabel, type ProviderProfileResponse, type Track } from "@/lib/profiles";

interface PhysicalTrackData {
  years_experience?: number;
  service_radius_km?: number;
  tools_equipment?: string[];
  hourly_rate?: number;
  on_site_availability?: { days: string[]; shifts: string[]; hours_per_week: number } | null;
  can_travel?: boolean;
  team_size?: string;
  insurance?: { covered?: boolean; doc_uri?: string | null };
  has_transport?: { yes?: boolean; mode?: string };
}

interface DigitalTrackData {
  skills?: string[];
  tech_stack?: string[];
  hourly_rate?: number;
  project_rate?: number;
  timezone?: string;
  english_proficiency?: string;
  work_history?: { role: string; company: string; dates: string }[];
  education?: { degree: string; institution: string; year?: number }[];
  resume_file_url?: string;
}

interface ErrandTrackData {
  service_area?: { city: string; radius_km?: number } | null;
  transport_mode?: string;
  base_fee?: number;
  per_km_fee?: number;
  working_hours?: string;
  same_day_express?: boolean;
  delivery_capabilities?: string[];
  max_payload_kg?: number;
  max_package_size?: string;
  goods_insurance?: boolean;
}

const trackTitle: Record<Track, string> = {
  physical: "Physical Track Details",
  digital: "Digital Track Details",
  errand: "Errand Track Details",
};

const trackLabel: Record<Track, string> = {
  physical: "Physical",
  digital: "Digital",
  errand: "Errand",
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-[13px] text-text-secondary">{label}</span>
      <span className="text-right text-[13px] font-medium text-text-primary">{children}</span>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-[12px] font-medium text-primary-dark">
      {children}
    </span>
  );
}

function PillGroup({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return <span className="text-text-hint">—</span>;
  return (
    <span className="flex flex-wrap justify-end gap-1.5">
      {items.map((item) => (
        <Pill key={item}>{item}</Pill>
      ))}
    </span>
  );
}

function YesNo({ value }: { value?: boolean }) {
  return value ? (
    <span className="inline-flex rounded-full bg-success-light px-2.5 py-0.5 text-[12px] font-semibold text-success">
      Yes
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-border/50 px-2.5 py-0.5 text-[12px] font-semibold text-text-hint">
      No
    </span>
  );
}

export default function ProviderProfileReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { fetchProviderProfile } = useAdminProviderProfiles();

  const [profile, setProfile] = useState<ProviderProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const data = await fetchProviderProfile(id);
        if (cancelled) return;
        setProfile(data);
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
  }, [id, fetchProviderProfile]);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center">
        <p className="text-[15px] font-semibold text-text-primary">Provider profile not found</p>
        <p className="mt-1 text-[13px] text-text-hint">This provider may have been removed.</p>
        <Link
          href="/admin/users"
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Back to users
        </Link>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center">
        <p className="text-[14px] text-text-secondary">Failed to load provider profile</p>
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

  const { user, provider_profile: providerProfile, categories, track, track_data, completeness, missing_fields } = profile;
  const hasProfile = completeness > 0;
  const trackData = (track_data[track] ?? {}) as PhysicalTrackData & DigitalTrackData & ErrandTrackData;

  const renderPhysical = () => (
    <>
      <Row label="Years Experience">{trackData.years_experience ? `${trackData.years_experience} years` : "—"}</Row>
      <Row label="Service Radius">{trackData.service_radius_km ? `${trackData.service_radius_km} km` : "—"}</Row>
      <Row label="Tools & Equipment">
        <PillGroup items={trackData.tools_equipment} />
      </Row>
      <Row label="Hourly Rate">{trackData.hourly_rate ? `$${trackData.hourly_rate}/hr` : "—"}</Row>
      <Row label="On-site Availability">
        {trackData.on_site_availability ? (
          <span className="flex flex-col items-end gap-1">
            <span className="flex flex-wrap justify-end gap-1.5">
              {trackData.on_site_availability.days.map((day) => (
                <Pill key={day}>{day}</Pill>
              ))}
            </span>
            <span className="text-[12px] text-text-hint">
              {trackData.on_site_availability.shifts.join(", ")} · {trackData.on_site_availability.hours_per_week}h/wk
            </span>
          </span>
        ) : (
          "—"
        )}
      </Row>
      <Row label="Can Travel">
        <YesNo value={trackData.can_travel} />
      </Row>
      <Row label="Team Size">{trackData.team_size ? trackData.team_size.replace(/_/g, " ") : "—"}</Row>
      <Row label="Insurance">
        {trackData.insurance ? (
          <span className="flex items-center justify-end gap-2">
            <YesNo value={trackData.insurance.covered} />
            {trackData.insurance.doc_uri && (
              <button
                type="button"
                onClick={() => setLightboxSrc(trackData.insurance?.doc_uri ?? null)}
                className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary-light px-2.5 py-0.5 text-[12px] font-medium text-primary-dark transition-colors hover:bg-primary-light/70"
              >
                <FileImage className="h-3.5 w-3.5" /> View doc
              </button>
            )}
          </span>
        ) : (
          "—"
        )}
      </Row>
      <Row label="Has Transport">
        {trackData.has_transport ? (
          <span className="flex items-center justify-end gap-2">
            <YesNo value={trackData.has_transport.yes} />
            {trackData.has_transport.mode && (
              <span className="text-[12px] text-text-hint">{trackData.has_transport.mode}</span>
            )}
          </span>
        ) : (
          "—"
        )}
      </Row>
    </>
  );

  const renderDigital = () => (
    <>
      <Row label="Skills">
        <PillGroup items={trackData.skills} />
      </Row>
      <Row label="Tech Stack">
        <PillGroup items={trackData.tech_stack} />
      </Row>
      <Row label="Hourly Rate">{trackData.hourly_rate ? `$${trackData.hourly_rate}/hr` : "—"}</Row>
      <Row label="Project Rate">{trackData.project_rate ? `$${trackData.project_rate}` : "—"}</Row>
      <Row label="Timezone">{trackData.timezone ?? "—"}</Row>
      <Row label="English Proficiency">{trackData.english_proficiency ? trackData.english_proficiency.replace(/_/g, " ") : "—"}</Row>
      <Row label="Work History">
        {trackData.work_history && trackData.work_history.length > 0 ? (
          <span className="flex flex-col items-end gap-2">
            {trackData.work_history.map((job) => (
              <span key={`${job.role}-${job.company}`} className="text-right">
                <span className="block font-medium text-text-primary">{job.role}</span>
                <span className="block text-[12px] text-text-hint">
                  {job.company} · {job.dates}
                </span>
              </span>
            ))}
          </span>
        ) : (
          "—"
        )}
      </Row>
      <Row label="Education">
        {trackData.education && trackData.education.length > 0 ? (
          <span className="flex flex-col items-end gap-2">
            {trackData.education.map((item) => (
              <span key={`${item.degree}-${item.institution}`} className="text-right">
                <span className="block font-medium text-text-primary">{item.degree}</span>
                <span className="block text-[12px] text-text-hint">
                  {item.institution}
                  {item.year ? ` · ${item.year}` : ""}
                </span>
              </span>
            ))}
          </span>
        ) : (
          "—"
        )}
      </Row>
      <Row label="Resume">
        {trackData.resume_file_url ? (
          <a
            href={trackData.resume_file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary-dark"
          >
            View Resume ↗
          </a>
        ) : (
          "—"
        )}
      </Row>
    </>
  );

  const renderErrand = () => (
    <>
      <Row label="Service Area">
        {trackData.service_area ? (
          <span className="inline-flex items-center gap-1">
            {trackData.service_area.city}
            {trackData.service_area.radius_km ? ` (${trackData.service_area.radius_km} km)` : ""}
          </span>
        ) : (
          "—"
        )}
      </Row>
      <Row label="Transport Mode">{trackData.transport_mode ? trackData.transport_mode.replace(/_/g, " ") : "—"}</Row>
      <Row label="Base Fee">{trackData.base_fee ? `$${trackData.base_fee}` : "—"}</Row>
      <Row label="Per KM Fee">{trackData.per_km_fee ? `$${trackData.per_km_fee}/km` : "—"}</Row>
      <Row label="Working Hours">{trackData.working_hours ?? "—"}</Row>
      <Row label="Same-Day Express">
        <YesNo value={trackData.same_day_express} />
      </Row>
      <Row label="Delivery Capabilities">
        <PillGroup items={trackData.delivery_capabilities} />
      </Row>
      <Row label="Max Payload">{trackData.max_payload_kg ? `${trackData.max_payload_kg} kg` : "—"}</Row>
      <Row label="Max Package Size">{trackData.max_package_size ?? "—"}</Row>
      <Row label="Goods Insurance">
        <YesNo value={trackData.goods_insurance} />
      </Row>
    </>
  );

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-[13px] text-text-hint">
        <Link href="/admin/users" className="transition-colors hover:text-primary">
          Users
        </Link>
        <span>/</span>
        <Link href={`/admin/users/${user.id}`} className="transition-colors hover:text-primary">
          {user.fullName}
        </Link>
        <span>/</span>
        <span className="text-text-secondary">Profile</span>
      </nav>

      <Card>
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {providerProfile.avatar_url ? (
              <img
                src={providerProfile.avatar_url}
                alt={user.fullName}
                className="h-16 w-16 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-light text-[20px] font-bold text-primary-dark">
                {initials(user.fullName)}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-[24px] font-bold text-text-primary">{user.fullName}</h1>
              <p className="mt-0.5 text-[13px] text-text-hint">
                {providerProfile.headline || "No headline"}
                {providerProfile.city ? ` · ${providerProfile.city}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="primary">{trackLabel[track]}</Badge>
                {providerProfile.public_profile ? (
                  <Badge variant="success">Public</Badge>
                ) : (
                  <Badge variant="neutral">Private</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <CompletenessRing value={completeness} size={104} />
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-text-secondary">Missing fields</p>
          {missing_fields.length === 0 ? (
            <p className="text-[13px] font-medium text-success">All fields complete ✓</p>
          ) : (
            <ul className="list-inside list-disc space-y-0.5 text-[13px] text-text-hint">
              {missing_fields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {!hasProfile ? (
        <Card>
          <p className="py-10 text-center text-[14px] text-text-hint">
            Provider has not completed their profile yet
          </p>
        </Card>
      ) : (
        <>
          <Card title="Profile">
            <div className="grid gap-x-10 gap-y-1 lg:grid-cols-2">
              <Row label="Bio">{providerProfile.bio || "—"}</Row>
              <Row label="Languages">
                <PillGroup items={(providerProfile.languages ?? []).map((lang) => `${languageLabel(lang.code)} — ${lang.level}`)} />
              </Row>
              <Row label="Availability">
                {providerProfile.availability ? (
                  <span className="flex flex-col items-end gap-1">
                    <span className="flex flex-wrap justify-end gap-1.5">
                      {providerProfile.availability.days.map((day) => (
                        <Pill key={day}>{day}</Pill>
                      ))}
                    </span>
                    <span className="text-[12px] text-text-hint">
                      {providerProfile.availability.shifts.join(", ")} · {providerProfile.availability.hours_per_week}h/wk
                    </span>
                  </span>
                ) : (
                  "—"
                )}
              </Row>
              <Row label="City">
                {providerProfile.city ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-text-hint" /> {providerProfile.city}
                  </span>
                ) : (
                  "—"
                )}
              </Row>
            </div>
          </Card>

          <Card title={trackTitle[track]}>{track === "physical" ? renderPhysical() : track === "digital" ? renderDigital() : renderErrand()}</Card>

          <Card title="Categories">
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 ? (
                <p className="text-[13px] text-text-hint">No categories selected</p>
              ) : (
                categories.map((category) => (
                  <span key={category.id} className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-1 text-[12px] text-text-secondary">
                    {category.name}
                    <span className="text-text-hint">({category.job_type})</span>
                  </span>
                ))
              )}
            </div>
          </Card>
        </>
      )}

      <ImageLightbox src={lightboxSrc ?? ""} open={lightboxSrc !== null} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
