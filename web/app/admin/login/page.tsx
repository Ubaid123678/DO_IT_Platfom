"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield } from "lucide-react";
import { API_ORIGIN, apiRequest, ApiRequestError } from "@/lib/api";
import {
  isAdminTokenExpired,
  useAdminAuth,
  type AdminUser,
} from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface LoginResponse {
  user: AdminUser;
  accessToken: string;
  refreshToken: string;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, logout, token, user, hydrated } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  useEffect(() => {
    if (hydrated && token) {
      if (user?.role === "admin" && !isAdminTokenExpired(token)) {
        router.replace("/admin");
      } else {
        logout();
      }
    }
  }, [hydrated, token, user, logout, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const data = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: { email: email.trim(), password },
        skipAuth: true,
      });

      if (data.user.role !== "admin") {
        logout();
        setError("Admin access only");
        return;
      }

      login(data.user, data.accessToken, data.refreshToken);
      router.push("/admin");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 401 || err.code === "INVALID_CREDENTIALS") {
          setError("Invalid email or password");
        } else if (err.status === 429 || err.code === "LOGIN_RATE_LIMITED") {
          setError(err.message);
        } else if (err.status === 403 || err.status >= 500) {
          setError(err.message || "Sign-in is temporarily unavailable. Please try again.");
        } else {
          setError(err.message);
        }
      } else if (err instanceof TypeError) {
        setError(
          `Cannot connect to the backend at ${API_ORIGIN}. Start the backend server and try again.`,
        );
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="admin-theme flex min-h-screen items-center justify-center bg-bg px-6 py-12 text-text-primary">
      <div className="w-full max-w-[400px]">
        {/* Header: Shield accent + Wordmark + Admin label */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <Shield className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="text-center">
            <h1 className="text-[24px] font-bold text-text-primary">Do It</h1>
            <p className="mt-0.5 text-[13px] font-medium uppercase tracking-[0.18em] text-text-secondary">
              Admin
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {/* Error Banner */}
          {error && (
            <div role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-error-light bg-error-light px-4 py-3 text-[13px] text-error">
              <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span className="flex-1">{error}</span>
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

            <Button
              type="submit"
              className="w-full disabled:bg-primary-light disabled:text-text-primary disabled:opacity-100"
              loading={submitting}
              disabled={!canSubmit}
            >
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-[12px] text-text-hint">
          Admin accounts are provisioned by your team.
        </p>
      </div>
    </main>
  );
}