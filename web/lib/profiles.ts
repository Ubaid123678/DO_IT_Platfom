import { mockUsers } from "./users";

export type Track = "physical" | "digital" | "errand";

export interface ProviderProfileResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    countryCode: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    overall_status: string;
    createdAt: string;
  };
  categories: { id: string; name: string; job_type: string }[];
  provider_profile: {
    avatar_url?: string | null;
    headline?: string | null;
    bio?: string | null;
    languages?: { code: string; level: string }[];
    city?: string | null;
    availability?: { days: string[]; shifts: string[]; hours_per_week: number } | null;
    public_profile?: boolean;
  };
  track: Track;
  track_data: { physical?: Record<string, unknown>; digital?: Record<string, unknown>; errand?: Record<string, unknown> };
  completeness: number;
  missing_fields: string[];
}

// Backend route GET /providers/admin/profiles/:providerId is not built yet.
// Flip USE_MOCK_PROFILES to false once it ships (reuses serializeProviderProfile).
export const USE_MOCK_PROFILES = true;

const langNames: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  ar: "Arabic",
  ur: "Urdu",
  hi: "Hindi",
  bn: "Bengali",
  zh: "Chinese",
  pt: "Portuguese",
};

const availability = { days: ["Mon", "Tue", "Wed"], shifts: ["Morning", "Afternoon"], hours_per_week: 30 };

function buildTrackData(track: Track, providerIndex: number): Record<string, unknown> {
  if (track === "digital") {
    return {
      skills: ["React", "TypeScript", "Node.js"],
      tech_stack: ["Next.js", "PostgreSQL", "AWS"],
      hourly_rate: 45,
      project_rate: 2400,
      timezone: "America/New_York",
      english_proficiency: "fluent",
      work_history: [
        { role: "Full-stack Engineer", company: "Freelance", dates: "2021 — 2026" },
        { role: "Frontend Developer", company: "Startup X", dates: "2018 — 2021" },
      ],
      education: [{ degree: "B.Sc. Computer Science", institution: "State University", year: 2018 }],
      resume_file_url: "https://example.com/resume.pdf",
    };
  }
  if (track === "errand") {
    return {
      service_area: { city: "Chicago", radius_km: 15 },
      transport_mode: "bicycle",
      base_fee: 8,
      per_km_fee: 1.5,
      working_hours: "9:00 — 18:00",
      same_day_express: true,
      delivery_capabilities: ["Documents", "Groceries", "Small parcels"],
      max_payload_kg: 25,
      max_package_size: "60×40×40 cm",
      goods_insurance: false,
    };
  }
  return {
    years_experience: 6,
    service_radius_km: 25,
    tools_equipment: ["Multimeter", "Drill", "Level"],
    hourly_rate: 35,
    on_site_availability: availability,
    can_travel: true,
    team_size: "solo",
    insurance: { covered: true, doc_uri: `https://example.com/insurance_${providerIndex}.jpg` },
    has_transport: { yes: true, mode: "van" },
  };
}

function missingFieldsFor(completeness: number): string[] {
  if (completeness <= 0) return [];
  if (completeness < 40) return ["Profile photo", "Availability", "Languages"];
  if (completeness < 80) return ["Profile photo"];
  return [];
}

export function mockFetchProviderProfile(providerId: string): Promise<ProviderProfileResponse> {
  const base = mockUsers.find((user) => user.id === providerId);
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (!base || base.role !== "provider") {
        reject(new Error("Provider profile not found"));
        return;
      }
      const providerIndex = Number(providerId.slice(2));
      const track: Track = (["physical", "digital", "errand"] as Track[])[providerIndex % 3];
      const completeness = providerIndex % 4 === 0 ? 0 : [30, 70, 95, 100][providerIndex % 4];
      const hasProfile = completeness > 0;

      resolve({
        user: {
          id: base.id,
          fullName: base.fullName,
          email: base.email,
          phone: base.phone,
          role: base.role,
          countryCode: base.countryCode,
          emailVerified: base.emailVerified,
          phoneVerified: base.phoneVerified,
          overall_status: base.overall_status ?? "incomplete",
          createdAt: base.createdAt,
        },
        categories: [
          { id: "c_home", name: "Home Services", job_type: track === "digital" ? "digital" : "physical" },
          { id: "c_repairs", name: "Repairs", job_type: "physical" },
          { id: "c_delivery", name: "Delivery", job_type: "errand" },
        ],
        provider_profile: hasProfile
          ? {
              avatar_url: providerIndex % 2 === 0 ? null : "https://example.com/avatar.jpg",
              headline: base.headline ?? null,
              bio: "Reliable professional with 5+ years of experience. Focused on quality work and clear communication.",
              languages: [
                { code: "en", level: "fluent" },
                { code: "es", level: "basic" },
              ].map((lang) => ({
                code: lang.code,
                level: lang.level,
              })),
              city: ["Austin", "Chicago", "Toronto"][providerIndex % 3],
              availability,
              public_profile: providerIndex % 3 !== 0,
            }
          : {},
        track,
        track_data: hasProfile ? { [track]: buildTrackData(track, providerIndex) } : {},
        completeness,
        missing_fields: missingFieldsFor(completeness),
      });
    }, 300),
  );
}

export const languageLabel = (code: string) => langNames[code] ?? code.toUpperCase();
