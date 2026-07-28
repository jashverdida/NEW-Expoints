import { BrandedLoader } from "@/components/ui/BrandedLoader";

/**
 * First-paint state for the landing page, which runs four parallel database
 * queries (stats, games, top players, session). Without this the browser shows
 * nothing until they all resolve.
 */
export default function Loading() {
  return <BrandedLoader label="Loading EXPoints" />;
}
