import {
  Application,
  AndroidActivityBundleEventData,
  AndroidActivityEventData,
  ApplicationEventData,
  OrientationChangedEventData,
} from '@nativescript/core'

import { Contador } from './counter-store'
import { log, marker } from './lifecycle-log'

/**
 * Suscripcion a TODO el ciclo de vida.
 *
 * NativeScript expone dos niveles y conviene no confundirlos:
 *
 *   a) Eventos globales de la app (`Application.on`): launch, suspend, resume,
 *      exit... Son de NativeScript, no de Android, y NO son 1:1 con los
 *      callbacks nativos.
 *
 *   b) Callbacks reales de la Activity (`Application.android.on`): estos SI
 *      son los metodos de Android que pide el taller. NativeScript los reenvia
 *      desde un `ActivityLifecycleCallbacks` registrado en la Application.
 *
 * Mapa exacto que usamos:
 *
 *   onCreate             -> Application.android.on('activityCreated')
 *   onStart              -> Application.android.on('activityStarted')
 *   onResume             -> Application.android.on('activityResumed')
 *   onPause              -> Application.android.on('activityPaused')
 *   onStop               -> Application.android.on('activityStopped')
 *   onDestroy            -> Application.android.on('activityDestroyed')
 *   onSaveInstanceState  -> Application.android.on('saveActivityState')
 *   onRestart            -> NO EXISTE como evento. Se deduce (ver abajo).
 */

// --- Deduccion de onRestart -------------------------------------------------
// NativeScript no reenvia `onRestart`. Pero Android solo lo llama cuando una
// Activity que ya paso por onStop vuelve a arrancar sin haber sido destruida.
// Esa condicion se puede reconstruir con dos banderas.
let recienCreada = false
let estuvoDetenida = false

function registrarEventosDeActivity(): void {
  const android = Application.android

  if (!android) {
    return // iOS: este bloque no aplica.
  }

  android.on('activityCreated', (args: AndroidActivityBundleEventData) => {
    recienCreada = true
    estuvoDetenida = false

    const hayBundle = !!args.bundle
    log(
      'onCreate(savedInstanceState)',
      hayBundle ? 'Bundle RECIBIDO -> la Activity se esta recreando' : 'Bundle = null -> arranque limpio'
    )

    // Equivalente a onRestoreInstanceState. En Android nativo se puede hacer en
    // cualquiera de los dos sitios; aqui el Bundle solo llega en activityCreated.
    Contador.restaurar(args.bundle ?? null)
  })

  android.on('activityStarted', (args: AndroidActivityEventData) => {
    if (!recienCreada && estuvoDetenida) {
      log('onRestart()', 'deducido: hubo onStop y NO hubo onDestroy')
    }

    recienCreada = false
    estuvoDetenida = false
    log('onStart()')
  })

  android.on('activityResumed', (args: AndroidActivityEventData) => {
    log('onResume()', `contador en memoria = ${Contador.valor}`)
  })

  android.on('activityPaused', (args: AndroidActivityEventData) => {
    // Ultimo punto garantizado para escribir a disco.
    Contador.escribirEnSettings()
    log('onPause()', `volcado a SharedPreferences = ${Contador.valor}`)
  })

  android.on('activityStopped', (args: AndroidActivityEventData) => {
    estuvoDetenida = true
    log('onStop()')
  })

  android.on('activityDestroyed', (args: AndroidActivityEventData) => {
    recienCreada = false
    estuvoDetenida = false
    log('onDestroy()', 'la Activity muere')
  })

  // Equivalente exacto a onSaveInstanceState(outState: Bundle).
  // Ojo: desde Android 9 (API 28) se llama DESPUES de onStop, no antes.
  android.on('saveActivityState', (args: AndroidActivityBundleEventData) => {
    log('onSaveInstanceState(outState)')
    Contador.escribirEnBundle(args.bundle)
  })
}

function registrarEventosGlobales(): void {
  Application.on(Application.launchEvent, () => {
    log('Application.launch', 'arranca el runtime de NativeScript', 'app')
  })

  Application.on(Application.displayedEvent, () => {
    log('Application.displayed', 'primer frame dibujado', 'app')
  })

  Application.on(Application.resumeEvent, () => {
    log('Application.resume', '', 'app')
  })

  Application.on(Application.suspendEvent, () => {
    log('Application.suspend', '', 'app')
  })

  Application.on(Application.exitEvent, () => {
    log('Application.exit', '', 'app')
  })

  Application.on(Application.lowMemoryEvent, () => {
    log('Application.lowMemory', 'Android pide memoria: riesgo de morir', 'app')
  })

  Application.on(Application.orientationChangedEvent, (args: OrientationChangedEventData) => {
    marker(`rotacion -> ${args.newValue}`)
    log('Application.orientationChanged', `nueva orientacion: ${args.newValue}`, 'app')
  })
}

let registrado = false

/** Se llama una sola vez, ANTES de Application.run(), para no perder `launch`. */
export function registrarCicloDeVida(): void {
  if (registrado) {
    return
  }

  registrado = true

  registrarEventosGlobales()
  registrarEventosDeActivity()
}
