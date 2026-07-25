# Taller: Ciclo de vida y persistencia — **NativeScript**

App de contador en NativeScript Core (TypeScript + XML) que registra los siete
callbacks del ciclo de vida de Android y demuestra tres capas de persistencia.

Probado en **Pixel 8a API 35 (Android 15)**, NativeScript CLI 9.0.6,
`@nativescript/core` 9.0.0.

---

## 1. Respuesta corta

> **Al rotar, el contador NO vuelve a 0, y `onDestroy` NO se dispara.**

NativeScript declara por defecto en su `AndroidManifest.xml`:

```xml
android:configChanges="keyboard|keyboardHidden|orientation|screenSize|smallestScreenSize|screenLayout|locale|uiMode"
```

Ese atributo le dice a Android: *"yo me encargo de estos cambios de
configuración, no destruyas mi Activity"*. Por eso la rotación no recrea nada:
el estado sobrevive **sin escribir una sola línea de persistencia**.

Es decir, el problema clásico del taller **no ocurre por defecto en
NativeScript**, y la razón está en el manifest, no en el código JavaScript.

---

## 2. Mapa de eventos: Android nativo → NativeScript

NativeScript reenvía los callbacks reales de la Activity mediante un
`ActivityLifecycleCallbacks`. Se accede por `Application.android.on(...)`:

| Android nativo | NativeScript |
|---|---|
| `onCreate(savedInstanceState)` | `Application.android.on('activityCreated')` — trae `args.bundle` |
| `onStart()` | `Application.android.on('activityStarted')` |
| `onResume()` | `Application.android.on('activityResumed')` |
| `onPause()` | `Application.android.on('activityPaused')` |
| `onStop()` | `Application.android.on('activityStopped')` |
| `onDestroy()` | `Application.android.on('activityDestroyed')` |
| `onSaveInstanceState(outState)` | `Application.android.on('saveActivityState')` — trae `args.bundle` |
| `onRestart()` | **No existe.** Hay que deducirlo. |
| `onRestoreInstanceState(b)` | **No existe** como evento separado; el Bundle llega en `activityCreated` |

### Cómo se deduce `onRestart`

Android solo llama `onRestart` cuando una Activity que ya pasó por `onStop`
vuelve a arrancar **sin haber sido destruida**. Esa condición se reconstruye con
dos banderas ([lifecycle-hooks.ts](app/lifecycle-hooks.ts)):

```ts
android.on('activityStarted', () => {
  if (!recienCreada && estuvoDetenida) {
    log('onRestart()', 'deducido: hubo onStop y NO hubo onDestroy')
  }
  recienCreada = false
  estuvoDetenida = false
  log('onStart()')
})
```

**Cuidado con no confundir dos capas.** NativeScript también tiene eventos
propios (`Application.on('launch' | 'suspend' | 'resume' | 'exit')`) y eventos
de `Page` (`navigatingTo`, `loaded`, `unloaded`…). **No son** los callbacks de
Android: una `Page` se crea y destruye por navegación, no por el SO. La app
registra las tres capas con colores distintos para que se vea la diferencia.

---

## 3. Las tres capas de persistencia

Implementadas en [counter-store.ts](app/counter-store.ts). Cada una muere en un
escenario distinto:

| Capa | Dónde vive | Muere cuando |
|---|---|---|
| **1. Variable de módulo** | Heap de V8 (del *proceso*, no de la Activity) | Android mata el proceso |
| **2. Bundle** (`onSaveInstanceState`) | Fuera del proceso, lo guarda Android | El usuario cierra la app desde Recientes |
| **3. SharedPreferences** (`ApplicationSettings`) | Disco | Nunca (sobrevive a arranque en frío) |

Escritura en el Bundle — equivalente exacto a `onSaveInstanceState(outState)`:

```ts
android.on('saveActivityState', (args) => {
  args.bundle.putInt('contadorValor', memoria)
})
```

Lectura — equivalente a `onRestoreInstanceState`, pero el Bundle llega en `onCreate`:

```ts
android.on('activityCreated', (args) => {
  if (args.bundle?.containsKey('contadorValor')) {
    memoria = args.bundle.getInt('contadorValor')   // vino del Bundle
  } else {
    memoria = ApplicationSettings.getNumber('contador.valor', 0)  // arranque en frío
  }
})
```

---

## 4. Logs capturados

### 4.1 Arranque en frío

```
#001 onCreate(savedInstanceState)  ->  Bundle = null -> arranque limpio
#002    <- SharedPreferences       ->  contador.valor = 0 (sin Bundle: arranque en frio)
#003 Application.launch            ->  arranca el runtime de NativeScript
#004 onStart()
#005 Page.navigatingTo             ->  isBackNavigation = false
#006 HomeViewModel                 ->  construido con contador = 0
#007 onResume()                    ->  contador en memoria = 0
#008 Page.loaded
#009 Application.resume
#010 Application.displayed         ->  primer frame dibujado
#011 Page.navigatedTo
```

Nota de orden: `onCreate` llega **antes** que `Application.launch` y antes de
que se construya el ViewModel. Por eso restaurar el contador en `activityCreated`
funciona: el ViewModel ya lee el valor recuperado.

### 4.2 Rotación (configuración por defecto) — contador a 10, se gira

```
#022 ===== ROTACION -> LANDSCAPE =====
#023 Application.orientationChanged  ->  nueva orientacion: landscape
```

**Eso es todo.** Ni `onPause`, ni `onStop`, ni `onDestroy`, ni `onCreate`.
En pantalla: contador persistido = **10**, contador volátil = **10**.

### 4.3 Multitarea: Home y volver

```
#026 Application.suspend
#027 onPause()                     ->  volcado a SharedPreferences = 10
#028 onStop()
#029 Page.unloaded
#030 onSaveInstanceState(outState)
#031    -> outState.putInt         ->  contadorValor = 10
        ── (usuario vuelve a la app) ──
#032 onRestart()                   ->  deducido: hubo onStop y NO hubo onDestroy
#033 onStart()
#034 Page.loaded
#035 onResume()                    ->  contador en memoria = 10
#036 Application.resume
```

Dato observado: **`onSaveInstanceState` se dispara DESPUÉS de `onStop`**, no
antes. Es el comportamiento de Android 9 (API 28) en adelante.

### 4.4 Android mata el proceso en segundo plano

```
#041 onSaveInstanceState(outState)
#042    -> outState.putInt         ->  contadorValor = 10
        ── proceso muerto: el contador de secuencia reinicia ──
#001 onCreate(savedInstanceState)  ->  Bundle = null -> arranque limpio
#002    <- SharedPreferences       ->  contador.valor = 10 (sin Bundle)
```

El contador se recuperó de **disco**, porque relanzar con
`am start -n <componente>` es un lanzamiento nuevo y Android no entrega el
Bundle. Aquí la capa 3 es la que salva el estado.

### 4.5 Experimento: quitando `configChanges` del manifest

Reemplazando el atributo por `android:configChanges="keyboard|keyboardHidden|locale"`
y recompilando, la rotación **sí** destruye la Activity:

```
#023 Application.orientationChanged  ->  nueva orientacion: landscape
#024 Application.suspend
#025 onPause()                       ->  volcado a SharedPreferences = 10
#026 onStop()
#027 Page.unloaded
#028 onSaveInstanceState(outState)
#029    -> outState.putInt           ->  contadorValor = 10
#030 onDestroy()                     ->  la Activity muere
#031 onCreate(savedInstanceState)    ->  Bundle RECIBIDO -> la Activity se esta recreando
#032    <- savedInstanceState        ->  contadorValor = 10 (Bundle)
#033 onStart()
#034 Page.loaded
#035 onResume()                      ->  contador en memoria = 10
#036 Application.resume
```

Ahí sí aparece la secuencia completa y el Bundle se usa de verdad.

---

## 5. Conclusión: en NativeScript solo la muerte del proceso borra el estado

Un detalle no evidente del log 4.5: **no aparece `HomeViewModel construido`**.
Aunque Android destruyó y recreó la Activity, NativeScript **no** reconstruyó el
Frame, la Page ni el ViewModel — hasta el contador etiquetado "volátil" siguió
en 10.

La razón: el runtime V8 vive en la `Application`, no en la `Activity`. Al
recrearse la Activity, NativeScript le vuelve a enchufar el árbol de vistas que
ya tenía en memoria.

Consecuencia práctica: en NativeScript, la Activity puede morir sin que el
estado JavaScript se entere. **Lo único que realmente resetea el estado es que
Android mate el proceso** (o un arranque en frío). Por eso la capa que de
verdad importa aquí es SharedPreferences, no el Bundle.

Esto obligó a un ajuste en el código: como el ViewModel no se reconstruye, nadie
refresca la pantalla después de restaurar. Se resolvió con una suscripción
(`Contador.suscribir`) que la vista registra y el store dispara al restaurar.

### Tabla resumen

| Escenario | Variable de módulo | Bundle | SharedPreferences | ¿Se pierde? |
|---|---|---|---|---|
| Rotación (por defecto) | sobrevive | no se usa | sobrevive | no |
| Rotación (sin `configChanges`) | sobrevive | **se usa** | sobrevive | no |
| Home y volver | sobrevive | se guarda | sobrevive | no |
| SO mata el proceso | **muere** | según cómo se relance | sobrevive | no |
| Arranque en frío | **muere** | **muere** | sobrevive | no |

---

## 6. Cómo ejecutarlo

### Con el CLI

```bash
ns run android
```

**En Windows hay que parchear el PATH primero.** El CLI invoca `gradlew.bat` sin
ruta desde el directorio del plugin y falla con *"no se reconoce como un comando
interno o externo"*:

```powershell
$env:PATH = "$PWD\platforms\android;$env:PATH"; ns build android
```

### Desde Android Studio

Abrir la carpeta **`platforms/android`** (no la raíz del proyecto): es un
proyecto Gradle completo, con el bundle JS ya empaquetado en
`app/src/main/assets/app/`.

- `platforms/` es una carpeta **generada**. No editar nada ahí: `ns clean` la borra.
- Tras cambiar código TypeScript hay que regenerar el bundle con `ns prepare android`
  antes de darle Run en Android Studio; si no, se despliega el JS viejo.
- En Logcat, filtrar por `CICLO` para ver solo el ciclo de vida.

### Experimentos automatizados

```bash
./experimentos.sh rotar     # gira y vuelve
./experimentos.sh home      # sale al Home y regresa
./experimentos.sh matar     # simula que el SO mata el proceso
./experimentos.sh frio      # arranque en frío (sin Bundle)
./experimentos.sh logcat    # sigue el ciclo de vida en vivo
```

---

## 7. Archivos relevantes

| Archivo | Qué hace |
|---|---|
| [lifecycle-hooks.ts](app/lifecycle-hooks.ts) | Suscripción a los 7 callbacks + deducción de `onRestart` |
| [counter-store.ts](app/counter-store.ts) | Contador y las tres capas de persistencia |
| [lifecycle-log.ts](app/lifecycle-log.ts) | Log a consola y a pantalla |
| [home-view-model.ts](app/home/home-view-model.ts) | Contador persistido vs. volátil |
| [AndroidManifest.xml](App_Resources/Android/src/main/AndroidManifest.xml) | Donde está `configChanges` — la clave del taller |
