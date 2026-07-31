import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AtSign,
  Bell,
  ChevronRight,
  LayoutGrid,
  LogOut,
  Mail,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { DashboardSettings } from "@/components/settings/DashboardSettings";
import { PreferenceSettings } from "@/components/settings/PreferenceSettings";
import { MarkAllReadButton, PasswordResetButton } from "@/components/settings/SettingsActions";
import { SettingRow, SettingValue } from "@/components/settings/SettingRow";
import { Avatar } from "@/components/ui/Avatar";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { getCurrentProfile, getUnreadCount } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { signOut } from "@/lib/actions";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Settings",
  description: "Your account, your dashboard and your notifications.",
};

/**
 * Settings.
 *
 * This page used to be the profile editor — you clicked Settings and got an
 * avatar uploader. Editing how you look to other people and configuring how the
 * app behaves for you are different jobs, so the editor moved to
 * /settings/profile and this became what the link actually promises.
 *
 * EVERY CONTROL HERE DOES SOMETHING
 * There's no preferences table in the database, so the temptation was to lay
 * out a convincing grid of switches — theme, language, email digests, privacy.
 * None of that would have persisted. What's here instead is the set of things
 * the app genuinely supports today: the account behind the profile, the
 * dashboard columns (already cookie-backed), the notification queue, and the
 * session. A settings screen whose switches quietly do nothing is worse than a
 * short one that works.
 */
export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  // The email lives on the auth user, not the profile row.
  const supabase = await createClient();
  const [{ data: auth }, unread, t] = await Promise.all([
    supabase.auth.getUser(),
    getUnreadCount(profile.id),
    getT(),
  ]);

  const email = auth.user?.email ?? "";
  const emailConfirmed = Boolean(auth.user?.email_confirmed_at);

  return (
    <>
      {/* Black glass orbs climbing through the dark. */}
      <Atmosphere theme="obsidian" />

      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="text-gradient">{t("settings.title")}</span>
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {t("settings.memberSince")} {formatDate(profile.created_at)}.
          </p>
        </header>

        <div className="space-y-5">
          {/* ── Profile ──
              Top of the page because it's what most people arrive looking for,
              and a preview beats a link labelled "profile" with nothing to
              show for itself. */}
          <Section icon={UserRound} title={t("settings.profile")}>
            <Link
              href="/settings/profile"
              className="group/profile -m-2 flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-white/4"
            >
              <Avatar
                username={profile.username}
                avatarUrl={profile.avatar_url}
                level={profile.level}
                size="lg"
              />

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-display font-bold">
                    {profile.display_name || profile.username}
                  </span>
                  <LevelBadge level={profile.level} showRank />
                </p>
                <p className="truncate text-xs text-ink-faint">@{profile.username}</p>
                <p className="mt-1.5 line-clamp-1 text-xs text-ink-muted">
                  {profile.bio || t("settings.profile.noBio")}
                </p>
              </div>

              <ChevronRight className="h-5 w-5 shrink-0 text-ink-faint transition-transform duration-200 group-hover/profile:translate-x-0.5 group-hover/profile:text-brand-300" />
            </Link>

            <p className="mt-4 text-xs leading-relaxed text-ink-faint">
              {t("settings.profile.hint")}
            </p>
          </Section>

          {/* ── Account ── */}
          <Section icon={ShieldCheck} title={t("settings.account")}>
            <SettingRow
              label={t("settings.email")}
              hint={t(emailConfirmed ? "settings.email.verified" : "settings.email.unverified")}
              control={
                <SettingValue>
                  <Mail className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" />
                  {email || "—"}
                </SettingValue>
              }
            />

            <SettingRow
              label={t("settings.username")}
              hint={t("settings.username.hint")}
              control={
                <SettingValue>
                  <AtSign className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
                  {profile.username}
                </SettingValue>
              }
            />

            <SettingRow
              label={t("settings.password")}
              hint={t("settings.password.hint")}
              control={<PasswordResetButton email={email} />}
            />

            {profile.role === "admin" && (
              <SettingRow
                label={t("settings.admin")}
                hint={t("settings.admin.hint")}
                control={
                  <Link
                    href="/admin"
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-exp/30 bg-exp/10 px-4 text-sm font-semibold text-exp transition-colors hover:bg-exp/20"
                  >
                    {t("settings.admin.open")}
                  </Link>
                }
              />
            )}
          </Section>

          {/* ── Preferences ── */}
          <Section icon={SlidersHorizontal} title={t("settings.preferences")}>
            <PreferenceSettings />
          </Section>

          {/* ── Dashboard ── */}
          <Section icon={LayoutGrid} title={t("settings.dashboard")}>
            <DashboardSettings />
          </Section>

          {/* ── Notifications ── */}
          <Section icon={Bell} title={t("settings.notifications")}>
            <SettingRow
              label={t("settings.unread")}
              hint={t(unread > 0 ? "settings.unread.some" : "settings.unread.none")}
              control={
                <>
                  <SettingValue>{unread}</SettingValue>
                  <MarkAllReadButton unread={unread} />
                </>
              }
            />

            <SettingRow
              label={t("settings.history")}
              hint={t("settings.history.hint")}
              control={
                <Link
                  href="/notifications"
                  className="btn-ghost inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm"
                >
                  {t("settings.open")}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              }
            />
          </Section>

          {/* ── Session ── */}
          <Section icon={LogOut} title="Session" tone="danger">
            <SettingRow
              label={t("nav.signOut")}
              hint={t("settings.signOut.hint")}
              control={
                <form action={signOut}>
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("nav.signOut")}
                  </button>
                </form>
              }
            />
          </Section>

          {/*
            And once more, full width, at the very bottom.
            Every settings screen worth using ends this way: you scroll to the
            end of your account and the way out is the last thing there, big
            enough that nobody has to hunt for it.
          */}
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger/10 py-4 font-display text-sm font-bold uppercase tracking-widest text-danger transition-colors hover:border-danger/50 hover:bg-danger/20"
            >
              <LogOut className="h-4 w-4" />
              {t("nav.signOut")}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

/** A settings panel. Titled, iconed, and glass like every other card. */
function Section({
  icon: Icon,
  title,
  tone = "default",
  children,
}: {
  icon: React.ElementType;
  title: string;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-3xl p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2">
        <Icon
          className={`h-4 w-4 shrink-0 ${tone === "danger" ? "text-danger" : "text-brand-300"}`}
        />
        <span className="rule-label flex-1">{title}</span>
      </h2>
      {children}
    </section>
  );
}
