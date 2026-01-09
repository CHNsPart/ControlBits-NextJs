"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiGetAuth } from "@/lib/api";

type Habit = {
  id: string;
  name: string;
  description: string;
  current_streak: number;
  longest_streak: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

type HabitEntry = {
  id: string;
  habit_id: string;
  entry_date: string;
  status: "completed" | "missed";
  note: string;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entriesByHabit, setEntriesByHabit] = useState<
    Record<string, HabitEntry[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusTone: Record<
    string,
    { label: string; pill: string; dot: string }
  > = {
    completed: {
      label: "Completed",
      pill: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
      dot: "bg-emerald-500",
    },
    pending: {
      label: "In progress",
      pill: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
      dot: "bg-amber-500",
    },
    missed: {
      label: "Missed",
      pill: "bg-rose-500/15 text-rose-200 ring-rose-500/30",
      dot: "bg-rose-500",
    },
  };

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profile, habitsResponse] = await Promise.all([
          apiGetAuth<{ name: string }>("/users/me"),
          apiGetAuth<Habit[]>("/habits"),
        ]);

        if (!active) {
          return;
        }

        setProfileName(profile.name || null);
        const normalizedHabits = Array.isArray(habitsResponse)
          ? habitsResponse
          : habitsResponse == null
            ? []
            : null;
        if (!normalizedHabits) {
          throw new Error("Habits response is invalid.");
        }

        const activeHabits = normalizedHabits.filter((habit) => !habit.is_archived);
        setHabits(activeHabits);

        if (activeHabits.length === 0) {
          setEntriesByHabit({});
          return;
        }

        const today = getLocalDateString(new Date());
        const entryPairs = await Promise.all(
          activeHabits.map(async (habit) => {
            const entriesResponse = await apiGetAuth<HabitEntry[]>(
              `/habits/${habit.id}/entries?start_date=${today}&end_date=${today}`,
            );
            const entries = Array.isArray(entriesResponse)
              ? entriesResponse
              : [];
            return [habit.id, entries] as const;
          }),
        );

        if (!active) {
          return;
        }

        const nextEntries: Record<string, HabitEntry[]> = {};
        for (const [habitId, entries] of entryPairs) {
          nextEntries[habitId] = entries;
        }
        setEntriesByHabit(nextEntries);
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to load dashboard.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const habitStatuses = useMemo(() => {
    const statusMap: Record<string, "completed" | "missed" | "pending"> = {};
    for (const habit of habits) {
      const entries = entriesByHabit[habit.id] ?? [];
      if (entries.length === 0) {
        statusMap[habit.id] = "pending";
        continue;
      }
      const latest = [...entries].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];
      statusMap[habit.id] = latest.status;
    }
    return statusMap;
  }, [habits, entriesByHabit]);

  const completedCount = habits.filter(
    (habit) => habitStatuses[habit.id] === "completed",
  ).length;
  const pendingCount = habits.filter(
    (habit) => habitStatuses[habit.id] === "pending",
  ).length;
  const completionRate =
    habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
  const bestStreak = habits.reduce(
    (max, habit) => Math.max(max, habit.longest_streak),
    0,
  );
  const activityItems = habits
    .map((habit) => ({
      id: habit.id,
      title: habit.name,
      status: habitStatuses[habit.id] ?? "pending",
    }))
    .filter((item) => item.status !== "pending");

  const pendingCopy =
    habits.length === 0
      ? "Create a habit to start your day."
      : pendingCount === 0
        ? "All habits are wrapped up."
        : pendingCount === 1
          ? "One habit remains on deck."
          : `${pendingCount} habits remain on deck.`;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-14">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              Daily Dashboard
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Your habits, tuned for today.
            </h1>
            <p className="max-w-xl text-sm text-slate-300">
              Focus on the cues that matter. Keep the streaks visible and the misses
              gentle.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
              {todayLabel}
            </div>
            <Link
              href="/habits/new"
              className="rounded-full bg-emerald-400 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-lg shadow-emerald-400/20"
            >
              New habit
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {profileName
                  ? profileName
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join("") || "U"
                  : "…"}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.9)] backdrop-blur">
                  <div className="border-b border-white/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                      Signed in
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {profileName ?? "Loading..."}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <Link
                      href="/profile"
                      className="px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                    >
                      Profile & achievements
                    </Link>
                    <Link
                      href="/settings"
                      className="px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                    >
                      Account settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.removeItem("access_token");
                        } catch {
                          // Ignore storage errors.
                        }
                        router.push("/sign-in");
                      }}
                      className="px-4 py-3 text-left text-sm text-rose-200 transition hover:bg-rose-500/10"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: "Completion",
              value: `${completionRate}%`,
              helper:
                habits.length > 0
                  ? `${completedCount} of ${habits.length} habits done`
                  : "No habits yet",
            },
            {
              label: "Streak momentum",
              value: habits.length > 0 ? `${bestStreak} days` : "0 days",
              helper: "Best streak so far",
            },
            {
              label: "Active focus",
              value: habits.length > 0 ? `${pendingCount} tasks` : "0 tasks",
              helper:
                habits.length > 0 ? "Still on deck today" : "Create a habit to start",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.8)]"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {card.label}
              </p>
              <div className="mt-4 text-3xl font-semibold text-white">
                {card.value}
              </div>
              <p className="mt-2 text-sm text-slate-400">{card.helper}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.8)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Today&apos;s habits
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Main list
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {loading && (
                <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-6 text-sm text-slate-400">
                  Loading habits...
                </div>
              )}
              {error && (
                <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 px-5 py-6 text-sm text-rose-200">
                  {error}
                </div>
              )}
              {!loading && !error && habits.length === 0 && (
                <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-6 text-sm text-slate-400">
                  No habits yet. Create one to start your streak.
                </div>
              )}
              {!loading &&
                !error &&
                habits.map((habit) => {
                  const tone = statusTone[habitStatuses[habit.id] ?? "pending"];
                  return (
                    <Link
                      key={habit.id}
                      href={`/habits/${habit.id}`}
                      className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 transition hover:border-emerald-400/40 hover:bg-white/10 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 flex-col items-center justify-center gap-1 rounded-2xl bg-white/10 text-white shadow-sm">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                            {new Date(habit.created_at).toLocaleString(undefined, {
                              month: "short",
                            })}
                          </span>
                          <span className="text-base font-semibold leading-none text-white">
                            {new Date(habit.created_at).toLocaleString(undefined, {
                              day: "2-digit",
                            })}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {habit.name}
                          </h3>
                          {habit.description && (
                            <p className="text-sm text-slate-400">
                              {habit.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                          {habit.current_streak} day streak
                        </span>
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ring-1 ${tone.pill}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                          {tone.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.8)]">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Today&apos;s status
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Daily pulse
              </h2>
              <div className="mt-6 flex items-center gap-6">
                <div className="relative h-28 w-28 shrink-0">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(#34d399 ${completionRate}%, rgba(15,23,42,0.6) 0)`,
                    }}
                  />
                  <div className="absolute inset-[6px] rounded-full bg-slate-950" />
                  <div className="absolute inset-[6px] flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-semibold text-white">
                      {completionRate}%
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Done
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-slate-400">
                  <p className="text-base font-semibold text-white">
                    {completedCount} completed · {pendingCount} pending
                  </p>
                  <p>{pendingCopy}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.8)]">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Activity
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                Today&apos;s updates
              </h3>
              <div className="mt-5 space-y-4">
                {loading && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
                    Loading activity...
                  </div>
                )}
                {!loading && habits.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
                    No habits yet. Add your first habit to see activity here.
                  </div>
                )}
                {!loading && habits.length > 0 && activityItems.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
                    No activity logged for today.
                  </div>
                )}
                {!loading &&
                  habits.length > 0 &&
                  activityItems.map((item) => {
                    const tone = statusTone[item.status];
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                            Today
                          </p>
                          <p className="text-sm font-semibold text-white">
                            {item.title}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] ring-1 ${tone.pill}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                          {tone.label}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function getLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
