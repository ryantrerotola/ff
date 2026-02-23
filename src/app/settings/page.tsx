"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

interface UserSettings {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Email form
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => {
        if (!r.ok) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setDisplayName(data.user.displayName ?? "");
          setBio(data.user.bio ?? "");
          setAvatarUrl(data.user.avatarUrl ?? "");
          setEmail(data.user.email);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    setProfileErr("");

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "profile",
        displayName: displayName || undefined,
        bio: bio || undefined,
        avatarUrl: avatarUrl || "",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setUser((prev) => (prev ? { ...prev, ...data.user } : prev));
      setProfileMsg("Profile updated!");
    } else {
      const data = await res.json();
      setProfileErr(data.error ?? "Failed to update");
    }
    setSavingProfile(false);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordMsg("");
    setPasswordErr("");

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "password",
        currentPassword,
        newPassword,
      }),
    });

    if (res.ok) {
      setPasswordMsg("Password changed!");
      setCurrentPassword("");
      setNewPassword("");
    } else {
      const data = await res.json();
      setPasswordErr(data.error ?? "Failed to change password");
    }
    setSavingPassword(false);
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setSavingEmail(true);
    setEmailMsg("");
    setEmailErr("");

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "email",
        email,
        password: emailPassword,
      }),
    });

    if (res.ok) {
      setEmailMsg("Email updated!");
      setEmailPassword("");
    } else {
      const data = await res.json();
      setEmailErr(data.error ?? "Failed to update email");
    }
    setSavingEmail(false);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-64 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const inputClasses =
    "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white";
  const labelClasses =
    "block text-sm font-medium text-gray-700 dark:text-gray-300";
  const sectionClasses =
    "rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Settings
      </h1>

      {/* Appearance */}
      <div className={`mt-6 ${sectionClasses}`}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Appearance
        </h2>
        <div className="mt-4">
          <label className={labelClasses}>Theme</label>
          <div className="mt-2 flex gap-3">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`rounded-md px-4 py-2 text-sm font-medium capitalize ${
                  theme === t
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Profile */}
      <form onSubmit={handleProfileSave} className={`mt-6 ${sectionClasses}`}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Profile
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelClasses}>Username</label>
            <input
              type="text"
              value={user.username}
              disabled
              className={`${inputClasses} cursor-not-allowed opacity-60`}
            />
          </div>
          <div>
            <label className={labelClasses}>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={3}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Avatar URL</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className={inputClasses}
              placeholder="https://..."
            />
          </div>
          {profileMsg && (
            <p className="text-sm text-green-600 dark:text-green-400">{profileMsg}</p>
          )}
          {profileErr && (
            <p className="text-sm text-red-600 dark:text-red-400">{profileErr}</p>
          )}
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>

      {/* Email */}
      <form onSubmit={handleEmailChange} className={`mt-6 ${sectionClasses}`}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Email Address
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelClasses}>New Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Confirm Password</label>
            <input
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              required
              className={inputClasses}
            />
          </div>
          {emailMsg && (
            <p className="text-sm text-green-600 dark:text-green-400">{emailMsg}</p>
          )}
          {emailErr && (
            <p className="text-sm text-red-600 dark:text-red-400">{emailErr}</p>
          )}
          <button
            type="submit"
            disabled={savingEmail}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {savingEmail ? "Updating..." : "Update Email"}
          </button>
        </div>
      </form>

      {/* Password */}
      <form onSubmit={handlePasswordChange} className={`mt-6 ${sectionClasses}`}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Change Password
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelClasses}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className={inputClasses}
            />
          </div>
          {passwordMsg && (
            <p className="text-sm text-green-600 dark:text-green-400">{passwordMsg}</p>
          )}
          {passwordErr && (
            <p className="text-sm text-red-600 dark:text-red-400">{passwordErr}</p>
          )}
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {savingPassword ? "Changing..." : "Change Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
