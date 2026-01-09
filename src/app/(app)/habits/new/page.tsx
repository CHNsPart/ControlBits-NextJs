"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiPostAuth } from "@/lib/api";

export default function NewHabitPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [cueTime, setCueTime] = useState("");
  const [target, setTarget] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 pb-16 pt-14">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Habit Builder
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Create a new habit.
          </h1>
          <p className="max-w-xl text-sm text-slate-300">
            Give it a name, set the daily cue, and decide how you want to track
            today&apos;s progress.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300"
        >
          Back to dashboard
        </Link>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form
          className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.8)]"
          onSubmit={async (event) => {
            event.preventDefault();
            setPending(true);
            setError(null);
            const trimmedName = name.trim();
            const trimmedCueTime = cueTime.trim();
            const trimmedTarget = target.trim();
            const trimmedNotes = notes.trim();

            if (!trimmedName) {
              setError("Please add a habit name.");
              setPending(false);
              return;
            }

            const descriptionParts = [];
            if (trimmedCueTime) {
              descriptionParts.push(`Cue: ${trimmedCueTime}`);
            }
            if (trimmedTarget) {
              descriptionParts.push(`Target: ${trimmedTarget}`);
            }
            if (trimmedNotes) {
              descriptionParts.push(`Notes: ${trimmedNotes}`);
            }

            try {
              await apiPostAuth("/habits", {
                name: trimmedName,
                description:
                  descriptionParts.length > 0
                    ? descriptionParts.join(" • ")
                    : undefined,
              });
              router.push("/dashboard");
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Unable to create habit.",
              );
            } finally {
              setPending(false);
            }
          }}
        >
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Habit name
            </label>
            <input
              type="text"
              name="name"
              placeholder="Morning mobility flow"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Cue time
              </label>
              <input
                type="time"
                name="cueTime"
                value={cueTime}
                onChange={(event) => setCueTime(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Target
              </label>
              <input
                type="text"
                name="target"
                placeholder="10 minutes"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Notes (optional)
            </label>
            <textarea
              name="notes"
              rows={4}
              placeholder="Add a short motivation or checklist."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-emerald-400 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-lg shadow-emerald-400/20"
            >
              {pending ? "Creating..." : "Create habit"}
            </button>
          </div>
        </form>

        <aside className="flex flex-col gap-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Habit preview
            </p>
            <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white">
                  {cueTime || "--:--"}
                </div>
                {name ? (
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200 ring-1 ring-emerald-500/30">
                    Planned
                  </span>
                ) : (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 ring-1 ring-white/10">
                    Draft
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">
                {name || "Add a habit name"}
              </h3>
              {target && (
                <p className="mt-1 text-sm text-slate-400">
                  {target}
                </p>
              )}
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                Ready for day one
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Cue checklist
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {[
                "Attach the habit to an existing routine.",
                "Keep the target small and repeatable.",
                "Pick one reminder channel to start.",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
