"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { apiDeleteAuth, apiGetAuth, apiPostAuth } from "@/lib/api";

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

type HabitsResponse = Habit[] | { habits?: HabitResponsePayload[] };

type HabitResponsePayload = Omit<Habit, "is_archived"> & {
  is_archived?: boolean;
  archived?: boolean;
};

type HabitEntriesResponse = HabitEntry[] | { entries?: HabitEntry[] };

type UndoAction = {
  entryId: string;
  status: "completed" | "missed";
  expiresAt: number;
  timeoutId: ReturnType<typeof setTimeout>;
};

function normalizeHabitsResponse(response: HabitsResponse): Habit[] | null {
  const list = Array.isArray(response)
    ? response
    : response.habits == null
      ? []
      : Array.isArray(response.habits)
        ? response.habits
        : null;
  if (!list) {
    return null;
  }

  return list.map((habit) => ({
    ...habit,
    is_archived: habit.is_archived ?? habit.archived ?? false,
  }));
}

function normalizeEntriesResponse(
  response: HabitEntriesResponse,
): HabitEntry[] | null {
  if (Array.isArray(response)) {
    return response;
  }
  if (response.entries == null) {
    return [];
  }
  return Array.isArray(response.entries) ? response.entries : null;
}

export default function DashboardPage() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);
  const [entriesByHabit, setEntriesByHabit] = useState<
    Record<string, HabitEntry[]>
  >({});
  const [undoByHabit, setUndoByHabit] = useState<Record<string, UndoAction>>({});
  const [actionByHabit, setActionByHabit] = useState<Record<string, string>>({});
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusTone: Record<
    string,
    { label: string; pill: string; dot: string }
  > = {
    completed: {
      label: "Completed",
      pill: "bg-emerald-500/25 text-emerald-100 ring-emerald-400/50",
      dot: "bg-emerald-500",
    },
    pending: {
      label: "In progress",
      pill: "bg-slate-500/20 text-slate-200 ring-white/15",
      dot: "bg-amber-500",
    },
    missed: {
      label: "Missed",
      pill: "bg-rose-500/25 text-rose-100 ring-rose-400/50",
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
          apiGetAuth<HabitsResponse>("/habits"),
        ]);

        if (!active) {
          return;
        }

        setProfileName(profile.name || null);
        const normalizedHabits =
          habitsResponse == null ? [] : normalizeHabitsResponse(habitsResponse);
        if (!normalizedHabits) {
          throw new Error("Habits response is invalid.");
        }

        const activeHabits = normalizedHabits.filter((habit) => !habit.is_archived);
        const archived = normalizedHabits.filter((habit) => habit.is_archived);
        setHabits(activeHabits);
        setArchivedHabits(archived);

        if (activeHabits.length === 0) {
          setEntriesByHabit({});
          return;
        }

        const today = getLocalDateString(new Date());
        const entryPairs = await Promise.all(
          activeHabits.map(async (habit) => {
            const entriesResponse = await apiGetAuth<HabitEntriesResponse>(
              `/habits/${habit.id}/entries?start_date=${today}&end_date=${today}`,
            );
            const entries = normalizeEntriesResponse(entriesResponse) ?? [];
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

    const handleRefresh = () => {
      if (document.visibilityState === "visible") {
        load();
      }
    };

    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", handleRefresh);
    load();

    return () => {
      active = false;
      window.removeEventListener("focus", handleRefresh);
      document.removeEventListener("visibilitychange", handleRefresh);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (Object.keys(undoByHabit).length === 0) {
      return;
    }
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [undoByHabit]);

  const handleUndo = async (habitId: string) => {
    const action = undoByHabit[habitId];
    if (!action) {
      return;
    }
    window.clearTimeout(action.timeoutId);
    setActionByHabit((prev) => ({ ...prev, [habitId]: "undo" }));
    try {
      await apiDeleteAuth(`/habits/${habitId}/entries/${action.entryId}`);
      setEntriesByHabit((prev) => ({
        ...prev,
        [habitId]: (prev[habitId] ?? []).filter(
          (entry) => entry.id !== action.entryId,
        ),
      }));
      setUndoByHabit((prev) => {
        const next = { ...prev };
        delete next[habitId];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to undo update.");
    } finally {
      setActionByHabit((prev) => {
        const next = { ...prev };
        delete next[habitId];
        return next;
      });
    }
  };

  const handleMark = async (habit: Habit, status: "completed" | "missed") => {
    if (actionByHabit[habit.id]) {
      return;
    }
    setActionByHabit((prev) => ({ ...prev, [habit.id]: status }));
    setError(null);
    try {
      const today = getLocalDateString(new Date());
      const result = await apiPostAuth<{ id: string }>(`/habits/${habit.id}/entries`, {
        date: today,
        status,
        note: "",
      });
      const entryId = result.id;
      const entry: HabitEntry = {
        id: entryId,
        habit_id: habit.id,
        entry_date: today,
        status,
        note: "",
        created_at: new Date().toISOString(),
      };

      setEntriesByHabit((prev) => ({
        ...prev,
        [habit.id]: [
          ...(prev[habit.id] ?? []).filter((item) => item.entry_date !== today),
          entry,
        ],
      }));

      setUndoByHabit((prev) => {
        const existing = prev[habit.id];
        if (existing) {
          window.clearTimeout(existing.timeoutId);
        }
        const expiresAt = Date.now() + 5000;
        const timeoutId = window.setTimeout(() => {
          setUndoByHabit((current) => {
            const next = { ...current };
            delete next[habit.id];
            return next;
          });
        }, 5000);
        return {
          ...prev,
          [habit.id]: { entryId, status, expiresAt, timeoutId },
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update habit.");
    } finally {
      setActionByHabit((prev) => {
        const next = { ...prev };
        delete next[habit.id];
        return next;
      });
    }
  };

  const handleUnarchive = async (habit: Habit) => {
    if (actionByHabit[habit.id]) {
      return;
    }
    setActionByHabit((prev) => ({ ...prev, [habit.id]: "unarchive" }));
    setError(null);
    try {
      await apiPostAuth(`/habits/${habit.id}/unarchive`, {});
      setArchivedHabits((prev) => prev.filter((item) => item.id !== habit.id));
      setHabits((prev) => [{ ...habit, is_archived: false }, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to unarchive habit.");
    } finally {
      setActionByHabit((prev) => {
        const next = { ...prev };
        delete next[habit.id];
        return next;
      });
    }
  };

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
            <div className="relative" ref={menuRef}>
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
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.9)] backdrop-blur"
                  >
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
                            localStorage.removeItem("refresh_token");
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
                  </motion.div>
                )}
              </AnimatePresence>
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
                  const status = habitStatuses[habit.id] ?? "pending";
                  const tone = statusTone[status];
                  const undoAction = undoByHabit[habit.id];
                  const secondsLeft = undoAction
                    ? Math.max(0, Math.ceil((undoAction.expiresAt - now) / 1000))
                    : 0;
                  const showActions = status === "pending" && !undoAction;
                  return (
                    <motion.div
                      key={habit.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 transition hover:border-emerald-400/40 hover:bg-white/10 sm:flex-row sm:items-stretch sm:justify-between"
                    >
                      <Link
                        href={`/habits/${habit.id}`}
                        className="flex items-center gap-4"
                      >
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
                      </Link>
                      <div
                        className={`flex flex-wrap items-center gap-3 ${
                          showActions ? "" : "justify-center"
                        } sm:self-stretch sm:items-center sm:justify-end`}
                      >
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                          {habit.current_streak} day streak
                        </span>
                        <motion.span
                          layout
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ring-1 ${tone.pill}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                          {tone.label}
                        </motion.span>
                        <div className="flex flex-wrap items-center gap-2">
                          <AnimatePresence mode="wait" initial={false}>
                            {showActions && (
                              <motion.div
                                key="actions"
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="flex flex-wrap items-center gap-2"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleMark(habit, "completed")}
                                  disabled={Boolean(actionByHabit[habit.id])}
                                  className="min-w-[96px] rounded-full border border-emerald-400/50 bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200 transition hover:border-emerald-300/70 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  Complete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMark(habit, "missed")}
                                  disabled={Boolean(actionByHabit[habit.id])}
                                  className="min-w-[96px] rounded-full border border-rose-400/50 bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-200 transition hover:border-rose-300/70 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  Missed
                                </button>
                              </motion.div>
                            )}
                            {undoAction && (
                              <motion.button
                                key="undo"
                                type="button"
                                onClick={() => handleUndo(habit.id)}
                                disabled={Boolean(actionByHabit[habit.id])}
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="rounded-full border border-amber-400/50 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200 transition hover:border-amber-300/70 disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                Undo ({secondsLeft}s)
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
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

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.8)]">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Archived
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                Past habits
              </h3>
              <div className="mt-5 space-y-3">
                {loading && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
                    Loading archived habits...
                  </div>
                )}
                {!loading && error && (
                  <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-4 text-sm text-rose-200">
                    {error}
                  </div>
                )}
                {!loading && !error && archivedHabits.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
                    No archived habits yet.
                  </div>
                )}
                {!loading && !error && (
                  <AnimatePresence initial={false}>
                    {archivedHabits.map((habit) => (
                      <motion.div
                        key={habit.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10"
                      >
                        <Link
                          href={`/habits/${habit.id}`}
                          className="font-semibold text-white"
                        >
                          {habit.name}
                        </Link>
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Archived
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUnarchive(habit)}
                            disabled={Boolean(actionByHabit[habit.id])}
                            className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200 transition hover:border-emerald-300/60 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            Unarchive
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
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
