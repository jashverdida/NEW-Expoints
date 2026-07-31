import type { Dictionary } from "@/lib/i18n/en";

/**
 * Spanish.
 *
 * Neutral Latin American Spanish, second person singular ("tu perfil"), which
 * reads naturally across the widest span of readers. Gaming loanwords that are
 * already standard in Spanish-language gaming press stay put.
 */
export const es: Dictionary = {
  /* ── Navigation ── */
  "nav.browse": "Explorar",
  "nav.feed": "Inicio",
  "nav.feed.hint": "Todo, lo popular primero",
  "nav.trending": "Tendencias",
  "nav.trending.hint": "Reseñas con más estrellas",
  "nav.fresh": "Recientes",
  "nav.fresh.hint": "Recién publicadas",
  "nav.games": "Juegos",
  "nav.games.hint": "Explora el catálogo",
  "nav.ranks": "Rangos",
  "nav.ranks.hint": "Quién está subiendo",
  "nav.saved": "Guardado",
  "nav.saved.hint": "Tu lista de lectura",
  "nav.showCards": "Mostrar tarjetas",
  "nav.hideNav": "Ocultar tarjetas de navegación",
  "nav.hideStats": "Ocultar tarjetas de estadísticas",
  "nav.signOut": "Cerrar sesión",
  "nav.post": "Publicar",

  /* ── Header ── */
  "header.searchPlaceholder": "Busca una reseña, un juego, lo que sea…",
  "header.searchLabel": "Buscar reseñas",
  "header.settings": "Ajustes",
  "header.account": "Menú de cuenta",

  /* ── Sort tabs ── */
  "sort.hot": "Popular",
  "sort.new": "Nuevo",
  "sort.top": "Top",

  /* ── Right dock ── */
  "rail.yourRun": "Tu progreso",
  "rail.topPlayers": "Mejores jugadores",
  "rail.mostReviewed": "Más reseñados",
  "rail.reviews": "Reseñas",
  "rail.comments": "Comentarios",
  "rail.stars": "Estrellas",
  "rail.nobodyYet": "Nadie todavía.",
  "rail.fullLeaderboard": "Tabla completa",
  "rail.browseGames": "Ver todos los juegos",

  /* ── Footer ── */
  "footer.tagline":
    "Escribe reseñas. Gana EXP. Sube de rango. Un foro de videojuegos donde tener una opinión sirve para algo.",
  "footer.expChip": "Cada reseña da EXP",
  "footer.about": "Acerca de",
  "footer.about.exp": "Cómo funciona el EXP",
  "footer.about.ranks": "La escala de rangos",
  "footer.about.features": "Qué incluye",
  "footer.about.team": "Conoce al equipo",
  "footer.about.discover": "Descubre reseñas",
  "footer.builtBy": "Creado por",
  "footer.getInTouch": "Contacto",
  "footer.rights": "Todos los derechos reservados.",
  "footer.report": "Reportar un problema",
  "footer.crafted": "Hecho con",
  "footer.by": "por",

  /* ── Settings ── */
  "settings.title": "Ajustes",
  "settings.memberSince": "Miembro desde",

  "settings.profile": "Perfil",
  "settings.profile.noBio": "Aún no hay biografía — cuenta algo sobre ti.",
  "settings.profile.hint":
    "El avatar, el banner, el nombre visible, el usuario, la biografía y tu juego favorito están en el editor de perfil.",

  "settings.account": "Cuenta",
  "settings.email": "Correo electrónico",
  "settings.email.verified": "Verificado. Se usa para iniciar sesión y restablecer la contraseña.",
  "settings.email.unverified": "Aún sin verificar — revisa tu bandeja de entrada.",
  "settings.username": "Nombre de usuario",
  "settings.username.hint":
    "Tu identificador y la URL de tu perfil. Cambiarlo rompe los enlaces antiguos, por eso se edita en la página de perfil.",
  "settings.password": "Contraseña",
  "settings.password.hint":
    "Te enviaremos un enlace por correo para poner una nueva. Cambiarla directamente desde una sesión abierta, sin nada que demuestre que la bandeja es tuya, es lo que convierte una laptop prestada en una cuenta robada.",
  "settings.password.send": "Enviar enlace",
  "settings.admin": "Acceso de moderador",
  "settings.admin.hint": "Puedes ocultar publicaciones, resolver reportes y banear cuentas.",
  "settings.admin.open": "Panel de administración",

  "settings.preferences": "Preferencias",
  "settings.language": "Idioma",
  "settings.language.hint":
    "Traduce la interfaz. Las reseñas, los comentarios y los nombres se quedan tal como los escribieron.",
  "settings.motion": "Reducir movimiento",
  "settings.motion.hint":
    "Detiene las animaciones y el movimiento de fondo en toda la app. Tu sistema ya puede hacerlo — activarlo aquí lo fuerza de todas formas.",
  "settings.effects": "Efectos de fondo",
  "settings.effects.hint":
    "Las brasas, los campos de estrellas y los glifos que flotan detrás de cada sección. Al desactivarlos queda un fondo oscuro liso y se ahorra algo de batería.",
  "settings.defaultSort": "Orden inicial del inicio",
  "settings.defaultSort.hint":
    "Con qué pestaña abre el inicio. Si eliges un orden mientras navegas, ese manda durante esa visita.",

  "settings.dashboard": "Panel",
  "settings.navCards": "Tarjetas de navegación",
  "settings.navCards.hint":
    "La tarjeta Explorar a la izquierda de Inicio, Tendencias, Recientes, Juegos, Rangos y Guardado. Al desactivarla, los mismos enlaces quedan en la barra delgada del borde.",
  "settings.statCards": "Tarjetas de estadísticas",
  "settings.statCards.hint":
    "Tu progreso de EXP, la tabla de posiciones y los juegos más reseñados, a la derecha. Al desactivarlas se contraen en una pestaña que puedes volver a abrir cuando quieras.",

  "settings.notifications": "Notificaciones",
  "settings.unread": "Sin leer",
  "settings.unread.some": "Estrellas, comentarios y respuestas que aún no has visto.",
  "settings.unread.none": "Estás al día.",
  "settings.markAllRead": "Marcar todo como leído",
  "settings.nothingUnread": "Nada sin leer",
  "settings.history": "Historial de notificaciones",
  "settings.history.hint": "Todo lo que ha pasado en tus reseñas y comentarios.",
  "settings.open": "Abrir",

  "settings.session": "Sesión",
  "settings.signOut.hint":
    "Cierra la sesión en este dispositivo. Tus reseñas, tu EXP y tu rango no se tocan.",

  "settings.editProfile": "Editar perfil",
  "settings.editProfile.hint": "Cómo apareces en cada reseña, comentario y tabla de posiciones.",
  "settings.editProfile.viewAs": "Ver como los demás",

  /* ── Toasts ── */
  "toast.caughtUp": "Estás al día.",
  "toast.saved": "Preferencia guardada.",
  "toast.failed": "Algo salió mal.",
};
