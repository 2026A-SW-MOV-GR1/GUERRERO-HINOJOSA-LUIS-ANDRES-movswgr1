// ──────────────────────────────────────────────────────────────
// Contrato de datos del ecosistema MM-Fight (ver CONTRATO-DATOS.md)
// El payload viaja entre apps vía Intents nativos de Android:
//   <scheme>://flow?payload=<encodeURIComponent(JSON.stringify(FlowPayload))>
// ──────────────────────────────────────────────────────────────
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as IntentLauncher from "expo-intent-launcher";

export const SCHEMES = {
  gimnasio: "mmfightgym",
  auspiciantes: "mmfightsponsor",
  tinder: "mmfightmatch",
  tienda: "mmfightstore",
};

// Extrae y parsea el FlowPayload de un deep link / data URI de un Intent.
export function parsePayloadFromUrl(url) {
  if (!url) return null;
  try {
    const { queryParams } = Linking.parse(url);
    if (!queryParams?.payload) return null;
    const raw = Array.isArray(queryParams.payload)
      ? queryParams.payload[0]
      : queryParams.payload;
    const data = JSON.parse(raw);
    return typeof data === "object" && data !== null ? data : null;
  } catch (e) {
    console.warn("Payload inválido recibido:", e.message);
    return null;
  }
}

export function buildFlowUrl(scheme, payload) {
  return `${scheme}://flow?payload=${encodeURIComponent(JSON.stringify(payload))}`;
}

// Lanza un Intent nativo ACTION_VIEW hacia la siguiente app del flujo.
// En Android usa expo-intent-launcher (Intent real inter-proceso);
// FLAG_ACTIVITY_NEW_TASK = 0x10000000.
export async function sendToNextApp(scheme, payload) {
  const data = buildFlowUrl(scheme, payload);
  if (Platform.OS === "android") {
    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data,
      flags: 0x10000000,
    });
  } else {
    await Linking.openURL(data);
  }
}
