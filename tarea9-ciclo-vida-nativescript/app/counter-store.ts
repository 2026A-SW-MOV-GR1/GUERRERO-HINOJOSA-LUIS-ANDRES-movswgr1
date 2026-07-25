import { ApplicationSettings } from '@nativescript/core'
import { log } from './lifecycle-log'

/**
 * El contador y sus TRES capas de supervivencia.
 *
 * Cada capa muere en un escenario distinto. Verlas juntas en pantalla es lo
 * que permite explicar por que el contador sobrevive (o no) a cada prueba:
 *
 *   Capa 1 - Variable de modulo (heap de V8)
 *            Vive en el proceso, NO en la Activity. Sobrevive a que la
 *            Activity se recree; muere si Android mata el proceso.
 *
 *   Capa 2 - Bundle de Android (onSaveInstanceState)
 *            Android lo guarda fuera del proceso. Sobrevive a que el SO mate
 *            el proceso en segundo plano; muere si el usuario cierra la app
 *            deslizandola de Recientes.
 *
 *   Capa 3 - SharedPreferences (ApplicationSettings)
 *            Disco. Sobrevive a todo, incluso a un arranque en frio.
 */

const SETTINGS_KEY = 'contador.valor'

/** Clave con la que viajamos dentro del android.os.Bundle. */
export const BUNDLE_KEY = 'contadorValor'

/** Capa 1. */
let memoria = 0

/** Ultimo valor que Android nos devolvio dentro del Bundle (null = no hubo). */
let ultimoBundle: number | null = null

/** Permite apagar la restauracion para demostrar la perdida de estado. */
let persistenciaActiva = true

/**
 * Callback de la vista activa.
 *
 * Hace falta porque NativeScript conserva el ViewModel cuando Android recrea
 * la Activity: la restauracion ocurre en onCreate, pero nadie vuelve a
 * construir el ViewModel ni dispara `navigatedTo`, asi que sin este aviso la
 * pantalla se quedaria mostrando los valores de antes de restaurar.
 */
let notificarVista: (() => void) | null = null

export const Contador = {
  /** La vista activa se registra aqui; solo puede haber una. */
  suscribir(cb: () => void): void {
    notificarVista = cb
  },

  get valor(): number {
    return memoria
  },

  /** Lo que se rescato del Bundle en el ultimo onCreate. */
  get valorEnBundle(): number | null {
    return ultimoBundle
  },

  /** Lo que hay ahora mismo en SharedPreferences. */
  get valorEnSettings(): number {
    return ApplicationSettings.getNumber(SETTINGS_KEY, 0)
  },

  get persistenciaActiva(): boolean {
    return persistenciaActiva
  },

  set persistenciaActiva(activa: boolean) {
    persistenciaActiva = activa
    log(
      'persistencia',
      activa ? 'ACTIVADA - se restaura al recrear' : 'DESACTIVADA - el estado se pierde al recrear',
      'state'
    )
  },

  incrementar(): number {
    memoria += 1
    this.escribirEnSettings()

    return memoria
  },

  reiniciar(): void {
    memoria = 0
    ultimoBundle = null
    ApplicationSettings.remove(SETTINGS_KEY)
    ApplicationSettings.flush()
    log('reset()', 'contador = 0, Bundle y SharedPreferences limpiados', 'state')
  },

  /** Capa 3: escritura en disco. Se llama en cada +1 y en onPause. */
  escribirEnSettings(): void {
    ApplicationSettings.setNumber(SETTINGS_KEY, memoria)
    ApplicationSettings.flush()
  },

  /**
   * Capa 2 - escritura. Equivale al cuerpo de
   * `onSaveInstanceState(outState: Bundle)` de Android nativo.
   */
  escribirEnBundle(bundle: android.os.Bundle): void {
    bundle.putInt(BUNDLE_KEY, memoria)
    log('   -> outState.putInt', `${BUNDLE_KEY} = ${memoria}`, 'state')
  },

  /**
   * Capa 2 - lectura. Equivale a `onRestoreInstanceState(savedInstanceState)`.
   * En NativeScript el Bundle llega como argumento del evento `activityCreated`.
   */
  restaurar(bundle: android.os.Bundle | null): void {
    if (!persistenciaActiva) {
      log('restaurar()', 'omitida: persistencia DESACTIVADA', 'state')
      notificarVista?.()

      return
    }

    if (bundle && bundle.containsKey(BUNDLE_KEY)) {
      ultimoBundle = bundle.getInt(BUNDLE_KEY)
      memoria = ultimoBundle
      log('   <- savedInstanceState', `${BUNDLE_KEY} = ${ultimoBundle} (Bundle)`, 'state')
      notificarVista?.()

      return
    }

    // No hubo Bundle: o es un arranque en frio, o el usuario cerro la app.
    // Caemos a disco, que es la unica capa que sobrevive a eso.
    ultimoBundle = null

    const enDisco = this.valorEnSettings
    memoria = enDisco
    log(
      '   <- SharedPreferences',
      `${SETTINGS_KEY} = ${enDisco} (sin Bundle: arranque en frio)`,
      'state'
    )
    notificarVista?.()
  },
}
