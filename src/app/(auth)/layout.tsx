import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GlyphField } from "@/components/ui/Glyphs";
import { Logo } from "@/components/ui/Logo";

/** Shared chrome for /login and /register. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <GlyphField density="normal" className="opacity-75" />
      <div className="grain-overlay" aria-hidden="true" />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back
        </Link>
        <Link href="/" aria-label="EXPoints home">
          <Logo className="text-xl" />
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-14 pt-2 sm:px-6">
        {children}
      </main>
    </div>
  );
}
