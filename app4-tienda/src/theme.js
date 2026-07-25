// ─────────────────────────────────────────────────────────────
// Design tokens portados 1:1 desde mm-fight/src/app/globals.css
// (sistema "brutalista": Anton + Inter, negro puro, rojo agresivo,
// esquinas rectas, sombras duras sin blur, badges sesgados).
// ─────────────────────────────────────────────────────────────
export const colors = {
  // Red scale
  red900: "#4a0000",
  red800: "#7f0000",
  red700: "#8b0000",
  red600: "#b71c1c",
  red500: "#d00000", // --color-primary
  red400: "#ff1a1a", // --color-primary-hover
  red300: "#ff4d4d",

  // Neutral scale
  bg: "#050505",            // --color-bg
  surface: "#0a0a0a",       // --color-surface
  surfaceRaised: "#0f0f0f", // --color-surface-raised
  surfaceOverlay: "#141414",
  neutral600: "#262626",
  neutral500: "#404040",
  neutral400: "#525252",    // --color-text-muted
  neutral300: "#737373",
  neutral200: "#a3a3a3",    // --color-text-secondary
  white: "#ffffff",

  // Status
  green: "#22c55e",
  yellow: "#facc15",
  orange: "#f97316",
  blue: "#3b82f6",

  // Semantic
  primary: "#d00000",
  primaryHover: "#ff1a1a",
  text: "#ffffff",
  textSecondary: "#a3a3a3",
  textMuted: "#525252",
  border: "rgba(255,255,255,0.14)",
  borderStrong: "rgba(255,255,255,0.9)",
};

// Nombres de fuente registrados por useFonts() en cada App.js
export const fonts = {
  display: "Anton_400Regular", // títulos, botones, labels, badges (siempre MAYÚSCULAS)
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemibold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  bodyBlack: "Inter_900Black",
};

export const font = {
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  h1: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  h2: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  body: { fontFamily: fonts.body, fontSize: 14, color: colors.text },
};

// Sombra dura sin blur (equivalente a box-shadow: Npx Npx 0px color)
export const hardShadow = (offset = 6, color = colors.border) => ({
  position: "absolute",
  top: offset,
  left: offset,
  right: -offset,
  bottom: -offset,
  backgroundColor: color,
});
