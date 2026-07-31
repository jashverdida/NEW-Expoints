import { PrefsProvider } from "@/components/shell/PrefsProvider";
import { getPrefs } from "@/lib/i18n/server";

/**
 * Reads the saved preferences and hands them to the client provider.
 *
 * Same shape and the same justification as DockShell: it awaits a cookie parse,
 * not a database round trip, so it settles in the same tick and nothing
 * downstream is left waiting on the network.
 */
export async function PrefsShell({ children }: { children: React.ReactNode }) {
  const prefs = await getPrefs();
  return <PrefsProvider initial={prefs}>{children}</PrefsProvider>;
}
