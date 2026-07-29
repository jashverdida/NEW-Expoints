import { FeedSkeleton } from "@/components/feed/FeedSkeleton";

/**
 * Fallback for the whole (app) segment.
 *
 * Individual routes have their own loading.tsx and take precedence; this
 * catches anything entering the group that doesn't, so navigation into the app
 * always shows something immediately rather than hanging on the previous page.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6" aria-busy="true">
      <FeedSkeleton count={3} />
    </div>
  );
}
