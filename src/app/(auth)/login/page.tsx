import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/AuthForm";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log back into EXPoints and pick up where you left off.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next?.startsWith("/") ? next : "/feed";

  return (
    <div className="w-full max-w-md">
      <div className="mb-7 text-center">
        <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          <span className="text-gradient">Welcome back, gamer.</span>
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Your EXP is exactly where you left it.
        </p>
      </div>

      <div className="glass-strong animate-rise rounded-3xl p-6 sm:p-8">
        <div className="mb-6 flex justify-center">
          <Logo className="text-2xl" />
        </div>

        <LoginForm next={target} />

        <div className="mt-6 space-y-3 text-center text-sm">
          <Link
            href="/forgot-password"
            className="block text-ink-muted transition-colors hover:text-brand-300"
          >
            Forgot your password?
          </Link>
          <p className="text-ink-faint">
            New here?{" "}
            <Link href="/register" className="font-semibold text-brand-300 hover:text-brand-200">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-ink-faint">
        Just browsing?{" "}
        <Link href="/discover" className="text-brand-300 hover:text-brand-200">
          Read reviews without an account →
        </Link>
      </p>
    </div>
  );
}
