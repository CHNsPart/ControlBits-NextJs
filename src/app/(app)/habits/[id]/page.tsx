"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { apiDeleteAuth, apiGetAuth, apiPostAuth, apiPutAuth } from "@/lib/api";

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

type HabitResponsePayload = Omit<Habit, "is_archived"> & {
  is_archived?: boolean;
  archived?: boolean;
};

type HabitEntry = {
  id: string;
  habit_id: string;
  entry_date: string;
  status: "completed" | "missed";
  note: string;
  created_at: string;
};

type CalendarDay = {
  date: Date;
  status: "completed" | "missed" | "empty";
  entry?: HabitEntry;
};

export default function HabitDetailPage() {
  const params = useParams();
  const habitId = typeof params?.id === "string" ? params.id : "";
  const [habit, setHabit] = useState<Habit | null>(null);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!habitId) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const habitResponse = await apiGetAuth<HabitResponsePayload>(
          `/habits/${habitId}`,
        );
        if (!active) {
          return;
        }
        const normalizedHabit: Habit = {
          ...habitResponse,
          is_archived: habitResponse.is_archived ?? habitResponse.archived ?? false,
        };
        setHabit(normalizedHabit);
        setEditName(normalizedHabit.name || "");
        setEditDescription(normalizedHabit.description || "");

        const { start, end } = getMonthRange(monthCursor);
        const entriesResponse = await apiGetAuth<HabitEntry[]>(
          `/habits/${habitId}/entries?start_date=${start}&end_date=${end}`,
        );
        if (!active) {
          return;
        }
        setEntries(Array.isArray(entriesResponse) ? entriesResponse : []);
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to load habit.");
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
  }, [habitId, monthCursor]);

  const calendarDays = useMemo(() => {
    const { startDate, endDate } = getCalendarRange(monthCursor);
    const entryMap = new Map<string, HabitEntry>();
    for (const entry of entries) {
      const key = toDateKey(new Date(entry.entry_date));
      entryMap.set(key, entry);
    }

    const days: CalendarDay[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const key = toDateKey(current);
      const entry = entryMap.get(key);
      days.push({
        date: new Date(current),
        status: entry ? entry.status : "empty",
        entry,
      });
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [entries, monthCursor]);

  const historyItems = useMemo(() => {
    return [...entries]
      .sort(
        (a, b) =>
          new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime(),
      )
      .slice(0, 8);
  }, [entries]);

  const monthLabel = monthCursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-14"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Habit detail
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {habit?.name || "Habit"}
          </h1>
          <p className="max-w-xl text-sm text-slate-300">
            {habit?.description || "Track progress and streak history."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300"
          >
            Back to dashboard
          </Link>
          <button
            type="button"
            disabled={submitting === "completed"}
            onClick={async () => {
              if (!habitId) {
                return;
              }
              setSubmitting("completed");
              setError(null);
              try {
                await apiPostAuth(`/habits/${habitId}/complete`, {});
                const { start, end } = getMonthRange(monthCursor);
                const entriesResponse = await apiGetAuth<HabitEntry[]>(
                  `/habits/${habitId}/entries?start_date=${start}&end_date=${end}`,
                );
                setEntries(Array.isArray(entriesResponse) ? entriesResponse : []);
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Unable to update habit.",
                );
              } finally {
                setSubmitting(null);
              }
            }}
            className="rounded-full bg-emerald-400 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-lg shadow-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting === "completed" ? "Saving..." : "Mark completed"}
          </button>
          <button
            type="button"
            disabled={submitting === "missed"}
            onClick={async () => {
              if (!habitId) {
                return;
              }
              setSubmitting("missed");
              setError(null);
              try {
                await apiPostAuth(`/habits/${habitId}/miss`, {});
                const { start, end } = getMonthRange(monthCursor);
                const entriesResponse = await apiGetAuth<HabitEntry[]>(
                  `/habits/${habitId}/entries?start_date=${start}&end_date=${end}`,
                );
                setEntries(Array.isArray(entriesResponse) ? entriesResponse : []);
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Unable to update habit.",
                );
              } finally {
                setSubmitting(null);
              }
            }}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting === "missed" ? "Saving..." : "Mark missed"}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.8)]"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Calendar
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {monthLabel}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setMonthCursor(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                  )
                }
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() =>
                  setMonthCursor(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                  )
                }
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300"
              >
                Next
              </button>
            </div>
          </div>

          {loading && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-400">
              Loading calendar...
            </div>
          )}

          {!loading && (
            <>
              <div className="mt-6 grid grid-cols-7 gap-2 text-[10px] uppercase tracking-[0.3em] text-slate-500">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center">
                    {day}
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-7 gap-2">
                {calendarDays.map((day) => {
                  const isToday = isSameDate(day.date, new Date());
                  const inMonth = day.date.getMonth() === monthCursor.getMonth();
                  const tone =
                    day.status === "completed"
                      ? "bg-emerald-400/20 text-emerald-200 ring-emerald-400/40"
                      : day.status === "missed"
                        ? "bg-rose-500/20 text-rose-200 ring-rose-500/40"
                        : "bg-white/5 text-slate-400 ring-white/10";
                  return (
                    <div
                      key={day.date.toISOString()}
                      className={`flex h-12 items-center justify-center rounded-2xl text-xs font-semibold ring-1 ${tone} ${
                        inMonth ? "" : "opacity-40"
                      } ${isToday ? "ring-emerald-400/70" : ""}`}
                      title={
                        day.entry?.note ||
                        (day.status === "empty"
                          ? "No entry"
                          : `Marked ${day.status}`)
                      }
                    >
                      {day.date.getDate()}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut", delay: 0.05 }}
          className="flex flex-col gap-6"
        >
          <form
            className="rounded-[28px] border border-white/10 bg-white/5 p-6"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!habitId || !habit) {
                return;
              }
              setSaving(true);
              setError(null);
              try {
                await apiPutAuth(`/habits/${habitId}`, {
                  name: editName.trim(),
                  description: editDescription.trim(),
                });
                setHabit((prev) =>
                  prev
                    ? {
                        ...prev,
                        name: editName.trim(),
                        description: editDescription.trim(),
                      }
                    : prev,
                );
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Unable to update habit.",
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Edit habit
            </p>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-emerald-400 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-lg shadow-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              {habit?.updated_at && (
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Updated {new Date(habit.updated_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </form>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Streaks
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Current
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {habit?.current_streak ?? 0} days
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Best
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {habit?.longest_streak ?? 0} days
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              History
            </p>
            <div className="mt-4 space-y-3">
              {loading && (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
                  Loading history...
                </div>
              )}
              {!loading && historyItems.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
                  No entries yet. Mark today to start.
                </div>
              )}
              {!loading && (
                <AnimatePresence initial={false}>
                  {historyItems.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                          {new Date(entry.entry_date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "2-digit",
                          })}
                        </p>
                        <p className="text-sm font-semibold text-white">
                          {entry.status === "completed"
                            ? "Completed"
                            : "Missed"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] ${
                          entry.status === "completed"
                            ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30"
                            : "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/30"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Manage
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                disabled={archiving || !habitId || !habit}
                onClick={async () => {
                  if (!habitId || !habit) {
                    return;
                  }
                  setArchiving(true);
                  setError(null);
                  try {
                    const endpoint = habit.is_archived
                      ? `/habits/${habitId}/unarchive`
                      : `/habits/${habitId}/archive`;
                    await apiPostAuth(endpoint, {});
                    setHabit((prev) =>
                      prev ? { ...prev, is_archived: !prev.is_archived } : prev,
                    );
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Unable to update habit.",
                    );
                  } finally {
                    setArchiving(false);
                  }
                }}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {archiving
                  ? "Updating..."
                  : habit?.is_archived
                    ? "Unarchive habit"
                    : "Archive habit"}
              </button>
              <button
                type="button"
                disabled={deleting || !habitId}
                onClick={async () => {
                  if (!habitId) {
                    return;
                  }
                  const confirmed = window.confirm(
                    "Delete this habit? This cannot be undone.",
                  );
                  if (!confirmed) {
                    return;
                  }
                  setDeleting(true);
                  setError(null);
                  try {
                    await apiDeleteAuth(`/habits/${habitId}`);
                    window.location.href = "/dashboard";
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Unable to delete habit.",
                    );
                  } finally {
                    setDeleting(false);
                  }
                }}
                className="rounded-full border border-rose-400/30 bg-rose-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-rose-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deleting ? "Deleting..." : "Delete habit"}
              </button>
            </div>
          </div>
        </motion.aside>
      </div>
    </motion.div>
  );
}

function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start: toDateKey(start), end: toDateKey(end) };
}

function getCalendarRange(date: Date) {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(endOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
  return { startDate, endDate };
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
