"use client";

import { useDock } from "@/components/shell/DockProvider";
import { useT } from "@/components/shell/PrefsProvider";
import { SettingRow } from "@/components/settings/SettingRow";
import { Switch } from "@/components/settings/Switch";

/**
 * The dashboard column preferences, surfaced properly.
 *
 * These were already real and already persisted — they're the same cookie the
 * hide/show controls on the docks themselves write. Until now the only way to
 * find them was to notice a small icon in a card header, which is a fine
 * shortcut and a poor discovery path. Settings is where someone goes looking
 * for "can I turn that off", so they belong here too.
 *
 * Both switches commit the moment they're flipped; there's no save button
 * because there's nothing to save — the layout re-renders under you.
 */
export function DashboardSettings() {
  const { open, toggle } = useDock();
  const t = useT();

  return (
    <>
      <SettingRow
        label={t("settings.navCards")}
        hint={t("settings.navCards.hint")}
        control={
          <Switch
            checked={open.left}
            onChange={() => toggle("left")}
            label={t("settings.navCards")}
          />
        }
      />

      <SettingRow
        label={t("settings.statCards")}
        hint={t("settings.statCards.hint")}
        control={
          <Switch
            checked={open.right}
            onChange={() => toggle("right")}
            label={t("settings.statCards")}
          />
        }
      />
    </>
  );
}
