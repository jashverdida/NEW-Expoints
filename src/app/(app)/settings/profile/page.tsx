import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { getCurrentProfile } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Edit profile",
  description: "Your avatar, banner, handle and bio.",
};

/**
 * The profile editor, finally on a page of its own.
 *
 * It used to BE /settings, which meant the account screen opened onto an avatar
 * uploader and a bio box and nothing you'd actually go to settings for. Editing
 * how you present yourself and configuring how the app behaves are two
 * different jobs; they now live on two different pages, with /settings linking
 * here.
 */
export default async function EditProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <>
      <Atmosphere theme="obsidian" />

      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Settings
        </Link>

        <header className="mb-6 mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              <span className="text-gradient">Edit profile</span>
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              How you show up on every review, comment and leaderboard.
            </p>
          </div>

          <Link
            href={`/u/${profile.username}`}
            className="btn-ghost inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm"
          >
            <Eye className="h-4 w-4" />
            View as others
          </Link>
        </header>

        <SettingsForm profile={profile} />
      </div>
    </>
  );
}
