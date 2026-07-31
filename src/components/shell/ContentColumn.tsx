import { cn } from "@/lib/utils";

/**
 * The page container for a docked route.
 *
 * WHY IT TAKES `docked` RATHER THAN WORKING IT OUT
 * Four of the docked routes are publicly readable, so being on one of them
 * doesn't mean there's a signed-in user — and the docks only render for
 * members. A guest reading /games or /leaderboard has no nav card beside them,
 * so reserving a lane for one would just squeeze the page for nothing.
 *
 * Every one of these pages already has the viewer in hand, which is why the
 * answer is passed in. The alternative was teaching the app shell to await the
 * profile query, and that's the thing the layout is built specifically to avoid
 * — it would stall every page's loading state to answer a layout question.
 *
 * `variant` picks which measure the column follows: "reading" for a column of
 * posts, "grid" for the game catalogue, which has no line length to protect and
 * looks starved at reading width.
 */
export function ContentColumn({
  docked,
  variant = "reading",
  className,
  children,
}: {
  docked: boolean;
  variant?: "reading" | "grid";
  className?: string;
  children: React.ReactNode;
}) {
  const grid = variant === "grid";

  return (
    <div
      className={cn(
        "px-4 py-6 sm:px-6",
        docked
          ? grid
            ? "content-column-grid"
            : "content-column"
          : grid
            ? "mx-auto w-full max-w-6xl"
            : "mx-auto w-full max-w-3xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
