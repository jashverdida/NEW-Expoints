import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { makeT, type Translate } from "@/lib/i18n";
import { parsePrefs, type Prefs } from "@/lib/prefs";

/**
 * Preferences and translation for server components.
 *
 * `cache()` dedupes per request, so a page, its layout and half a dozen
 * components can each ask for `t` and only one cookie parse happens.
 *
 * Reading cookies makes a route dynamic. Everything that calls this is already
 * dynamic — these routes all read the session — so it costs no static
 * rendering. The landing page is the one exception worth watching: it renders
 * per request anyway because it swaps its call to action on the session.
 */
export const getPrefs = cache(async (): Promise<Prefs> => {
  const store = await cookies();
  return parsePrefs((name) => store.get(name)?.value);
});

export const getT = cache(async (): Promise<Translate> => {
  const { locale } = await getPrefs();
  return makeT(locale);
});
