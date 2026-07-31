"use client";

import { useDock } from "@/components/shell/DockProvider";
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

  return (
    <>
      <SettingRow
        label="Navigation cards"
        hint="The Browse card down the left of Feed, Trending, Fresh, Games, Ranks and Saved. Turned off, the same links live on the slim rail at the edge of the screen."
        control={
          <Switch
            checked={open.left}
            onChange={() => toggle("left")}
            label="Show navigation cards"
          />
        }
      />

      <SettingRow
        label="Stat cards"
        hint="Your EXP progress, the leaderboard and the most-reviewed games, down the right. Turned off, they collapse to a tab you can pull back out any time."
        control={
          <Switch checked={open.right} onChange={() => toggle("right")} label="Show stat cards" />
        }
      />
    </>
  );
}
