"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield } from "lucide-react";
import { apiRequest, ApiRequestError } from "@/lib/api";
import { useAdminAuth, type AdminUser } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface LoginResponse {
  user: AdminUser;
  accessToken: string;
  refreshToken: string;
}

type ErrorKind = "invalid" | "non-admin" | "network" | null;

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, token, hydrated } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ErrorKind>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  useEffect(() => {
    if (hydrated && token) {
      router.replace("/admin");
    }
  }, [hydrated, token, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const data = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: { email: email.trim(), password },
      });

      if (data.user.role !== "admin") {
        setError("non-admin");
        return;
      }

      login(data.user, data.accessToken, data.refreshToken);
      router.push("/admin");
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        setError("invalid");
      } else {
        setError("network");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hasError = error === "invalid" || error === "non-admin" || error === "network";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F7F7] px-6 py-12">
      <div className="w-full max-w-[400px]">
        {/* Header: Shield accent + Wordmark + Admin label */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <Shield className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="text-center">
            <h1 className="text-[24px] font-bold text-[#0D1F1E]">Do It</h1>
            <p className="mt-0.5 text-[13px] font-medium uppercase tracking-[0.18em] text-[#5B6664]">
              Admin
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
          {/* Error Banner */}
          {hasError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-error-light bg-error-light px-4 py-3 text-[13px] text-error">
              <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span className="flex-1">
                {error === "invalid" && "Invalid email or password"}
                {error === "non-admin" && "This account does not have admin access"}
                {error === "network" && "Something went wrong, please try again"}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@do-it.app"
              autoComplete="email"
              required
              disabled={submitting}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={submitting}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                className="absolute right-3 top-[34px] rounded p-0.5 text-text-hint transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button type="submit" className="w-full" loading={submitting} disabled={!canSubmit}>
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-[12px] text-[#9AA6A4]">
          Admin accounts are provisioned by your team.
        </p>
      </div>
    </main>
  );
}