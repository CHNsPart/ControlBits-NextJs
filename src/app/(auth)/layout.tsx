import Image from "next/image";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell relative min-h-screen text-slate-100">
      <div className="auth-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-6 py-12 lg:flex-row lg:items-center">
        <section className="flex w-full flex-col gap-8 lg:w-1/2">
          <div className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-slate-400">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Image src="/cb-logo.svg" alt="ControlBits" width={24} height={24} />
            </span>
            <div>
              <div className="text-xs font-semibold text-slate-300">ControlBits</div>
              <div className="text-[11px] normal-case text-slate-400">Minimal habit control.</div>
            </div>
          </div>
          <div className="space-y-5">
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Keep the signal, drop the noise.
            </h1>
            <p className="max-w-xl text-base text-slate-300">
              A calm space to track the habits that matter. Simple streaks, small notes, and a clean
              daily rhythm that stays out of your way.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Focused</p>
              <p className="mt-2 text-sm text-slate-200">
                Two-minute check-ins with gentle reminders.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Calm</p>
              <p className="mt-2 text-sm text-slate-200">
                Soft streaks, clear notes, and no clutter.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-400">
            {["Privacy-first", "Daily rhythm", "Clean sync"].map((label) => (
              <span
                key={label}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2"
              >
                {label}
              </span>
            ))}
          </div>
        </section>

        <section className="flex w-full flex-col lg:w-1/2">
          <div className="mt-6 w-full rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-slate-950/60 backdrop-blur">
            {children}
          </div>
          <p className="mt-6 text-xs text-slate-400">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
        </section>
      </div>
    </div>
  );
}
