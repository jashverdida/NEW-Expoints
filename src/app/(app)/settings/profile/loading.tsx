import { FeedSkeleton } from "@/components/feed/FeedSkeleton";

/**
 * Streamed immediately when navigation to this route begins, so the click gets
 * visible feedback instead of the browser holding on the previous page for the
 * whole server round trip.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6" aria-busy="true">
      <FeedSkeleton count={3} />
    </div>
  );
}
