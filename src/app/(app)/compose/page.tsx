import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { Composer } from "@/components/compose/Composer";
import { getGames } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Write a review",
  description: "Post a game review and earn EXP.",
};

const TIPS = [
  "Say what you played on and how far you got — it's what makes a review trustworthy.",
  "Lead with your actual opinion. Plot summaries put people to sleep.",
  "Be specific about what didn't work. \"Bad\" tells nobody anything.",
  "Your score is a verdict, not a grade. A 7 is genuinely good.",
];

export default async function ComposePage() {
  const games = await getGames();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link
        href="/feed"
        className="group mb-5 inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to feed
      </Link>

      <header className="mb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span className="text-gradient">Write a review</span>
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Say something worth reading. The community decides the rest.
        </p>
      </header>

      <Composer games={games} />

      <aside className="glass mt-5 rounded-3xl p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-ink-muted">
          <Lightbulb className="h-4 w-4 text-exp" />
          Reviews that get starred
        </h2>
        <ul className="space-y-2">
          {TIPS.map((tip) => (
            <li key={tip} className="flex gap-2.5 text-sm leading-relaxed text-ink-muted">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
              {tip}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
