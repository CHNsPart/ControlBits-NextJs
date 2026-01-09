"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { apiPost } from "@/lib/api";

export default function ForgotPasswordSentPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Check your inbox</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
          Reset link sent.
        </h2>
      </div>

      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
        We sent a reset link{" "}
        {email ? (
          <span className="border-b border-emerald-300/60 text-emerald-100">
            {email}
          </span>
        ) : (
          "to your email"
        )}
        . If it doesn’t arrive, check spam or resend below.
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          type="button"
          disabled={!email || pending}
          onClick={async () => {
            if (!email) {
              return;
            }
            setPending(true);
            setError(null);
            try {
              await apiPost("/auth/forgot-password", { email });
              setResent(true);
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "Unable to resend the email.",
              );
            } finally {
              setPending(false);
            }
          }}
          className="w-full rounded-full bg-white py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Resending..." : "Resend email"}
        </button>
        {resent && (
          <p className="text-xs text-slate-300">
            Another link is on the way. Check your inbox in a minute.
          </p>
        )}
      </div>

      <div className="text-sm text-slate-400">
        Entered the wrong email?{" "}
        <Link className="font-semibold text-white hover:text-slate-200" href="/forgot-password">
          Use a different one
        </Link>
      </div>
    </div>
  );
}
