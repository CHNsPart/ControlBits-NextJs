"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiGetAuth, apiPutAuth } from "@/lib/api";

type Profile = {
  name: string;
  email: string;
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>({ name: "", email: "" });
  const [initialProfile, setInitialProfile] = useState<Profile>({
    name: "",
    email: "",
  });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profilePending, setProfilePending] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let active = true;
    apiGetAuth<Profile>("/users/me")
      .then((data) => {
        if (!active) {
          return;
        }
        setProfile({ name: data.name ?? "", email: data.email ?? "" });
        setInitialProfile({ name: data.name ?? "", email: data.email ?? "" });
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        setProfileError(
          err instanceof Error ? err.message : "Unable to load profile.",
        );
      })
      .finally(() => {
        if (active) {
          setProfileLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 pb-16 pt-14">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Account settings
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Update your profile.
          </h1>
          <p className="max-w-xl text-sm text-slate-300">
            Keep your details up to date and refresh your password when needed.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300"
        >
          Back to dashboard
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <form
            className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.8)]"
            onSubmit={async (event) => {
              event.preventDefault();
              setProfilePending(true);
              setProfileError(null);
              setProfileMessage(null);

              const updates: Partial<Profile> = {};
              if (profile.name !== initialProfile.name) {
                updates.name = profile.name.trim();
              }
              if (profile.email !== initialProfile.email) {
                updates.email = profile.email.trim();
              }

              if (Object.keys(updates).length === 0) {
                setProfileError("No changes to save.");
                setProfilePending(false);
                return;
              }

              try {
                await apiPutAuth("/users/me", updates);
                setInitialProfile({
                  name: profile.name.trim(),
                  email: profile.email.trim(),
                });
                setProfileMessage("Profile updated successfully.");
              } catch (err) {
                setProfileError(
                  err instanceof Error
                    ? err.message
                    : "Unable to update profile.",
                );
              } finally {
                setProfilePending(false);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Profile details
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Name and email
                </h2>
              </div>
              {profileMessage && (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Saved
                </span>
              )}
            </div>

            {profileError && (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {profileError}
              </div>
            )}

            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Full name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(event) =>
                    setProfile((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(event) =>
                    setProfile((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  placeholder="you@controlbits.app"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={profilePending}
                className="rounded-full bg-emerald-400 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-lg shadow-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {profilePending ? "Saving..." : "Save changes"}
              </button>
              {profileMessage && (
                <span className="text-xs uppercase tracking-[0.3em] text-emerald-300">
                  {profileMessage}
                </span>
              )}
            </div>
          </form>

          <form
            className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.8)]"
            onSubmit={async (event) => {
              event.preventDefault();
              setPasswordPending(true);
              setPasswordError(null);
              setPasswordMessage(null);

              if (!oldPassword || !newPassword) {
                setPasswordError("Please fill in both password fields.");
                setPasswordPending(false);
                return;
              }
              if (newPassword !== confirmPassword) {
                setPasswordError("New password and confirmation do not match.");
                setPasswordPending(false);
                return;
              }

              try {
                await apiPutAuth("/users/me/password", {
                  old_password: oldPassword,
                  new_password: newPassword,
                });
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setPasswordMessage("Password updated successfully.");
              } catch (err) {
                setPasswordError(
                  err instanceof Error
                    ? err.message
                    : "Unable to change password.",
                );
              } finally {
                setPasswordPending(false);
              }
            }}
          >
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Security
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Change password
              </h2>
            </div>

            {passwordError && (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {passwordError}
              </div>
            )}

            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Current password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                  placeholder="Your current password"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Choose a new password"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat the new password"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={passwordPending}
                className="rounded-full bg-emerald-400 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-lg shadow-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {passwordPending ? "Updating..." : "Update password"}
              </button>
              {passwordMessage && (
                <span className="text-xs uppercase tracking-[0.3em] text-emerald-300">
                  {passwordMessage}
                </span>
              )}
            </div>
          </form>
        </section>

        <aside className="flex flex-col gap-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Account status
            </p>
            <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">
                Signed in as
              </p>
              <p className="mt-1 text-lg font-semibold text-white">
                {profileLoading ? "Loading..." : profile.name}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {profileLoading ? "Loading..." : profile.email}
              </p>
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Tips
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {[
                "Update your email before changing devices.",
                "Use a strong password with mixed characters.",
                "Review your streak cadence weekly.",
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
