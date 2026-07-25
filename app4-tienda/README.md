# App 4 — Tienda del Gimnasio (Estudiante 4) — Cierre del flujo

Mapa de tiendas de equipamiento 🛒 (la tienda del gimnasio del peleador se
resalta en verde), carrito de kit de pelea y **resumen final** de todo el
ecosistema.

- **Scheme Android:** `mmfightstore://`
- **Recibe Intent de:** App 3 Tinder de Peleas
- **Escribe en el contrato:** `compra` (cierra el flujo, no reenvía)

## Ejecutar

```bash
npm install
npx expo run:android
```

## Demo

1. Toca la tienda en el mapa (verde = la de tu gimnasio recibido por Intent).
2. Selecciona los productos del kit; se calcula el total.
3. "FINALIZAR COMPRA" muestra el resumen completo:
   peleador → gimnasio → auspiciante → pelea → compra.
