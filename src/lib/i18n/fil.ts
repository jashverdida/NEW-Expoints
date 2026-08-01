import type { Dictionary } from "@/lib/i18n/en";

/**
 * Filipino.
 *
 * Gaming vocabulary stays in English on purpose — "review", "level", "EXP",
 * "star" are what Filipino players actually say, and inventing Tagalog
 * equivalents would read as stilted rather than localised. What's translated is
 * the connective interface language around them.
 */
export const fil: Dictionary = {
  /* ── Navigation ── */
  "nav.browse": "Tuklasin",
  "nav.feed": "Feed",
  "nav.feed.hint": "Lahat, mainit muna",
  "nav.trending": "Trending",
  "nav.trending.hint": "Pinakamaraming star",
  "nav.fresh": "Bago",
  "nav.fresh.hint": "Kababago lang",
  "nav.games": "Games",
  "nav.games.hint": "Tingnan ang katalogo",
  "nav.ranks": "Ranggo",
  "nav.ranks.hint": "Sino ang umaakyat",
  "nav.saved": "Nakasave",
  "nav.saved.hint": "Ang babasahin mo",
  "nav.showCards": "Ipakita ang cards",
  "nav.hideNav": "Itago ang navigation cards",
  "nav.hideStats": "Itago ang stat cards",
  "nav.signOut": "Mag-sign out",
  "nav.post": "Mag-post",

  /* ── Header ── */
  "header.searchPlaceholder": "Maghanap ng review, laro, kahit ano…",
  "header.searchLabel": "Maghanap ng review",
  "header.settings": "Mga setting",
  "header.account": "Menu ng account",

  /* ── Sort tabs ── */
  "sort.hot": "Mainit",
  "sort.new": "Bago",
  "sort.top": "Tuktok",

  /* ── Feed ── */
  "feed.end": "Iyon na ang lahat",
  "feed.end.hint": "Narating mo na ang dulo ng listahan.",

  /* ── Right dock ── */
  "rail.yourRun": "Progreso mo",
  "rail.topPlayers": "Nangungunang players",
  "rail.mostReviewed": "Pinakamaraming review",
  "rail.reviews": "Reviews",
  "rail.comments": "Komento",
  "rail.stars": "Stars",
  "rail.nobodyYet": "Wala pa.",
  "rail.fullLeaderboard": "Buong leaderboard",
  "rail.browseGames": "Lahat ng laro",

  /* ── Footer ── */
  "footer.tagline":
    "Magsulat ng review. Kumita ng EXP. Umakyat sa ranggo. Isang forum ng laro kung saan may halaga ang opinyon mo.",
  "footer.expChip": "May EXP ang bawat review",
  "footer.about": "Tungkol dito",
  "footer.about.exp": "Paano gumagana ang EXP",
  "footer.about.ranks": "Ang hagdan ng ranggo",
  "footer.about.features": "Ano ang laman",
  "footer.about.team": "Kilalanin ang team",
  "footer.about.discover": "Tuklasin ang mga review",
  "footer.builtBy": "Ginawa ng",
  "footer.getInTouch": "Makipag-ugnayan",
  "footer.rights": "Nakalaan ang lahat ng karapatan.",
  "footer.report": "Mag-report ng problema",
  "footer.crafted": "Ginawa nang may",
  "footer.by": "ng",

  /* ── Settings ── */
  "settings.title": "Mga setting",
  "settings.memberSince": "Miyembro simula",

  "settings.profile": "Profile",
  "settings.profile.noBio": "Wala pang bio — magkuwento ka tungkol sa sarili mo.",
  "settings.profile.hint":
    "Ang avatar, banner, display name, handle, bio at paboritong laro ay nasa profile editor.",

  "settings.account": "Account",
  "settings.email": "Email address",
  "settings.email.verified": "Verified. Ginagamit sa pag-sign in at sa pag-reset ng password.",
  "settings.email.unverified": "Hindi pa verified — tingnan ang inbox mo para sa link.",
  "settings.username": "Username",
  "settings.username.hint":
    "Ang handle at profile URL mo. Nasisira ang lumang links kapag pinalitan, kaya nasa profile page ito binabago.",
  "settings.password": "Password",
  "settings.password.hint":
    "Ipapadala namin sa email ang link para makapag-set ng bago. Ang pagpalit nito nang diretso mula sa bukas na session, na walang patunay na sa iyo ang inbox, ang dahilan kung bakit nagiging ninakaw na account ang hiram na laptop.",
  "settings.password.send": "Ipadala ang reset link",
  "settings.admin": "Access ng moderator",
  "settings.admin.hint": "Kaya mong itago ang mga post, ayusin ang reports at mag-ban ng account.",
  "settings.admin.open": "Admin panel",

  "settings.preferences": "Mga kagustuhan",
  "settings.language": "Wika",
  "settings.language.hint":
    "Isinasalin ang interface. Ang mga review, komento at pangalan ay nananatili sa pagkakasulat ng may-ari.",
  "settings.motion": "Bawasan ang galaw",
  "settings.motion.hint":
    "Hinihinto ang mga animation at gumagalaw na background sa buong app. Ginagawa na ito ng setting ng system mo — kapag binuksan dito, ipinipilit ito anuman ang naka-set.",
  "settings.effects": "Mga background effect",
  "settings.effects.hint":
    "Ang mga baga, bituin at lumulutang na glyph sa likod ng bawat seksyon. Kapag pinatay, madilim at plain ang background at kaunting baterya ang natitipid.",
  "settings.defaultSort": "Default na sort ng feed",
  "settings.defaultSort.hint":
    "Kung aling tab ang unang bubukas sa feed. Kapag pumili ka ng sort habang nagba-browse, iyon pa rin ang masusunod sa pagbisitang iyon.",

  "settings.dashboard": "Dashboard",
  "settings.navCards": "Navigation cards",
  "settings.navCards.hint":
    "Ang Browse card sa kaliwa ng Feed, Trending, Bago, Games, Ranggo at Nakasave. Kapag pinatay, nasa manipis na rail sa gilid ng screen ang parehong links.",
  "settings.statCards": "Stat cards",
  "settings.statCards.hint":
    "Ang EXP progress mo, ang leaderboard at ang pinakamaraming na-review na laro, sa kanan. Kapag pinatay, nagiging tab silang mabubuksan mo ulit anumang oras.",

  "settings.notifications": "Mga notification",
  "settings.unread": "Hindi pa nababasa",
  "settings.unread.some": "Mga star, komento at sagot na hindi mo pa natitingnan.",
  "settings.unread.none": "Wala nang bago.",
  "settings.markAllRead": "Markahang basa lahat",
  "settings.nothingUnread": "Walang bago",
  "settings.history": "Kasaysayan ng notification",
  "settings.history.hint": "Lahat ng nangyari sa mga review at komento mo.",
  "settings.open": "Buksan",

  "settings.session": "Session",
  "settings.signOut.hint":
    "Tinatapos ang session sa device na ito. Buo pa rin ang reviews, EXP at ranggo mo.",

  "settings.editProfile": "I-edit ang profile",
  "settings.editProfile.hint":
    "Kung paano ka lumalabas sa bawat review, komento at leaderboard.",
  "settings.editProfile.viewAs": "Tingnan bilang iba",

  /* ── Toasts ── */
  "toast.caughtUp": "Wala nang bago.",
  "toast.saved": "Na-save ang kagustuhan.",
  "toast.failed": "May naging problema.",
};
