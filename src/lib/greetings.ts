/**
 * Welcome-back lines for the sign-in modal.
 *
 * One is picked at random each time someone signs in, so the greeting is a
 * small surprise rather than a fixed banner people stop reading after a week.
 *
 * Every entry is a nod to a game the audience will recognise — this is a game
 * review forum, and the login screen is the one place we can be openly a fan
 * without getting in the way of the content. The `hail` is the headline and is
 * always followed by the user's handle, so it has to read naturally with a name
 * after it. The `line` carries the joke; `source` credits the game, which is
 * what keeps the whole thing feeling like a reference rather than a stolen
 * tagline.
 */

/** Icon keys, mapped to lucide components by the modal. */
export type GreetingIcon =
  | "sword"
  | "swords"
  | "clock"
  | "zap"
  | "flame"
  | "gamepad"
  | "sun"
  | "cake"
  | "sparkles"
  | "skull"
  | "gavel"
  | "rocket"
  | "trophy"
  | "map"
  | "shield"
  | "heart"
  | "ghost"
  | "megaphone"
  | "star";

export interface Greeting {
  /** Headline. The handle is rendered directly after it. */
  hail: string;
  /** The joke underneath. */
  line: string;
  /** Game being referenced. */
  source: string;
  icon: GreetingIcon;
}

export const GREETINGS: Greeting[] = [
  {
    hail: "Welcome back",
    line: "It's dangerous to go alone — good thing you brought opinions.",
    source: "The Legend of Zelda",
    icon: "sword",
  },
  {
    hail: "Kept you waiting, huh",
    line: "The feed held position until you got back.",
    source: "Metal Gear Solid V",
    icon: "clock",
  },
  {
    hail: "Rise and shine",
    line: "The right player, in the right place, at the right time.",
    source: "Half-Life",
    icon: "zap",
  },
  {
    hail: "Stay awhile and listen",
    line: "Pull up a chair. The community has been talking.",
    source: "Diablo",
    icon: "flame",
  },
  {
    hail: "A challenger appears",
    line: "Round one. Your takes versus everyone else's.",
    source: "Street Fighter II",
    icon: "swords",
  },
  {
    hail: "Player two has joined",
    line: "Co-op mode engaged. Bring snacks and hot takes.",
    source: "Every couch, ever",
    icon: "gamepad",
  },
  {
    hail: "Praise the sun",
    line: "Back in the light, and jolly cooperation is on the table.",
    source: "Dark Souls",
    icon: "sun",
  },
  {
    hail: "The cake is not a lie",
    line: "Testing resumed. This time there is genuinely cake.",
    source: "Portal",
    icon: "cake",
  },
  {
    hail: "Wake up, samurai",
    line: "We've got reviews to post.",
    source: "Cyberpunk 2077",
    icon: "zap",
  },
  {
    hail: "Hey! Listen!",
    line: "Something is kicking off on the front page.",
    source: "Ocarina of Time",
    icon: "sparkles",
  },
  {
    hail: "War never changes",
    line: "The leaderboard, however, changes constantly.",
    source: "Fallout",
    icon: "skull",
  },
  {
    hail: "Objection!",
    line: "Somebody is wrong about a game. Again.",
    source: "Ace Attorney",
    icon: "gavel",
  },
  {
    hail: "Finish him",
    line: "…or just leave a thoughtful review. Your call.",
    source: "Mortal Kombat",
    icon: "swords",
  },
  {
    hail: "Do a barrel roll",
    line: "You've been gone a while. Show off a little.",
    source: "Star Fox 64",
    icon: "rocket",
  },
  {
    hail: "Achievement unlocked",
    line: "Came Back — 10G. Nobody said it had to be hard.",
    source: "Xbox",
    icon: "trophy",
  },
  {
    hail: "Fast travel complete",
    line: "No loading screen, no bandits, no encumbrance.",
    source: "The Elder Scrolls",
    icon: "map",
  },
  {
    hail: "I used to be an adventurer like you",
    line: "Then I took a hiatus from the feed. Don't be me.",
    source: "Skyrim",
    icon: "shield",
  },
  {
    hail: "Another settlement needs your help",
    line: "By which we mean the comments section.",
    source: "Fallout 4",
    icon: "map",
  },
  {
    hail: "Respawn complete",
    line: "Full health, full inventory, zero cooldown.",
    source: "Every shooter since 1996",
    icon: "heart",
  },
  {
    hail: "Would you kindly",
    line: "…scroll a little. A man chooses; a lurker obeys.",
    source: "BioShock",
    icon: "ghost",
  },
  {
    hail: "Fus Ro Dah",
    line: "Shout if you spot a bad take.",
    source: "Skyrim",
    icon: "megaphone",
  },
  {
    hail: "Nothing is true, everything is permitted",
    line: "Except spoilers. Tag your spoilers.",
    source: "Assassin's Creed",
    icon: "ghost",
  },
  {
    hail: "Get over here",
    line: "The feed has been waiting on you.",
    source: "Mortal Kombat",
    icon: "swords",
  },
  {
    hail: "The princess is in another castle",
    line: "But the good posts are right here.",
    source: "Super Mario Bros.",
    icon: "star",
  },
  {
    hail: "Continue? 9… 8… 7…",
    line: "Made it back with seconds left on the clock.",
    source: "Every arcade cabinet",
    icon: "clock",
  },
  {
    hail: "It's super effective",
    line: "Your return, on this community's morale.",
    source: "Pokémon",
    icon: "zap",
  },
  {
    hail: "Snake? Snake!? Snaaake!",
    line: "False alarm — you made it back in one piece.",
    source: "Metal Gear Solid",
    icon: "ghost",
  },
  {
    hail: "GG",
    line: "Well played. Now go and do it again.",
    source: "Every lobby, ever",
    icon: "trophy",
  },
  {
    hail: "You have my sword",
    line: "And the forum has your reviews. Fair trade.",
    source: "Baldur's Gate",
    icon: "sword",
  },
  {
    hail: "Checkpoint reached",
    line: "Progress saved. Nothing you wrote went missing.",
    source: "Literally every game",
    icon: "shield",
  },
];

/**
 * Shown to brand-new accounts instead of a random line.
 *
 * "Welcome back" to someone who has been a member for four seconds is the kind
 * of detail that quietly tells people the app isn't paying attention, so the
 * first run gets its own copy — and it's fixed, not random, because a first
 * impression shouldn't be a dice roll.
 */
export const FIRST_RUN: Greeting = {
  hail: "New game",
  line: "Save file created. Your first review is the tutorial — there's no way to fail it.",
  source: "Every RPG, ever",
  icon: "sparkles",
};

/** Keyed so a fresh pick can avoid repeating the last one. */
const LAST_KEY = "expoints:last-greeting";

/**
 * A greeting the user didn't just see.
 *
 * Two sign-ins in a row landing on the same line is the one thing that makes a
 * rotating message feel broken rather than random, so the previous hail is
 * remembered and excluded. Storage failures (private mode, blocked cookies)
 * fall through to a plain random pick — never worth throwing over.
 */
export function pickGreeting(): Greeting {
  let last: string | null = null;
  try {
    last = window.localStorage.getItem(LAST_KEY);
  } catch {
    /* storage unavailable — a repeat is an acceptable outcome */
  }

  const pool = GREETINGS.filter((g) => g.hail !== last);
  const chosen = pool[Math.floor(Math.random() * pool.length)] ?? GREETINGS[0];

  try {
    window.localStorage.setItem(LAST_KEY, chosen.hail);
  } catch {
    /* see above */
  }

  return chosen;
}

/**
 * Whether to print a comma between the hail and the handle.
 *
 * "Welcome back, @jash" wants one; "Objection!, @jash" very much does not.
 */
export function hailNeedsComma(hail: string): boolean {
  return !/[!?.…]$/.test(hail);
}
