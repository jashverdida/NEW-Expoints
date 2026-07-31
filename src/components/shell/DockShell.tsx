import { cookies } from "next/headers";
import { DockProvider } from "@/components/shell/DockProvider";
import { DOCK_COOKIE, DOCK_DEFAULT, type DockOpenState, type DockSide } from "@/lib/dock";

/**
 * Reads the saved dock preference and hands it to the client provider.
 *
 * This is the one thing the app layout awaits. That layout is documented as
 * "must not await anything", and the reason is real — awaiting the Supabase
 * queries there stalled every page's loading state. `cookies()` is a different
 * animal: it resolves out of the already-parsed request with no I/O, so it
 * settles in the same tick and nothing downstream waits on a network hop.
 *
 * These routes are all dynamic already (every one of them reads the session
 * cookie), so this costs no static rendering either.
 */
export async function DockShell({ children }: { children: React.ReactNode }) {
  const store = await cookies();

  /**
   * Only an explicit "closed" hides a column. No cookie, a half-written one, a
   * value from some future version of this — all of it falls through to
   * DOCK_DEFAULT, which shows the cards. Nobody should land on a stripped-back
   * dashboard because a cookie went strange.
   */
  const saved = (side: DockSide) => {
    const value = store.get(DOCK_COOKIE[side])?.value;
    if (value === "open") return true;
    if (value === "closed") return false;
    return DOCK_DEFAULT[side];
  };

  const initial: DockOpenState = { left: saved("left"), right: saved("right") };

  return <DockProvider initial={initial}>{children}</DockProvider>;
}
