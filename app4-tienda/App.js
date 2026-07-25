// ─────────────────────────────────────────────────────────────
// APP 4 — TIENDA DEL GIMNASIO (Estudiante 4) — Cierre del flujo
// Recibe todo el historial vía Intent (mmfightstore://flow?payload=...),
// muestra las tiendas de equipamiento en el mapa, arma el kit de
// pelea y presenta el RESUMEN FINAL de todo el ecosistema.
// UI portada del diseño brutalista de mm-fight (Next.js).
// ─────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  SafeAreaView, ScrollView, View, Text, TouchableOpacity,
  StyleSheet, Alert, StatusBar,
} from "react-native";
import { useURL } from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Anton_400Regular } from "@expo-google-fonts/anton";
import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
  Inter_700Bold, Inter_900Black,
} from "@expo-google-fonts/inter";
import FightMap from "./src/FightMap";
import { tiendas, productos } from "./src/data";
import { colors, font } from "./src/theme";
import { HardCard, Button, SectionHeading, Badge } from "./src/ui";
import { parsePayloadFromUrl } from "./src/flow";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Anton_400Regular, Inter_400Regular, Inter_500Medium,
    Inter_600SemiBold, Inter_700Bold, Inter_900Black,
  });

  const url = useURL();
  const [payload, setPayload] = useState({ version: 1 });
  const [tiendaId, setTiendaId] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [fly, setFly] = useState(null);

  useEffect(() => {
    const p = parsePayloadFromUrl(url);
    if (p) setPayload(p);
  }, [url]);

  const onLayout = useCallback(async () => {
    if (fontsLoaded || fontError) await SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  const tienda = tiendas.find((t) => t.id === tiendaId);
  const total = carrito.reduce(
    (acc, id) => acc + (productos.find((p) => p.id === id)?.precioUSD || 0),
    0
  );

  const markers = useMemo(() => {
    const gymId = payload.gimnasio?.id;
    return tiendas.map((t) => ({
      id: t.id,
      lat: t.lat,
      lng: t.lng,
      title: t.nombre,
      subtitle: `${t.ciudad}${t.gimnasioId === gymId ? " · ⭐ Tienda de tu gimnasio" : ""}`,
      emoji: "🛒",
      color: t.id === tiendaId ? "#d00000" : t.gimnasioId === gymId ? "#22c55e" : "#ffffff10",
    }));
  }, [tiendaId, payload.gimnasio?.id]);

  const onMarkerPress = (id) => {
    setTiendaId(id);
    const t = tiendas.find((x) => x.id === id);
    if (t) setFly({ lat: t.lat, lng: t.lng, zoom: 14 });
  };

  const toggleItem = (id) =>
    setCarrito((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  if (!fontsLoaded && !fontError) return null;

  const finalizar = () => {
    if (!tienda) {
      Alert.alert("Sin tienda", "Selecciona una tienda tocando su marcador en el mapa.");
      return;
    }
    if (carrito.length === 0) {
      Alert.alert("Kit vacío", "Agrega al menos un producto al kit de pelea.");
      return;
    }
    const compra = {
      tiendaId: tienda.id,
      tiendaNombre: tienda.nombre,
      items: carrito.map((id) => {
        const p = productos.find((x) => x.id === id);
        return { nombre: p.nombre, precioUSD: p.precioUSD };
      }),
      totalUSD: total,
    };
    setResumen({ ...payload, compra });
  };

  const { peleador, gimnasio, auspiciante, pelea } = payload;

  if (resumen) {
    return (
      <SafeAreaView style={styles.safe} onLayout={onLayout}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.headerRow}>
            <View style={styles.logoBox}><Text style={styles.logoTx}>EC</Text></View>
            <Text style={styles.brand}>MMA <Text style={{ color: colors.primary }}>ECUADOR</Text></Text>
          </View>
          <Text style={font.eyebrow}>FLUJO COMPLETO</Text>
          <Text style={font.h1}>RESUMEN{"\n"}FINAL ✅</Text>

          <HardCard style={{ marginTop: 20 }} accent>
            <SectionHeading>1 · Peleador (App Gimnasio)</SectionHeading>
            <Text style={styles.line}>
              {resumen.peleador
                ? `${resumen.peleador.nombre} “${resumen.peleador.apodo}” · ${resumen.peleador.categoria} · ${resumen.peleador.estilo} · ${resumen.peleador.nivel}`
                : "—"}
            </Text>
            <Text style={styles.line}>
              🥊 {resumen.gimnasio ? `${resumen.gimnasio.nombre} (${resumen.gimnasio.ciudad})` : "—"}
            </Text>

            <SectionHeading>2 · Auspiciante (App Auspiciantes)</SectionHeading>
            <Text style={styles.line}>
              {resumen.auspiciante
                ? `💰 ${resumen.auspiciante.nombre} · ${resumen.auspiciante.industria} · $${resumen.auspiciante.montoUSD.toLocaleString()} USD`
                : "—"}
            </Text>

            <SectionHeading>3 · Pelea (App Tinder)</SectionHeading>
            <Text style={styles.line}>
              {resumen.pelea ? `🔥 vs ${resumen.pelea.rivalNombre} “${resumen.pelea.rivalApodo}” · ${resumen.pelea.fecha}` : "—"}
            </Text>
            <Text style={styles.line}>{resumen.pelea ? `🏟️ ${resumen.pelea.venueNombre}` : ""}</Text>

            <SectionHeading>4 · Kit de pelea (App Tienda)</SectionHeading>
            <Text style={styles.line}>🛒 {resumen.compra.tiendaNombre}</Text>
            {resumen.compra.items.map((it, i) => (
              <Text key={i} style={styles.line}>   • {it.nombre} — ${it.precioUSD}</Text>
            ))}
            <Text style={styles.total}>TOTAL: ${resumen.compra.totalUSD} USD</Text>
          </HardCard>

          <HardCard style={{ marginTop: 18 }}>
            <Text style={styles.line}>🏆 ¡Ecosistema completado! Los datos viajaron por Intents:</Text>
            <Text style={styles.flowTx}>GIMNASIO ➜ AUSPICIANTES ➜ TINDER ➜ TIENDA</Text>
          </HardCard>

          <Button
            title="↩ Volver a la tienda"
            variant="secondary"
            onPress={() => setResumen(null)}
            style={{ marginTop: 24 }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} onLayout={onLayout}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View style={styles.logoBox}><Text style={styles.logoTx}>EC</Text></View>
          <Text style={styles.brand}>MMA <Text style={{ color: colors.primary }}>ECUADOR</Text></Text>
        </View>
        <Text style={font.eyebrow}>APP 4 · MÓDULO TIENDA</Text>
        <Text style={font.h1}>TIENDA DEL{"\n"}GIMNASIO</Text>

        <HardCard style={{ marginTop: 18 }} accent={!!peleador}>
          {peleador ? (
            <>
              <Badge label="Flujo recibido vía Intent" tone="success" />
              <Text style={styles.line}>
                {peleador.nombre} “{peleador.apodo}”{gimnasio ? ` · 🥊 ${gimnasio.nombre}` : ""}
              </Text>
              {auspiciante && (
                <Text style={styles.line}>💰 {auspiciante.nombre} (${auspiciante.montoUSD.toLocaleString()})</Text>
              )}
              {pelea && (
                <Text style={styles.line}>🔥 vs “{pelea.rivalApodo}” · {pelea.fecha} · {pelea.venueNombre}</Text>
              )}
            </>
          ) : (
            <Text style={styles.line}>⚠️ Sin Intent de la App 3 — modo demo: compra el kit directamente.</Text>
          )}
        </HardCard>

        <View style={{ marginTop: 22 }}>
          <SectionHeading>Elige la tienda</SectionHeading>
          <Text style={styles.hint}>🛒 disponible · 🟢 tienda de tu gimnasio</Text>
        </View>
        <FightMap
          markers={markers}
          selectedId={tiendaId}
          onMarkerPress={onMarkerPress}
          flyTo={fly}
          style={{ height: 300, marginTop: 8 }}
        />

        {tienda && (
          <HardCard style={{ marginTop: 18 }} accent>
            <Text style={styles.venueName}>🛒 {tienda.nombre}</Text>
            <Text style={styles.line}>{tienda.direccion}</Text>
            <Text style={styles.coords}>📍 {tienda.lat.toFixed(4)}, {tienda.lng.toFixed(4)}</Text>
          </HardCard>
        )}

        <View style={{ marginTop: 22 }}>
          <SectionHeading>Arma tu kit de pelea</SectionHeading>
        </View>
        <HardCard>
          {productos.map((p) => {
            const on = carrito.includes(p.id);
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.prod, on && styles.prodOn]}
                onPress={() => toggleItem(p.id)}
              >
                <Text style={styles.prodTx}>{p.emoji} {p.nombre}</Text>
                <Text style={[styles.prodPrice, on && { color: colors.green }]}>
                  {on ? "✓ " : ""}${p.precioUSD}
                </Text>
              </TouchableOpacity>
            );
          })}
          <Text style={styles.total}>TOTAL: ${total} USD</Text>
        </HardCard>

        <Button
          title="Finalizar compra y cerrar flujo ✅"
          onPress={finalizar}
          style={{ marginTop: 26, marginBottom: 6 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 56 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 },
  logoBox: { width: 30, height: 30, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  logoTx: { color: colors.white, fontFamily: "Anton_400Regular", fontSize: 13 },
  brand: { fontFamily: "Anton_400Regular", fontSize: 15, color: colors.text, letterSpacing: 1 },
  hint: { fontFamily: "Inter_600SemiBold", color: colors.textMuted, fontSize: 12, marginBottom: 4 },
  line: { fontFamily: "Inter_500Medium", color: colors.text, marginTop: 8, fontSize: 13 },
  venueName: { fontFamily: "Anton_400Regular", color: colors.text, fontSize: 17, textTransform: "uppercase" },
  coords: { fontFamily: "Inter_600SemiBold", color: colors.textMuted, marginTop: 8, fontSize: 11 },
  prod: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 13, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, marginTop: 8,
  },
  prodOn: { borderColor: colors.green, backgroundColor: "#0a1f0f" },
  prodTx: { fontFamily: "Inter_600SemiBold", color: colors.text, fontSize: 13 },
  prodPrice: { fontFamily: "Anton_400Regular", color: colors.textMuted, fontSize: 15 },
  total: { fontFamily: "Anton_400Regular", color: colors.primary, fontSize: 20, marginTop: 16, textAlign: "right" },
  flowTx: { fontFamily: "Anton_400Regular", color: colors.text, marginTop: 10, letterSpacing: 1, fontSize: 14 },
});
