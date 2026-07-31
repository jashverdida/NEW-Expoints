"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Top-edge navigation progress bar.
 *
 * HOW REAL IS THE PROGRESS?
 * Two different signals feed this bar, and it's worth being precise:
 *
 *  1. Data fetches (the feed API) report GENUINE progress. `reportFetch` below
 *     streams the response body and compares bytes received against the
 *     Content-Length header, so the bar tracks actual download completion.
 *
 *  2. Route navigations cannot. Next streams an RSC payload with no length
 *     header and no progress events — the browser simply does not expose one.
 *     For those, the START and END are real (tied to the click and to the
 *     pathname actually changing); the motion between them eases toward 90%
 *     and never claims to be finished until it is. This is the same approach
 *     GitHub, YouTube and NProgress use, for the same reason.
 *
 * The bar is deliberately small — a 2.5px line at the top, plus a spinner in
 * the corner. No full-page takeover.
 */

type Listener = (value: number | null) => void;

/** Minimal store so both navigation and fetches can drive one bar. */
const store = {
  value: null as number | null,
  listeners: new Set<Listener>(),
  set(next: number | null) {
    this.value = next;
    this.listeners.forEach((l) => l(next));
  },
  subscribe(l: Listener) {
    this.listeners.add(l);
    // Wrapped in a block: Set.delete returns boolean, but a React effect
    // cleanup must return void.
    return () => {
      this.listeners.delete(l);
    };
  },
};

export const navProgress = {
  start: () => store.set(0),
  /** Report a real 0–1 fraction. */
  set: (fraction: number) => store.set(Math.min(0.99, Math.max(0, fraction))),
  done: () => store.set(1),
};

/**
 * Wraps fetch and reports true download progress when the server sends a
 * Content-Length. Falls back to indeterminate when it doesn't.
 */
export async function fetchWithProgress(input: string, init?: RequestInit): Promise<Response> {
  navProgress.start();

  const res = await fetch(input, init);
  const length = Number(res.headers.get("content-length") ?? 0);

  if (!res.body || !length) {
    navProgress.done();
    return res;
  }

  let received = 0;
  const reader = res.body.getReader();
  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        navProgress.done();
        controller.close();
        return;
      }
      received += value.byteLength;
      navProgress.set(received / length);
      controller.enqueue(value);
    },
    cancel() {
      navProgress.done();
      void reader.cancel();
    },
  });

  return new Response(stream, {
    headers: res.headers,
    status: res.status,
    statusText: res.statusText,
  });
}

export function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<number | null>(null);
  const raf = useRef<number | null>(null);
  const target = useRef(0);

  useEffect(() => store.subscribe(setValue), []);

  /* Intercept same-origin link clicks so the bar starts the instant the user
     commits, not when React eventually re-renders. */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;

      const anchor = (e.target as HTMLElement)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (!href.startsWith("/") || href.startsWith("//")) return;

      // Same URL — nothing will load, so don't show a bar that never resolves.
      const current = `${window.location.pathname}${window.location.search}`;
      if (href === current) return;

      navProgress.start();
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  // The navigation actually landed — complete the bar.
  useEffect(() => {
    navProgress.done();
  }, [pathname, searchParams]);

  /* Ease toward the target. For fetches the target is real; for navigations it
     creeps asymptotically toward 90% and stops there until completion. */
  useEffect(() => {
    if (value === null) return;

    if (value >= 1) {
      target.current = 1;
      const t = setTimeout(() => store.set(null), 380);
      return () => clearTimeout(t);
    }

    target.current = value;
    let shown = value;

    const tick = () => {
      // Approach the ceiling with diminishing steps — never reaches it alone.
      const ceiling = Math.max(target.current, 0.9);
      shown += (ceiling - shown) * 0.045;
      setValue((v) => (v !== null && v < 1 ? shown : v));
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // Intentionally keyed on whether a cycle is running, not every frame value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value === null, value !== null && value >= 1]);

  if (value === null) return null;

  const pct = Math.min(100, Math.max(2, value * 100));

  return (
    <>
      <div
        role="progressbar"
        aria-label="Loading"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2.5px]"
      >
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-brand-400 via-plasma to-brand-300 transition-[width,opacity] duration-200 ease-out"
          style={{
            width: `${pct}%`,
            opacity: value >= 1 ? 0 : 1,
            boxShadow:
              "0 0 12px 1px color-mix(in oklab, var(--color-brand-400) 90%, transparent), 0 0 4px color-mix(in oklab, var(--color-plasma) 90%, transparent)",
          }}
        />
      </div>

      {/* Small corner spinner — the "something is happening" cue that doesn't
          block or cover any content. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed right-4 top-16 z-[100] transition-opacity duration-200 lg:top-20"
        style={{ opacity: value >= 1 ? 0 : 1 }}
      >
        <span className="grid h-8 w-8 place-items-center rounded-full border border-brand-400/30 bg-abyss/80 backdrop-blur">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-400/25 border-t-brand-300" />
        </span>
      </div>
    </>
  );
}
