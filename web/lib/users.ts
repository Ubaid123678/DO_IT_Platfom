export type UserRole = "client" | "provider" | "admin" | "pending";

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  countryCode: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  headline?: string | null;
  overall_status?: string;
  track?: string | null;
  kyc_status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDetail extends AdminUser {
  isActive: boolean;
  isBanned: boolean;
  banReason: string | null;
  lastSeen: string;
  ipAtRegistration: string;
}

export interface UsersListParams {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  kyc_status?: string;
  overall_status?: string;
}

export interface UsersResponse {
  users: AdminUser[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// Backend route GET /admin/users is not built yet. Flip USE_MOCK_USERS to
// false once the backend ships the endpoints (contract is defined above).
export const USE_MOCK_USERS = true;

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const roles: UserRole[] = ["client", "provider", "admin", "pending"];
const countries = ["US", "GB", "PK", "AE", "IN", "DE", "FR", "NG", "CA", "AU"];
const kycStatuses = ["approved", "pending", "rejected", "missing"];
const overallStatuses = ["verified", "partially_verified", "pending", "incomplete", "rejected"];
const tracks = ["physical", "digital", "errand"];
const headlines = [
  "Certified Electrician",
  "Full-stack Developer",
  "Courier & Errand Runner",
  "Plumber",
  "UI/UX Designer",
  "Moving Help",
  "Mobile App Developer",
  "Handyman",
];

const fullNames = [
  "John Carter",
  "Aisha Khan",
  "Michael Bennett",
  "Fatima Noor",
  "Daniel Okafor",
  "Sara Ahmed",
  "James Wilson",
  "Meera Patel",
  "Robert Chen",
  "Zainab Malik",
  "David Brown",
  "Layla Hassan",
  "Chris Meyer",
  "Priya Sharma",
  "Omar Farooq",
  "Emily Davis",
  "Hassan Ali",
  "Grace Kim",
  "Tom Anderson",
  "Nadia Hussain",
  "Peter Smith",
  "Amara Diallo",
  "Felix Wagner",
  "Rania Yousef",
  "George Miller",
  "Iqra Sheikh",
  "Steven Lee",
  "Mina Park",
  "Adam Scott",
  "Hannah Cole",
  "Victor Osei",
  "Leila Aziz",
  "Ben Carter",
  "Sophia Rossi",
];

const daysAgo = (index: number) =>
  new Date(Date.now() - index * 3 * 86_400_000).toISOString();

export const mockUsers: AdminUser[] = fullNames.map((fullName, index) => {
  const role = roles[index % roles.length];
  const isProvider = role === "provider";
  const [first, last] = fullName.toLowerCase().split(" ");
  return {
    id: `u_${1000 + index}`,
    fullName,
    email: `${first}.${last}@example.com`,
    phone: `+1${555_000_0000 + index}`,
    role,
    countryCode: countries[index % countries.length],
    emailVerified: index % 5 !== 0,
    phoneVerified: index % 4 !== 0,
    headline: isProvider ? headlines[index % headlines.length] : null,
    overall_status: isProvider ? overallStatuses[index % overallStatuses.length] : undefined,
    track: isProvider ? tracks[index % tracks.length] : undefined,
    kyc_status: isProvider ? kycStatuses[index % kycStatuses.length] : "missing",
    createdAt: daysAgo(index),
    updatedAt: daysAgo(index),
  };
});

export function mockFetchUsers(params: UsersListParams): Promise<UsersResponse> {
  let filtered = [...mockUsers];

  if (params.search && params.search.trim().length >= 2) {
    const query = params.search.trim().toLowerCase();
    filtered = filtered.filter(
      (user) =>
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.includes(query),
    );
  }
  if (params.role && params.role !== "all") {
    filtered = filtered.filter((user) => user.role === params.role);
  }
  if (params.kyc_status && params.kyc_status !== "all") {
    filtered = filtered.filter((user) => user.kyc_status === params.kyc_status);
  }
  if (params.overall_status && params.overall_status !== "all") {
    filtered = filtered.filter((user) => user.overall_status === params.overall_status);
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / params.limit));
  const page = Math.min(Math.max(1, params.page), totalPages);
  const users = filtered.slice((page - 1) * params.limit, page * params.limit);

  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          users,
          pagination: { page, limit: params.limit, total, totalPages },
        }),
      350,
    ),
  );
}

// Mutable detail overrides so role changes / bans survive a refetch in demo mode.
const detailOverrides = new Map<string, Partial<AdminUserDetail>>();

export function mockFetchUserDetail(id: string): Promise<AdminUserDetail> {
  const base = mockUsers.find((user) => user.id === id);
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (!base) {
        reject(new Error("User not found"));
        return;
      }
      const overrides = detailOverrides.get(id) ?? {};
      resolve({
        ...base,
        ...overrides,
        isActive: overrides.isBanned ? false : true,
        isBanned: overrides.isBanned ?? false,
        banReason: overrides.banReason ?? null,
        lastSeen: daysAgo(base.phoneVerified ? 1 : 2),
        ipAtRegistration: `103.21.${50 + (Number(id.slice(2)) % 100)}.${10 + (Number(id.slice(2)) % 200)}`,
      });
    }, 300),
  );
}

export function mockUpdateUser(
  id: string,
  patch: { role?: UserRole; isBanned?: boolean; banReason?: string | null },
): Promise<AdminUserDetail> {
  return new Promise((resolve, reject) =>
    setTimeout(async () => {
      const base = mockUsers.find((user) => user.id === id);
      if (!base) {
        reject(new Error("User not found"));
        return;
      }
      const overrides = detailOverrides.get(id) ?? {};
      if (patch.role) base.role = patch.role;
      if (typeof patch.isBanned === "boolean") {
        overrides.isBanned = patch.isBanned;
        overrides.isActive = !patch.isBanned;
        overrides.banReason = patch.isBanned ? patch.banReason ?? null : null;
        detailOverrides.set(id, overrides);
      }
      resolve({
        ...base,
        ...overrides,
        isActive: !overrides.isBanned,
        isBanned: overrides.isBanned ?? false,
        banReason: overrides.banReason ?? null,
        lastSeen: daysAgo(base.phoneVerified ? 1 : 2),
        ipAtRegistration: `103.21.${50 + (Number(id.slice(2)) % 100)}.${10 + (Number(id.slice(2)) % 200)}`,
      });
    }, 300),
  );
}
