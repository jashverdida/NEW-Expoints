"use client";

import { useSyncExternalStore } from "react";

/**
 * Client-side overlay for the viewer's own stars and bookmarks.
 *
 * WHY THIS EXISTS — the "star un-fills itself" bug
 * ────────────────────────────────────────────────
 * Star and bookmark buttons previously used `useOptimistic`. That hook shows
 * an optimistic value ONLY for the duration of the transition; the moment the
 * server action resolves, React discards it and falls back to the props it was
 * given. It is built on the assumption that by then the server has sent back
 * fresh data.
 *
 * On the feed that assumption never held, for two reasons:
 *
 *   1. `togglePostStar` revalidated `/post/[id]` — the detail page — while the
 *      user was on `/feed`. Nothing about the current route was refreshed.
 *
 *   2. Even with the right path, it wouldn't have helped: FeedClient holds the
 *      post list in `useState(initial)`, which ignores later prop changes, and
 *      keeps its own `(sort, page)` cache. The server's snapshot is taken once
 *      at mount; after that the client owns the list.
 *
 * So the write succeeded, the props never changed, the transition ended, and
 * the icon snapped back to its original state. Reloading showed the truth —
 * exactly the reported symptom.
 *
 * THE FIX
 * The server render is a snapshot; the viewer's own interactions are overlaid
 * on top of it from here. This store is module-level, so it survives component
 * remounts — switching sort tabs and back no longer resurrects stale state
 * from FeedClient's cache, which was a second, quieter version of the same bug.
 *
 * It intentionally resets on a full page reload, at which point the server
 * snapshot is authoritative again.
 */

export interface StarOverride {
  starred: boolean;
  count: number;
}

const stars = new Map<string, StarOverride>();
const bookmarks = new Map<string, boolean>();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** `post:12` / `comment:34` — kind is included so IDs can't collide. */
export function interactionKey(kind: "post" | "comment", id: number) {
  return `${kind}:${id}`;
}

/** Pass null to drop the override and fall back to the server snapshot. */
export function setStarOverride(key: string, next: StarOverride | null) {
  if (next === null) stars.delete(key);
  else stars.set(key, next);
  emit();
}

export function setBookmarkOverride(key: string, next: boolean | null) {
  if (next === null) bookmarks.delete(key);
  else bookmarks.set(key, next);
  emit();
}

/*
 * getSnapshot must return a referentially stable value between changes, or
 * useSyncExternalStore will loop. Map.get satisfies that: entries are replaced
 * wholesale on write, never mutated in place.
 */
export function useStarOverride(key: string): StarOverride | undefined {
  return useSyncExternalStore(
    subscribe,
    () => stars.get(key),
    () => undefined, // server render has no overrides
  );
}

export function useBookmarkOverride(key: string): boolean | undefined {
  return useSyncExternalStore(
    subscribe,
    () => bookmarks.get(key),
    () => undefined,
  );
}
