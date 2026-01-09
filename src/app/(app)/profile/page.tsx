"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiGetAuth } from "@/lib/api";
import BadgeIcon from "@/components/BadgeIcon";

type Profile = {
  name: string;
  email: string;
  created_at?: string;
};

type Badge = {
  id: string;
  name: string;
  description: string;
  streak_required: number;
  icon: string;
};

type EarnedBadge = Badge & {
  earned_at: string;
  habit_id: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileResponse, allBadges, userBadges] = await Promise.all([
          apiGetAuth<Profile>("/users/me"),
          apiGetAuth<Badge[]>("/badges"),
          apiGetAuth<EarnedBadge[]>("/users/me/badges"),
        ]);

        if (!active) {
          return;
        }

        setProfile(profileResponse);
        setBadges(Array.isArray(allBadges) ? allBadges : []);
        setEarnedBadges(Array.isArray(userBadges) ? userBadges : []);
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to load profile.");
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

  const earnedIds = useMemo(() => {
    return new Set(earnedBadges.map((badge) => badge.id));
  }, [earnedBadges]);

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "—";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-14">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Profile
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Achievements &amp; badges.
          </h1>
          <p className="max-w-xl text-sm text-slate-300">
            See your streak milestones and keep tabs on what you&apos;ve earned.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300"
          >
            Back to dashboard
          </Link>
          <Link
            href="/settings"
            className="rounded-full bg-emerald-400 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-lg shadow-emerald-400/20"
          >
            Edit profile
          </Link>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.8)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Profile snapshot
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {profile?.name || "Loading..."}
              </h2>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold text-white">
              {profile?.name
                ? profile.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join("")
                : "—"}
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Email
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {profile?.email || "Loading..."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Member since
              </p>
              <p className="mt-2 text-sm font-semibold text-white">{joinedDate}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.8)]">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Earned badges
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {earnedBadges.length} unlocked
          </h2>
          <div className="mt-5 space-y-3">
            {loading && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
                Loading badges...
              </div>
            )}
            {!loading && earnedBadges.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
                No badges yet. Complete a streak to unlock your first.
              </div>
            )}
            {!loading &&
              earnedBadges.map((badge) => (
                <div
                  key={`${badge.id}-${badge.earned_at}`}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200">
                      <BadgeIcon name={badge.icon} className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {badge.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    {new Date(badge.earned_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "2-digit",
                    })}
                  </span>
                </div>
              ))}
          </div>
        </section>
      </div>

      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.8)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Badge catalog
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              All achievements
            </h2>
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {badges.length} total
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {loading && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
              Loading catalog...
            </div>
          )}
          {!loading && badges.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
              No badges configured yet.
            </div>
          )}
          {!loading &&
            badges.map((badge) => {
              const earned = earnedIds.has(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`rounded-2xl border px-4 py-4 ${
                    earned
                      ? "border-emerald-400/30 bg-emerald-500/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                          earned ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-slate-300"
                        }`}
                      >
                        <BadgeIcon name={badge.icon} className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {badge.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] ${
                        earned
                          ? "bg-emerald-500/20 text-emerald-200"
                          : "bg-white/5 text-slate-400"
                      }`}
                    >
                      {earned ? "Unlocked" : `${badge.streak_required} days`}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
}
