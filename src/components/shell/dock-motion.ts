import type { Transition, Variants } from "framer-motion";

/**
 * One motion vocabulary for both docks, so hiding the left column and hiding
 * the right column feel like the same gesture mirrored — which is the whole
 * point of making them symmetric.
 *
 * Numbers match the CSS tokens in globals.css (`--ease-out-expo`) rather than
 * inventing a second easing curve for JS-driven animation.
 */
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Leaving is quicker than arriving — a dismissal should feel decisive. */
const EASE_IN_QUINT = [0.64, 0, 0.78, 0] as const;

export const DOCK_IN: Transition = { duration: 0.5, ease: EASE_OUT_EXPO };
export const DOCK_OUT: Transition = { duration: 0.3, ease: EASE_IN_QUINT };

/**
 * Column variants. `x` is signed per side: the left column leaves to the left,
 * the right to the right, so each dock exits toward the edge it came from.
 *
 * The cards deal themselves in one after another on the way in, and peel off
 * back-to-front on the way out (`staggerDirection: -1`) — the card nearest the
 * edge goes first, so the column looks like it's being pulled out sideways.
 */
export function dockColumn(direction: -1 | 1): Variants {
  const offset = 34 * direction;

  return {
    hidden: { opacity: 0, x: offset, scale: 0.97 },
    shown: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { ...DOCK_IN, staggerChildren: 0.06, delayChildren: 0.05 },
    },
    gone: {
      opacity: 0,
      x: offset,
      scale: 0.97,
      transition: { ...DOCK_OUT, staggerChildren: 0.035, staggerDirection: -1 },
    },
  };
}

/** Applied to each card in a column, and to each row inside the nav card. */
export function dockItem(direction: -1 | 1): Variants {
  const offset = 18 * direction;

  return {
    hidden: { opacity: 0, x: offset },
    shown: { opacity: 1, x: 0, transition: DOCK_IN },
    gone: { opacity: 0, x: offset, transition: DOCK_OUT },
  };
}

/**
 * Collapses every duration to zero when the OS asks for reduced motion. The
 * state change still happens instantly — only the travel is removed.
 */
export const NO_MOTION: Transition = { duration: 0 };
