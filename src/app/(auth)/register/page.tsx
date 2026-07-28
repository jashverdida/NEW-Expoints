import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Star, Trophy } from "lucide-react";
import { RegisterForm } from "@/components/auth/AuthForm";
import { EXP_REWARDS } from "@/lib/exp";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Join EXPoints, post your first review and start earning EXP.",
};

/* Shows new users exactly how the economy works before they commit. The old
   signup flow explained none of this. */
const EARN_ROWS = [
  { icon: MessageSquare, label: "Post a review", exp: EXP_REWARDS.post_created },
  { icon: MessageSquare, label: "Leave a comment", exp: EXP_REWARDS.comment_created },
  { icon: Star, label: "Someone stars your review", exp: EXP_REWARDS.post_star_received },
  { icon: Trophy, label: "Someone stars your comment", exp: EXP_REWARDS.comment_star_received },
];

export default function RegisterPage() {
  return (
    <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="order-2 w-full lg:order-1">
        <div className="mb-7 text-center lg:text-left">
          <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            <span className="text-gradient">Register and start grinding.</span>
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Everyone starts at Level 1. What you do next is up to you.
          </p>
        </div>

        <div className="glass-strong animate-rise rounded-3xl p-6 sm:p-8">
          <div className="mb-6 flex justify-center lg:hidden">
            <Logo className="text-2xl" />
          </div>

          <RegisterForm />

          <p className="mt-6 text-center text-sm text-ink-faint">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-300 hover:text-brand-200">
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* EXP primer — the pitch, sitting right next to the form. */}
      <aside className="order-1 lg:order-2 lg:sticky lg:top-8">
        <div className="glass rounded-3xl p-6">
          <h2 className="rule-label mb-4">How EXP works</h2>

          <ul className="space-y-3">
            {EARN_ROWS.map(({ icon: Icon, label, exp }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-400/25">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm text-ink-muted">{label}</span>
                <span className="stat shrink-0 text-sm font-bold text-exp">+{exp}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-white/10 pt-5">
            <p className="text-sm leading-relaxed text-ink-muted">
              EXP raises your level. Higher levels push your reviews toward the front of the
              dashboard, unlock profile perks and put you on the leaderboard.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
