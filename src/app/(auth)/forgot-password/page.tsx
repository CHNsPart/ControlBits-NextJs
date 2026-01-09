"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiPost } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Reset access</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
          Recover your account.
        </h2>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError(null);
          const formData = new FormData(event.currentTarget);
          const email = String(formData.get("email") || "").trim();

          try {
            await apiPost("/auth/forgot-password", { email });
            const nextUrl = email
              ? `/forgot-password/sent?email=${encodeURIComponent(email)}`
              : "/forgot-password/sent";
            router.push(nextUrl);
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Unable to send reset link.",
            );
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
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-white py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <div className="text-sm text-slate-400">
        Remembered your password?{" "}
        <Link className="font-semibold text-white hover:text-slate-200" href="/sign-in">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
