import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertTriangle, CalendarDays, Mail, ShieldX, UserCog } from "lucide-react";
import { getCurrentProfile } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions";
import { formatDate } from "@/lib/utils";
import { Atmosphere } from "@/components/ui/Atmosphere";

export const metadata: Metadata = {
  title: "Account suspended",
  robots: { index: false, follow: false },
};

/**
 * Where banned users land.
 *
 * Deliberately the loudest screen in the product — a lockdown backdrop of
 * sweeping searchlights, rising sparks and falling ash, with a card that slams
 * in behind a rotating rim of light. Being banned should land like hitting a
 * wall.
 *
 * It still does the responsible things underneath the theatrics: states the
 * reason verbatim, names the date and the admin who issued it, and gives a real
 * appeal route. A dramatic dead end with no explanation would just be hostile.
 */
export default async function BannedPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (!profile.is_banned) redirect("/feed");

  // Who issued it. The old build showed this and it matters — an appeal is
  // easier to take seriously when there's a name attached.
  let bannedByName: string | null = null;
  if (profile.banned_by) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", profile.banned_by)
      .maybeSingle();
    bannedByName = (data?.username as string) ?? null;
  }

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-12">
      {/*
        The lockdown atmosphere, not a stack of local layers.
        It has to sit at z-0 rather than a negative z-index: `body::before`
        paints the app's blue aurora at -2, so the old -z-20 red wash here was
        painted over and the suspension screen came out navy.
      */}
      <Atmosphere theme="lockdown" />
      <div aria-hidden="true" className="grain-overlay" />

      {/* ── The card ── */}
      <div
        className="relative z-10 w-full max-w-lg"
        style={{ animation: "ban-slam 0.85s cubic-bezier(0.2, 0.9, 0.3, 1.4) both" }}
      >
        {/* Shockwave leaving the card on impact. Fires once. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-5 rounded-[2.25rem] border-2 border-danger/45"
          style={{ animation: "ban-shockwave 1.4s ease-out 0.45s both" }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-5 rounded-[2.25rem] border border-exp/35"
          style={{ animation: "ban-shockwave 1.6s ease-out 0.6s both" }}
        />

        {/* Rotating rim light. An oversized conic gradient spun behind the
            panel — the card's own opaque surface masks everything but a
            travelling sliver at the edge.

            The square is sized off the card's height, not its width: it only
            covers the panel while its inscribed circle clears the corners, and
            on a narrow phone a width-based square leaves them unlit. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px overflow-hidden rounded-[1.6rem] opacity-90"
        >
          <span
            className="absolute left-1/2 top-1/2 aspect-square h-[180%] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, #f43f5e 35deg, #fbbf24 70deg, transparent 120deg, transparent 200deg, #f43f5e 245deg, #ff8fa3 275deg, transparent 330deg)",
              animation: "rim-spin 7s linear infinite",
            }}
          />
        </div>

        <div
          className="relative overflow-hidden rounded-3xl border border-danger/40 bg-[#0e030a]/95 backdrop-blur-xl"
          style={{
            boxShadow:
              "0 0 0 1px rgba(244,63,94,0.25), 0 0 70px -10px rgba(244,63,94,0.75), 0 0 190px -30px rgba(244,63,94,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Hazard band — the stripes kept, at a scale that reads as texture. */}
          <div aria-hidden="true" className="hazard-wash h-1.5 opacity-70" />

          {/* Repeated stamp behind the content. Low enough that it never
              competes with the copy it sits under. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden"
          >
            <div className="-rotate-[18deg] space-y-2 font-display text-[3.4rem] font-extrabold leading-none tracking-[0.12em] whitespace-nowrap text-white/[0.035]">
              <p>SUSPENDED SUSPENDED</p>
              <p className="translate-x-10">SUSPENDED SUSPENDED</p>
              <p>SUSPENDED SUSPENDED</p>
            </div>
          </div>

          {/* HUD corner brackets. */}
          {[
            "left-3 top-5 border-l-2 border-t-2",
            "right-3 top-5 border-r-2 border-t-2",
            "bottom-3 left-3 border-b-2 border-l-2",
            "bottom-3 right-3 border-b-2 border-r-2",
          ].map((corner) => (
            <span
              key={corner}
              aria-hidden="true"
              className={`pointer-events-none absolute h-5 w-5 border-danger/45 ${corner}`}
            />
          ))}

          <div className="relative px-6 py-9 text-center sm:px-9 sm:py-11">
            {/* Shield, ringed and pinned by rotating containment arcs. */}
            <div className="relative mx-auto mb-6 grid h-24 w-24 place-items-center">
              {[0, 1.1].map((delay) => (
                <span
                  key={delay}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full border-2 border-danger/60"
                  style={{ animation: `ban-ring 2.4s ease-out ${delay}s infinite` }}
                />
              ))}
              {/* Two dashed arcs turning against each other — deliberate
                  machinery rather than one spinning element. */}
              <span
                aria-hidden="true"
                className="absolute -inset-3 rounded-full border-2 border-dashed border-danger/35"
                style={{ animation: "dev-spin 14s linear infinite" }}
              />
              <span
                aria-hidden="true"
                className="absolute -inset-1.5 rounded-full border border-dashed border-exp/30"
                style={{ animation: "dev-spin-reverse 9s linear infinite" }}
              />
              <span
                className="relative grid h-24 w-24 place-items-center rounded-full border-2 border-danger/70 bg-danger/12"
                style={{ boxShadow: "0 0 46px -6px rgba(244,63,94,0.9), inset 0 0 30px -8px rgba(244,63,94,0.9)" }}
              >
                <ShieldX className="h-11 w-11 text-danger drop-shadow-[0_0_12px_rgba(244,63,94,0.9)]" />
              </span>
            </div>

            <p className="mb-2 flex items-center justify-center gap-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.32em] text-danger/80">
              <AlertTriangle className="h-3.5 w-3.5" />
              Access revoked
              <AlertTriangle className="h-3.5 w-3.5" />
            </p>

            {/* Headline with a chromatic split. The clones are aria-hidden
                duplicates that only surface for a beat every few seconds — a
                broken-signal tic, not a strobe. */}
            <h1 className="relative font-display text-[2.1rem] font-extrabold leading-none tracking-tight text-danger sm:text-5xl">
              <span
                aria-hidden="true"
                className="absolute inset-0 text-plasma"
                style={{ animation: "ban-glitch-a 7s steps(1, end) infinite", mixBlendMode: "screen" }}
              >
                YOU ARE BANNED
              </span>
              <span
                aria-hidden="true"
                className="absolute inset-0 text-exp"
                style={{ animation: "ban-glitch-b 7s steps(1, end) infinite", mixBlendMode: "screen" }}
              >
                YOU ARE BANNED
              </span>
              <span className="relative" style={{ animation: "ban-flicker 6s ease-in-out infinite" }}>
                YOU ARE BANNED
              </span>
            </h1>

            <p
              className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-rose-100/70"
              style={{ animation: "ban-settle 0.5s ease-out 0.75s both" }}
            >
              <span className="font-semibold text-rose-100">@{profile.username}</span> — your account
              has been suspended. You can&apos;t log in, post, or take part in the community.
            </p>

            {/* ── Reason ── */}
            <div
              className="relative mt-7 overflow-hidden rounded-2xl border border-danger/40 bg-danger/8 text-left"
              style={{ animation: "ban-settle 0.5s ease-out 0.9s both" }}
            >
              {/* Readout line crawling the panel, like something is scanning it. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, transparent, rgba(244,63,94,0.95), transparent)",
                  backgroundSize: "100% 2px",
                  backgroundRepeat: "no-repeat",
                  animation: "ban-scan 5s ease-in-out 1.4s infinite",
                }}
              />
              <p className="flex items-center gap-2 border-b border-danger/25 bg-danger/12 px-4 py-2.5 font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-danger">
                <AlertTriangle className="h-3.5 w-3.5" />
                Reason for ban
              </p>
              <p className="px-4 py-4 text-sm leading-relaxed text-rose-50">
                {profile.ban_reason || "Violated the community guidelines."}
              </p>

              {(profile.banned_at || bannedByName) && (
                <dl className="grid gap-1.5 border-t border-danger/20 px-4 py-3 text-[0.72rem] text-rose-100/55">
                  {profile.banned_at && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      <dt className="sr-only">Suspended on</dt>
                      <dd>Suspended on {formatDate(profile.banned_at)}</dd>
                    </div>
                  )}
                  {bannedByName && (
                    <div className="flex items-center gap-2">
                      <UserCog className="h-3.5 w-3.5 shrink-0" />
                      <dt className="sr-only">Issued by</dt>
                      <dd>Issued by @{bannedByName}</dd>
                    </div>
                  )}
                </dl>
              )}
            </div>

            {/* ── Appeal ── */}
            <div
              className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left"
              style={{ animation: "ban-settle 0.5s ease-out 1.05s both" }}
            >
              <p className="font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-rose-100/60">
                Think this is a mistake?
              </p>
              <a
                href={`mailto:appeals@expoints.app?subject=${encodeURIComponent(`Ban appeal — @${profile.username}`)}`}
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-rose-200 underline decoration-danger/50 underline-offset-4 transition-colors hover:text-white"
              >
                <Mail className="h-3.5 w-3.5" />
                appeals@expoints.app
              </a>
              <p className="mt-1.5 text-xs leading-relaxed text-rose-100/45">
                Include your username. An admin will review it.
              </p>
            </div>

            <form action={signOut} className="mt-7" style={{ animation: "ban-settle 0.5s ease-out 1.2s both" }}>
              <button
                type="submit"
                className="group relative h-12 w-full overflow-hidden rounded-xl font-display text-sm font-bold uppercase tracking-[0.18em] text-white transition-transform hover:-translate-y-0.5 active:translate-y-0"
                style={{
                  background: "linear-gradient(135deg, #f43f5e, #be123c)",
                  boxShadow: "0 12px 34px -10px rgba(244,63,94,0.95), inset 0 1px 0 rgba(255,255,255,0.25)",
                }}
              >
                {/* Sweep on hover. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                />
                <span className="relative">Understood — sign out</span>
              </button>
            </form>
          </div>

          <div aria-hidden="true" className="hazard-wash h-1.5 opacity-70" />
        </div>
      </div>
    </div>
  );
}
