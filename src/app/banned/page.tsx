import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldX } from "lucide-react";
import { getCurrentProfile } from "@/lib/queries";
import { signOut } from "@/lib/actions";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Account suspended",
  robots: { index: false, follow: false },
};

/**
 * Where banned users land. Deliberately severe — red on black, nothing else on
 * the page — but it still states the reason and how to appeal, which the
 * original version buried.
 */
export default async function BannedPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (!profile.is_banned) redirect("/feed");

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      {/* Red wash that overrides the usual blue aurora. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60rem 40rem at 50% 0%, rgba(244,63,94,0.22), transparent 60%), linear-gradient(180deg, #14030a, #05060f)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-1 animate-pulse bg-gradient-to-r from-transparent via-danger to-transparent"
      />

      <div className="glass-strong w-full max-w-lg rounded-3xl border-danger/30 p-8 text-center sm:p-10">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-danger/15 ring-2 ring-danger/40">
          <ShieldX className="h-10 w-10 text-danger" />
        </div>

        <h1 className="font-display text-3xl font-extrabold tracking-tight text-danger sm:text-4xl">
          ACCOUNT SUSPENDED
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          @{profile.username} — your access to EXPoints has been revoked.
        </p>

        <div className="mt-7 rounded-2xl border border-danger/30 bg-danger/8 p-5 text-left">
          <h2 className="font-display text-[0.7rem] font-bold uppercase tracking-widest text-danger/90">
            Reason
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            {profile.ban_reason || "Violated the community guidelines."}
          </p>
          {profile.banned_at && (
            <p className="mt-3 text-xs text-ink-faint">
              Suspended on {formatDate(profile.banned_at)}
            </p>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left">
          <h2 className="font-display text-[0.7rem] font-bold uppercase tracking-widest text-ink-muted">
            Think this is a mistake?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Email{" "}
            <a
              href="mailto:appeals@expoints.app"
              className="font-semibold text-brand-300 hover:text-brand-200"
            >
              appeals@expoints.app
            </a>{" "}
            with your username. An admin will review it.
          </p>
        </div>

        <form action={signOut} className="mt-7">
          <button
            type="submit"
            className="btn-ghost h-12 w-full rounded-xl font-display font-bold uppercase tracking-widest"
          >
            Understood — sign out
          </button>
        </form>
      </div>
    </div>
  );
}
