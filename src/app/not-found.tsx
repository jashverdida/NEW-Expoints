import Link from "next/link";
import { Home, Search } from "lucide-react";
import { GlyphField } from "@/components/ui/Glyphs";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4">
      <GlyphField density="normal" />

      <div className="relative z-10 text-center">
        <Logo className="mb-8 text-2xl" />

        <p className="stat font-display text-[5rem] font-extrabold leading-none text-brand-500/25 sm:text-[8rem]">
          404
        </p>

        <h1 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">
          <span className="text-gradient">This page respawned elsewhere</span>
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
          The review, profile or game you were looking for doesn&apos;t exist — or it was removed.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/feed" className="btn-primary inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm">
            <Home className="h-4 w-4" />
            Back to the feed
          </Link>
          <Link href="/games" className="btn-ghost inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm">
            <Search className="h-4 w-4" />
            Browse games
          </Link>
        </div>
      </div>
    </div>
  );
}
