# Contrato de Datos — Ecosistema MM-Fight

Todas las apps intercambian un único objeto JSON **acumulativo** llamado
`FlowPayload`, serializado con `JSON.stringify`, URL-encodeado y transportado
en el parámetro `payload` del data URI del Intent:

```
<scheme>://flow?payload=<encodeURIComponent(JSON.stringify(FlowPayload))>
```

| Emisor | Receptor | Data URI del Intent |
|--------|----------|---------------------|
| App 1 Gimnasio | App 2 Auspiciantes | `mmfightsponsor://flow?payload=...` |
| App 2 Auspiciantes | App 3 Tinder | `mmfightmatch://flow?payload=...` |
| App 3 Tinder | App 4 Tienda | `mmfightstore://flow?payload=...` |

## TypeScript del contrato

```ts
export interface FlowPayload {
  version: 1;                 // versión del contrato
  peleador?: Peleador;        // escribe App 1
  gimnasio?: Gimnasio;        // escribe App 1
  auspiciante?: Auspiciante;  // escribe App 2
  pelea?: Pelea;              // escribe App 3
  compra?: Compra;            // escribe App 4 (cierre)
}

export interface Peleador {
  nombre: string;
  apodo: string;
  ciudad: string;
  categoria: string;          // "Gallo" | "Ligero" | "Welter" | "Mediano" | "Pesado" ...
  estilo: "Striker" | "Grappler" | "Mixto";
  nivel: "Amateur" | "Pro";
}

export interface Gimnasio {
  id: string;
  nombre: string;
  ciudad: string;
  direccion: string;
  lat: number;
  lng: number;
}

export interface Auspiciante {
  id: string;
  nombre: string;
  industria: string;
  montoUSD: number;
  lat: number;
  lng: number;
}

export interface Pelea {
  rivalNombre: string;
  rivalApodo: string;
  rivalGimnasio: string;
  categoria: string;
  fecha: string;              // ISO 8601, ej. "2026-08-15"
  venueNombre: string;
  venueLat: number;
  venueLng: number;
}

export interface Compra {
  tiendaId: string;
  tiendaNombre: string;
  items: { nombre: string; precioUSD: number }[];
  totalUSD: number;
}
```

## Reglas

1. **Nunca eliminar claves recibidas**: cada app agrega su sección y reenvía el
   resto intacto.
2. **Campos opcionales**: la app receptora debe funcionar aunque el payload
   llegue incompleto (modo standalone para la demo individual del examen).
3. **Encoding**: siempre `encodeURIComponent` al enviar y
   `decodeURIComponent` al recibir; JSON en UTF-8.
4. **Versionado**: si se cambia el contrato, incrementar `version` y mantener
   retro-compatibilidad de lectura.
