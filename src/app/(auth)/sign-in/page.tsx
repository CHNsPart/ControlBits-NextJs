"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { apiPost } from "@/lib/api";

type LoginResponse = {
  access_token: string;
  message?: string;
};

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const emailPrefill = searchParams.get("email") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Sign in</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            Welcome back.
          </h2>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
          Secure
        </span>
      </div>

      {registered && (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Account created. Sign in to continue.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError(null);
          const formData = new FormData(event.currentTarget);
          const email = String(formData.get("email") || "").trim();
          const password = String(formData.get("password") || "");

          try {
            const data = await apiPost<LoginResponse>("/auth/login", {
              email,
              password,
            });
            if (data.access_token) {
              try {
                localStorage.setItem("access_token", data.access_token);
              } catch {
                // Ignore storage errors (private mode, disabled storage).
              }
            }
            router.push("/dashboard");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed.");
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Email
          </label>
          <input
            type="email"
            name="email"
            placeholder="you@controlbits.app"
            defaultValue={emailPrefill}
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Password
          </label>
          <input
            type="password"
            name="password"
            placeholder="Your password"
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 rounded border-white/20" />
            Keep me signed in
          </label>
          <Link className="text-slate-200 hover:text-white" href="/forgot-password">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-emerald-400 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>

      </form>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span>New to ControlBits?</span>
        <Link className="font-semibold text-white hover:text-slate-200" href="/sign-up">
          Create account
        </Link>
      </div>
    </div>
  );
}
