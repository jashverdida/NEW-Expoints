import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { getCurrentProfile } from "@/lib/queries";
import { signOut } from "@/lib/actions";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your EXPoints profile.",
};

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span className="text-gradient">Settings</span>
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Member since {formatDate(profile.created_at)}.
        </p>
      </header>

      <SettingsForm profile={profile} />

      <section className="glass mt-5 rounded-3xl p-5 sm:p-6">
        <h2 className="rule-label mb-4">Account</h2>
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </section>
    </div>
  );
}
