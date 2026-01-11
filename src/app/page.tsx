"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        router.replace("/dashboard");
      }
    } catch {
      // Ignore storage errors and render the landing page.
    }
  }, [router]);

  return (
    <div className="auth-shell relative min-h-screen overflow-hidden text-slate-100">
      <div className="auth-grid pointer-events-none absolute inset-0 opacity-40" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-20 px-6 pb-20 pt-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/cb-logo.svg"
              alt="ControlBits logo"
              width={42}
              height={42}
              priority
            />
            <span className="text-lg font-semibold tracking-tight text-white">
              ControlBits
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium">
            <Link
              href="/sign-in"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-slate-100 transition hover:border-white/30"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-white px-4 py-2 text-slate-900 shadow-sm transition hover:bg-slate-100"
            >
              Get started
            </Link>
          </div>
        </header>

        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              Build habits that stick
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              A calm, focused habit tracker for consistent progress.
            </h1>
            <p className="max-w-xl text-base text-slate-300 sm:text-lg">
              ControlBits helps you build daily momentum with simple streaks,
              clear feedback, and a dashboard that keeps your wins visible.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/sign-up"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
              >
                Create your account
              </Link>
              <Link
                href="/sign-in"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/30"
              >
                I already have an account
              </Link>
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Quick setup • Daily check-ins • Badge milestones
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/60 backdrop-blur">
            <div className="space-y-4">
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white">
                Today’s focus
              </div>
              <div className="space-y-3">
                {[
                  "Morning stretch",
                  "No-sugar lunch",
                  "30-minute reading",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100"
                  >
                    <span>{item}</span>
                    <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-xs font-semibold text-emerald-200">
                      On track
                    </span>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Streak: 9 days • Next badge in 1 day
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-3">
          {[
            {
              title: "Stay consistent",
              description:
                "Simple daily check-ins keep your momentum visible without clutter.",
            },
            {
              title: "See the streak",
              description:
                "Track current and longest streaks with milestone badges.",
            },
            {
              title: "Keep it flexible",
              description:
                "Archive habits without losing history when priorities shift.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur"
            >
              <h3 className="text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                {feature.description}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-sm backdrop-blur">
          <h2 className="text-2xl font-semibold text-white">
            Start with one habit today.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300">
            ControlBits is built for quiet focus. Log daily wins, watch your
            streak grow, and celebrate progress without the noise.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/sign-up"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
            >
              Get started free
            </Link>
            <Link
              href="/sign-in"
              className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/30"
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
