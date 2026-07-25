// ─────────────────────────────────────────────────────────────
// Kit de UI compartido — reproduce en React Native las clases
// .card, .btn-primary, .btn-secondary, .chip, .badge, .input-dark,
// .section-heading, .hover-lift (sombra dura) y .badge-para de
// mm-fight/src/app/globals.css
// ─────────────────────────────────────────────────────────────
import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { colors, fonts, font, hardShadow } from "./theme";

// ── HardCard — el .card con box-shadow: 6px 6px 0px (sin blur) ──
export function HardCard({ children, style, offset = 6, shadowColor = colors.border, borderColor = colors.borderStrong, borderWidth = 2, accent = false }) {
  return (
    <View style={styles.hardWrap}>
      <View pointerEvents="none" style={hardShadow(offset, accent ? colors.primary : shadowColor)} />
      <View
        style={[
          styles.hardCard,
          { borderColor: accent ? colors.primary : borderColor, borderWidth: accent ? 3 : borderWidth },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

// ── Button — .btn-primary / .btn-secondary ──
export function Button({ title, onPress, variant = "primary", style, disabled = false }) {
  const primary = variant === "primary";
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        primary ? styles.btnPrimary : styles.btnSecondary,
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <Text style={[styles.btnTx, primary ? styles.btnTxPrimary : styles.btnTxSecondary]}>{title}</Text>
    </TouchableOpacity>
  );
}

// ── Chip — filtro tipo píldora (.chip) ──
export function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipTx, active && styles.chipTxActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Badge — etiqueta rectangular pequeña (.badge, .badge-red, .badge-outline) ──
export function Badge({ label, tone = "red" }) {
  const toneStyle = {
    red: { backgroundColor: colors.primary, borderColor: colors.primary, color: colors.white },
    outline: { backgroundColor: "transparent", borderColor: colors.border, color: colors.textSecondary },
    dark: { backgroundColor: colors.neutral600, borderColor: colors.neutral600, color: colors.white },
    success: { backgroundColor: colors.green, borderColor: colors.green, color: "#052e16" },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: toneStyle.backgroundColor, borderColor: toneStyle.borderColor }]}>
      <Text style={[styles.badgeTx, { color: toneStyle.color }]}>{label}</Text>
    </View>
  );
}

// ── SkewBadge — el badge-para / parallelogram con transform skewX ──
export function SkewBadge({ label, color = colors.primary, textColor = colors.white }) {
  return (
    <View style={[styles.skew, { backgroundColor: color }]}>
      <Text style={[styles.skewTx, { color: textColor, transform: [{ skewX: "15deg" }] }]}>{label}</Text>
    </View>
  );
}

// ── SectionHeading — barra roja sesgada + título Anton (.section-heading) ──
export function SectionHeading({ children }) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTx}>{children}</Text>
    </View>
  );
}

// ── Field — label uppercase + input oscuro (.input-dark) ──
export function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={font.label}>{label}</Text> : null}
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
    </View>
  );
}

// ── StatBlock — bloque cuadrado con número Anton + barra (skill stats) ──
export function StatBlock({ label, value, color = colors.primary }) {
  return (
    <View style={styles.statBlock}>
      <Text style={[styles.statVal, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statTrack}>
        <View style={[styles.statFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hardWrap: { position: "relative" },
  hardCard: {
    backgroundColor: colors.surfaceRaised,
    padding: 16,
  },

  btn: {
    paddingVertical: 15,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnSecondary: { backgroundColor: "transparent", borderWidth: 2, borderColor: colors.border },
  btnTx: {
    fontFamily: fonts.display,
    fontSize: 16,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  btnTxPrimary: { color: colors.white },
  btnTxSecondary: { color: colors.text },

  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "transparent",
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTx: { fontFamily: fonts.display, fontSize: 13, color: colors.textSecondary, letterSpacing: 0.5 },
  chipTxActive: { color: colors.white },

  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeTx: {
    fontFamily: fonts.display,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  skew: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 16,
    transform: [{ skewX: "-15deg" }],
  },
  skewTx: { fontFamily: fonts.display, fontSize: 15, textTransform: "uppercase" },

  sectionRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  sectionBar: { width: 4, height: 18, backgroundColor: colors.primary, transform: [{ skewX: "-12deg" }] },
  sectionTx: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.text,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  input: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 14,
  },

  statBlock: { flex: 1, borderWidth: 2, borderColor: colors.border, alignItems: "center", paddingTop: 12, paddingBottom: 10 },
  statVal: { fontFamily: fonts.display, fontSize: 22 },
  statLabel: {
    fontFamily: fonts.display,
    fontSize: 9,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginVertical: 6,
  },
  statTrack: { width: "80%", height: 5, backgroundColor: colors.surface },
  statFill: { height: "100%" },
});
