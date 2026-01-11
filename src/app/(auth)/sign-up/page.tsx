"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiPost } from "@/lib/api";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        router.replace("/dashboard");
      }
    } catch {
      // Ignore storage errors.
    }
  }, [router]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Create account</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
          Start a calm routine.
        </h2>
      </div>

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
          const name = String(formData.get("name") || "").trim();
          const email = String(formData.get("email") || "").trim();
          const password = String(formData.get("password") || "");

          try {
            await apiPost("/auth/register", {
              name,
              email,
              password,
            });
            const nextUrl = `/sign-in?registered=1&email=${encodeURIComponent(
              email,
            )}`;
            router.push(nextUrl);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Sign up failed.");
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Full name
          </label>
          <input
            type="text"
            name="name"
            placeholder="Jordan Rivera"
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Email
          </label>
          <input
            type="email"
            name="email"
            placeholder="you@controlbits.app"
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
            placeholder="Create a password"
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-emerald-400 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span>Already have an account?</span>
        <Link className="font-semibold text-white hover:text-slate-200" href="/sign-in">
          Sign in
        </Link>
      </div>
    </div>
  );
}
