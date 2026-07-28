import { FeedSkeleton } from "@/components/feed/FeedSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6" aria-busy="true">
      <FeedSkeleton count={3} />
    </div>
  );
}
