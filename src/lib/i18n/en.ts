/**
 * English — the source dictionary.
 *
 * This object defines the key set. Every other language is typed as
 * `Record<TranslationKey, string>`, so adding a key here and forgetting to
 * translate it is a build error rather than a English string appearing
 * unannounced in the middle of a Filipino page.
 *
 * WHAT IS AND ISN'T IN HERE
 * Interface text only. Reviews, comments, usernames, display names, bios and
 * game titles are what people wrote — running those through a dictionary would
 * be both impossible and rude. They render exactly as typed, in every language.
 */
export const en = {
  /* ── Navigation ── */
  "nav.browse": "Browse",
  "nav.feed": "Feed",
  "nav.feed.hint": "Everything, hot first",
  "nav.trending": "Trending",
  "nav.trending.hint": "Most starred reviews",
  "nav.fresh": "Fresh",
  "nav.fresh.hint": "Straight off the press",
  "nav.games": "Games",
  "nav.games.hint": "Browse the catalogue",
  "nav.ranks": "Ranks",
  "nav.ranks.hint": "Who is climbing",
  "nav.saved": "Saved",
  "nav.saved.hint": "Your reading list",
  "nav.showCards": "Show cards",
  "nav.hideNav": "Hide navigation cards",
  "nav.hideStats": "Hide stat cards",
  "nav.signOut": "Sign out",
  "nav.post": "Post",

  /* ── Header ── */
  "header.searchPlaceholder": "Search a review, a game, anything…",
  "header.searchLabel": "Search reviews",
  "header.settings": "Settings",
  "header.account": "Account menu",

  /* ── Sort tabs ── */
  "sort.hot": "Hot",
  "sort.new": "New",
  "sort.top": "Top",

  /* ── Feed ── */
  "feed.end": "That's everything",
  "feed.end.hint": "You have reached the end of the list.",

  /* ── Right dock ── */
  "rail.yourRun": "Your run",
  "rail.topPlayers": "Top players",
  "rail.mostReviewed": "Most reviewed",
  "rail.reviews": "Reviews",
  "rail.comments": "Comments",
  "rail.stars": "Stars",
  "rail.nobodyYet": "Nobody yet.",
  "rail.fullLeaderboard": "Full leaderboard",
  "rail.browseGames": "Browse all games",

  /* ── Footer ── */
  "footer.tagline":
    "Write reviews. Earn EXP. Climb the ranks. A game forum where having an opinion actually counts for something.",
  "footer.expChip": "Every review earns EXP",
  "footer.about": "About",
  "footer.about.exp": "How EXP works",
  "footer.about.ranks": "The rank ladder",
  "footer.about.features": "What's inside",
  "footer.about.team": "Meet the team",
  "footer.about.discover": "Discover reviews",
  "footer.builtBy": "Built by",
  "footer.getInTouch": "Get in touch",
  "footer.rights": "All rights reserved.",
  "footer.report": "Report a problem",
  "footer.crafted": "Crafted with",
  "footer.by": "by",

  /* ── Settings ── */
  "settings.title": "Settings",
  "settings.memberSince": "Member since",

  "settings.profile": "Profile",
  "settings.profile.noBio": "No bio yet — say something about yourself.",
  "settings.profile.hint":
    "Avatar, banner, display name, handle, bio and your favourite game all live on the profile editor.",

  "settings.account": "Account",
  "settings.email": "Email address",
  "settings.email.verified": "Verified. Used for signing in and for password resets.",
  "settings.email.unverified": "Not verified yet — check your inbox for the confirmation link.",
  "settings.username": "Username",
  "settings.username.hint":
    "Your handle and your profile URL. Changing it breaks old links, so it's edited over on the profile page.",
  "settings.password": "Password",
  "settings.password.hint":
    "We'll email a link to set a new one. Changing it straight from a live session, with nothing proving you own the inbox, is what turns a borrowed laptop into a stolen account.",
  "settings.password.send": "Send reset link",
  "settings.admin": "Moderator access",
  "settings.admin.hint": "You can hide posts, resolve reports and ban accounts.",
  "settings.admin.open": "Admin panel",

  "settings.preferences": "Preferences",
  "settings.language": "Language",
  "settings.language.hint":
    "Translates the interface. Reviews, comments and names stay exactly as people wrote them.",
  "settings.motion": "Reduce motion",
  "settings.motion.hint":
    "Stops animations and background movement across the app. Your system setting already does this — turning it on here forces it regardless.",
  "settings.effects": "Background effects",
  "settings.effects.hint":
    "The embers, starfields and drifting glyphs behind each section. Turning them off leaves a plain dark background and saves a little battery.",
  "settings.defaultSort": "Default feed sort",
  "settings.defaultSort.hint":
    "Which tab the feed opens on. Choosing a sort while browsing still wins for that visit.",

  "settings.dashboard": "Dashboard",
  "settings.navCards": "Navigation cards",
  "settings.navCards.hint":
    "The Browse card down the left of Feed, Trending, Fresh, Games, Ranks and Saved. Turned off, the same links live on the slim rail at the edge of the screen.",
  "settings.statCards": "Stat cards",
  "settings.statCards.hint":
    "Your EXP progress, the leaderboard and the most-reviewed games, down the right. Turned off, they collapse to a tab you can pull back out any time.",

  "settings.notifications": "Notifications",
  "settings.unread": "Unread",
  "settings.unread.some": "Stars, comments and replies you haven't looked at yet.",
  "settings.unread.none": "You're all caught up.",
  "settings.markAllRead": "Mark all read",
  "settings.nothingUnread": "Nothing unread",
  "settings.history": "Notification history",
  "settings.history.hint": "Everything that's happened on your reviews and comments.",
  "settings.open": "Open",

  "settings.session": "Session",
  "settings.signOut.hint":
    "Ends this session on this device. Your reviews, EXP and rank are untouched.",

  "settings.editProfile": "Edit profile",
  "settings.editProfile.hint": "How you show up on every review, comment and leaderboard.",
  "settings.editProfile.viewAs": "View as others",

  /* ── Toasts ── */
  "toast.caughtUp": "All caught up.",
  "toast.saved": "Preference saved.",
  "toast.failed": "Something went wrong.",
} as const;

export type TranslationKey = keyof typeof en;
export type Dictionary = Record<TranslationKey, string>;
