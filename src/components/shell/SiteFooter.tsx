import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Flag, Heart, Mail } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { GlyphField } from "@/components/ui/Glyphs";
import { getT } from "@/lib/i18n/server";

/** The studio behind EXPoints. */
const VERPTO_URL = "https://jae-two.vercel.app/";

const TEAM = [
  { name: "Jashmine Verdida", role: "Frontend & QA", email: "JashmineVerdida08@gmail.com" },
  { name: "Eijay Pepito", role: "Backend & Database", email: "eijay.pepito8@gmail.com" },
  { name: "Lord Christian Beligaño", role: "AI & Systems", email: "lordchristian88@gmail.com" },
];

/**
 * What a footer is actually for: explaining the thing, not re-listing the nav.
 *
 * These all point at sections that genuinely exist — the four anchors live on
 * the landing page, and /discover is a real route. Nothing here is a link to a
 * page someone still has to write.
 */
const ABOUT_LINKS = [
  { href: "/#exp", labelKey: "footer.about.exp" as const },
  { href: "/#ranks", labelKey: "footer.about.ranks" as const },
  { href: "/#features", labelKey: "footer.about.features" as const },
  { href: "/#team", labelKey: "footer.about.team" as const },
  { href: "/discover", labelKey: "footer.about.discover" as const },
];

/**
 * The site footer.
 *
 * Replaces a single centred row of four links, which was doing none of the jobs
 * a footer exists for: it didn't say what the site is, didn't help anyone get
 * anywhere, and didn't credit the people who built it.
 *
 * WHY THERE IS NO NAVIGATION COLUMN
 * There was one, and it was the wrong instinct — a footer full of the same six
 * destinations already sitting in the nav card, the rail and the mobile tab bar
 * is furniture, not help. A footer's real job is the things that have nowhere
 * else to live: what the product is, how it works, who made it, how to reach
 * them and how to report a problem. So the middle column explains the forum
 * instead of pointing back into it.
 *
 * Everything it links to already exists. Privacy and Terms would be the
 * conventional additions here, and they're deliberately absent rather than
 * stubbed — a footer link to a page nobody has written is worse than no link.
 *
 * Themed for free: every colour here comes from the brand ramp, so the footer
 * under Ranks is gold and the one under Trending is ember. See globals.css.
 */
export async function SiteFooter() {
  const t = await getT();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer mt-14 overflow-hidden">
      {/* The house motif, very low density — texture behind the columns rather
          than anything anyone should notice. */}
      <GlyphField density="ambient" edgeBias className="opacity-40" />

      {/* Bottom padding clears the mobile tab bar, which is fixed over this. */}
      <div className="footer-inner relative px-5 pb-28 pt-12 sm:px-8 lg:pb-12">
        {/*
          Four columns, not three.

          Height is the thing worth spending width on here — squeezed into a
          narrow strip this ran to about 600px of mostly empty space, with the
          team stacked in one tall column and the tagline wrapping to four
          lines. Splitting the studio away from the people who work there gives
          every column roughly the same height, so the band is as short as its
          tallest item rather than as tall as everything piled up.
        */}
        <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr_1fr_1.15fr]">
          {/* ── Who this is ── */}
          <div>
            <Logo className="text-xl" showSpark />

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
              {t("footer.tagline")}

            </p>

            <p className="mt-5 inline-flex items-center gap-2 rounded-pill border border-exp/25 bg-exp/8 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-exp">
              <span aria-hidden="true">✦</span>
              {t("footer.expChip")}
            </p>
          </div>

          {/* ── What this place is ── */}
          <nav aria-labelledby="footer-about">
            <h2 id="footer-about" className="rule-label mb-4">
              {t("footer.about")}
            </h2>
            <ul className="space-y-2.5">
              {ABOUT_LINKS.map(({ href, labelKey }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group/link inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
                  >
                    <span className="relative">
                      {t(labelKey)}
                      {/* Underline that draws in from the left on hover. */}
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-0.5 left-0 h-px w-0 bg-brand-300 transition-[width] duration-300 ease-[var(--ease-out-expo)] group-hover/link:w-full"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── The studio ── */}
          <div>
            <h2 className="rule-label mb-4">{t("footer.builtBy")}</h2>

            <a
              href={VERPTO_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="glass card-interactive group/verpto block rounded-2xl p-4"
            >
              <Image
                src="/brand/verpto-wordmark.png"
                alt="VERPTO"
                width={440}
                height={93}
                className="h-8 w-auto"
              />
              <span className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand-300 transition-colors group-hover/verpto:text-brand-200">
                jae-two.vercel.app
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/verpto:-translate-y-0.5 group-hover/verpto:translate-x-0.5" />
              </span>
            </a>
          </div>

          {/* ── The people ──
              Roles earn their place: with three names and no context this reads
              as an undifferentiated list of strangers. */}
          <div>
            <h2 className="rule-label mb-4">{t("footer.getInTouch")}</h2>

            <ul className="space-y-3">
              {TEAM.map(({ name, role, email }) => (
                <li key={email}>
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-semibold text-ink">{name}</span>
                    <span className="text-[0.66rem] uppercase tracking-widest text-ink-faint">
                      {role}
                    </span>
                  </p>
                  <a
                    href={`mailto:${email}`}
                    className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-ink-faint transition-colors hover:text-brand-300"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="break-all">{email}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-6 text-xs text-ink-faint sm:flex-row">
          <p>© {year} EXPoints. {t("footer.rights")}</p>

          {/* Support lives in the bottom bar rather than in a column of its own
              — it's one link, and this is where people look for it. */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link
              href="/report"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
            >
              <Flag className="h-3.5 w-3.5" />
              {t("footer.report")}
            </Link>

            <p className="flex items-center gap-1.5">
              {t("footer.crafted")}
              <Heart className="h-3.5 w-3.5 fill-danger text-danger" aria-label="love" />
              {t("footer.by")}
              <a
                href={VERPTO_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold text-ink-muted transition-colors hover:text-brand-300"
              >
                VERPTO
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
