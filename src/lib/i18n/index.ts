import { en, type Dictionary, type TranslationKey } from "@/lib/i18n/en";
import { fil } from "@/lib/i18n/fil";
import { es } from "@/lib/i18n/es";
import type { Locale } from "@/lib/prefs";

export type { Dictionary, TranslationKey };

export const DICTIONARIES: Record<Locale, Dictionary> = { en, fil, es };

/** A lookup bound to one language. */
export type Translate = (key: TranslationKey) => string;

/**
 * Builds the `t` used everywhere.
 *
 * Falls back to English for a key the chosen dictionary somehow lacks, which
 * TypeScript should already have prevented — but a missing string should
 * degrade to a readable word rather than render the raw key at someone.
 */
export function makeT(locale: Locale): Translate {
  const dict = DICTIONARIES[locale] ?? en;
  return (key) => dict[key] ?? en[key] ?? key;
}

/** Adding a language: write the dictionary, add it to LOCALES and to the map. */
export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "fil" || value === "es";
}
