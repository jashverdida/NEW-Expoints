"use client";

import { Languages } from "lucide-react";
import { usePrefs } from "@/components/shell/PrefsProvider";
import { Choice, Segments } from "@/components/settings/Choice";
import { SettingRow } from "@/components/settings/SettingRow";
import { Switch } from "@/components/settings/Switch";
import { LOCALES, LOCALE_LABELS } from "@/lib/prefs";

/**
 * Language, motion, background effects and where the feed opens.
 *
 * All four are cookie-backed and all four take effect immediately — language
 * and default sort by re-rendering from the server, motion and effects through
 * CSS hanging off the attributes PrefsProvider publishes. Nothing here is a
 * switch that only remembers itself.
 */
export function PreferenceSettings() {
  const { locale, motion, effects, feedSort, set, t } = usePrefs();

  return (
    <>
      <SettingRow
        label={t("settings.language")}
        hint={t("settings.language.hint")}
        control={
          <Choice
            label={t("settings.language")}
            value={locale}
            onChange={(next) => set("locale", next)}
            icon={<Languages className="h-4 w-4" />}
            options={LOCALES.map((code) => ({ value: code, label: LOCALE_LABELS[code] }))}
          />
        }
      />

      <SettingRow
        label={t("settings.defaultSort")}
        hint={t("settings.defaultSort.hint")}
        control={
          <Segments
            label={t("settings.defaultSort")}
            value={feedSort}
            onChange={(next) => set("feedSort", next)}
            options={[
              { value: "hot", label: t("sort.hot") },
              { value: "new", label: t("sort.new") },
              { value: "top", label: t("sort.top") },
            ]}
          />
        }
      />

      <SettingRow
        label={t("settings.motion")}
        hint={t("settings.motion.hint")}
        control={
          <Switch
            checked={motion === "reduced"}
            onChange={(on) => set("motion", on ? "reduced" : "full")}
            label={t("settings.motion")}
          />
        }
      />

      <SettingRow
        label={t("settings.effects")}
        hint={t("settings.effects.hint")}
        control={
          <Switch
            checked={effects === "on"}
            onChange={(on) => set("effects", on ? "on" : "off")}
            label={t("settings.effects")}
          />
        }
      />
    </>
  );
}
