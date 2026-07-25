// Mapa interactivo OpenStreetMap + Leaflet dentro de un WebView.
// Sin API keys. Marcadores personalizados (divIcon), popups y
// comunicación bidireccional RN ⇄ mapa vía postMessage.
import React, { useMemo, useRef, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { colors } from "./theme";

function buildHtml(center, zoom) {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;600;700&display=swap');
  html, body, #map { margin:0; padding:0; height:100%; background:#050505; }
  .mk { display:flex; align-items:center; justify-content:center;
        border:3px solid #ffffff; font-size:16px;
        box-shadow:3px 3px 0px rgba(0,0,0,.7); }
  .mk.sel { border-color:#d00000; border-width:4px; transform:scale(1.2) rotate(-3deg); }
  .leaflet-popup-content-wrapper { background:#0f0f0f; color:#ffffff;
        border:2px solid #ffffff; border-radius:0; box-shadow:5px 5px 0px rgba(208,0,0,0.5); }
  .leaflet-popup-tip { background:#0f0f0f; border-radius:0; }
  .leaflet-popup-close-button { color:rgba(255,255,255,.6) !important; font-size:18px !important; }
  .pp-t { font-family:'Anton',sans-serif; font-size:15px; text-transform:uppercase; letter-spacing:.5px; }
  .pp-s { font-family:'Inter',sans-serif; color:#a3a3a3; font-size:11px; margin-top:4px; font-weight:600; }
  .leaflet-control-zoom { border:2px solid #fff !important; border-radius:0 !important; overflow:hidden; }
  .leaflet-control-zoom a { background:#0f0f0f !important; color:#fff !important; border-radius:0 !important; }
  .leaflet-control-attribution { background:rgba(5,5,5,.7) !important; color:#525252 !important; }
  .leaflet-control-attribution a { color:#737373 !important; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: true }).setView([${center[0]}, ${center[1]}], ${zoom});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  var layer = L.layerGroup().addTo(map);

  function send(msg) {
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }

  window.updateMarkers = function (data) {
    layer.clearLayers();
    (data.markers || []).forEach(function (m) {
      var sel = data.selectedId === m.id;
      var icon = L.divIcon({
        className: '',
        html: '<div class="mk' + (sel ? ' sel' : '') + '" style="width:34px;height:34px;background:' + (m.color || '#e11d2e') + '">' + (m.emoji || '📍') + '</div>',
        iconSize: [34, 34], iconAnchor: [17, 17],
      });
      var mk = L.marker([m.lat, m.lng], { icon: icon }).addTo(layer);
      mk.bindPopup('<div class="pp-t">' + m.title + '</div><div class="pp-s">' + (m.subtitle || '') + '</div>');
      mk.on('click', function () { send({ type: 'marker', id: m.id }); });
      if (sel) mk.openPopup();
    });
  };

  map.on('click', function (e) {
    send({ type: 'map', lat: e.latlng.lat, lng: e.latlng.lng });
  });

  window.flyTo = function (lat, lng, z) { map.flyTo([lat, lng], z || map.getZoom()); };
  send({ type: 'ready' });
</script>
</body>
</html>`;
}

export default function FightMap({
  markers = [],
  center = [-1.55, -78.9], // Ecuador
  zoom = 6.4,
  selectedId = null,
  onMarkerPress,
  onMapPress,
  flyTo = null, // { lat, lng, zoom }
  style,
}) {
  const webRef = useRef(null);
  const readyRef = useRef(false);
  const html = useMemo(() => buildHtml(center, zoom), []);

  const pushMarkers = () => {
    webRef.current?.injectJavaScript(
      `window.updateMarkers(${JSON.stringify({ markers, selectedId })}); true;`
    );
  };

  useEffect(() => {
    if (readyRef.current) pushMarkers();
  }, [markers, selectedId]);

  useEffect(() => {
    if (readyRef.current && flyTo) {
      webRef.current?.injectJavaScript(
        `window.flyTo(${flyTo.lat}, ${flyTo.lng}, ${flyTo.zoom || 13}); true;`
      );
    }
  }, [flyTo]);

  const onMessage = (ev) => {
    try {
      const msg = JSON.parse(ev.nativeEvent.data);
      if (msg.type === "ready") {
        readyRef.current = true;
        pushMarkers();
        if (flyTo) {
          webRef.current?.injectJavaScript(
            `window.flyTo(${flyTo.lat}, ${flyTo.lng}, ${flyTo.zoom || 13}); true;`
          );
        }
      } else if (msg.type === "marker") {
        onMarkerPress?.(msg.id);
      } else if (msg.type === "map") {
        onMapPress?.({ lat: msg.lat, lng: msg.lng });
      }
    } catch {}
  };

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        style={{ backgroundColor: colors.bg }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
});
