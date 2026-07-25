import { ObservableArray } from '@nativescript/core'

/**
 * Registro central del ciclo de vida.
 *
 * Cada evento se escribe en DOS sitios a la vez:
 *   1. `console.log` -> aparece en la terminal de `ns run android` y en logcat.
 *   2. Un ObservableArray que la UI pinta en pantalla, para poder demostrar
 *      la secuencia sin tener el computador conectado.
 */

export type LogKind = 'android' | 'app' | 'page' | 'state' | 'marker'

export interface LogEntry {
  seq: string
  time: string
  event: string
  detail: string
  /** Linea ya compuesta: los bindings del XML se quedan sin logica. */
  text: string
  kind: LogKind
  color: string
}

/** Un color por origen del evento, para leer la secuencia de un vistazo. */
const COLORS: Record<LogKind, string> = {
  android: '#4ADE80', // callbacks nativos de la Activity
  app: '#60A5FA', // eventos globales de NativeScript
  page: '#C084FC', // eventos de la Page / Frame
  state: '#FBBF24', // guardado y restauracion del contador
  marker: '#F87171', // separadores que inserta el usuario
}

/** Prefijo unico para filtrar en logcat: `adb logcat | grep CICLO` */
const TAG = '[CICLO]'

const MAX_ENTRIES = 400

let seq = 0

export const logEntries = new ObservableArray<LogEntry>()

function timestamp(): string {
  const d = new Date()
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')

  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}

export function log(event: string, detail = '', kind: LogKind = 'android'): void {
  seq += 1

  const entry: LogEntry = {
    seq: String(seq).padStart(3, '0'),
    time: timestamp(),
    event,
    detail,
    text: detail ? `${event}   ->  ${detail}` : event,
    kind,
    color: COLORS[kind],
  }

  console.log(`${TAG} #${entry.seq} ${entry.time}  ${entry.text}`)

  logEntries.push(entry)

  // El log en pantalla es una ventana deslizante; la terminal conserva todo.
  if (logEntries.length > MAX_ENTRIES) {
    logEntries.splice(0, logEntries.length - MAX_ENTRIES)
  }
}

/** Separador manual para delimitar un experimento (rotar, ir al Home, etc.). */
export function marker(text: string): void {
  log(`===== ${text.toUpperCase()} =====`, '', 'marker')
}

export function clearLog(): void {
  logEntries.splice(0, logEntries.length)
  seq = 0
}

/** Vuelca el log a texto plano para copiarlo al informe. */
export function logAsText(): string {
  const lines: string[] = []

  logEntries.forEach((e) => {
    lines.push(`#${e.seq} ${e.time}  ${e.text}`)
  })

  return lines.join('\n')
}
