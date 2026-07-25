#!/usr/bin/env bash
#
# Automatiza los experimentos del taller y captura el log limpio.
#
#   ./experimentos.sh rotar     -> gira a horizontal y vuelve a vertical
#   ./experimentos.sh home      -> sale al Home y regresa a la app
#   ./experimentos.sh matar     -> simula que Android mata el proceso en 2do plano
#   ./experimentos.sh frio      -> cierra la app del todo y la vuelve a abrir
#   ./experimentos.sh logcat    -> sigue el log del ciclo de vida en vivo
#   ./experimentos.sh limpiar   -> borra SharedPreferences (contador a 0 de verdad)
#
set -euo pipefail

ADB="${ANDROID_HOME:-$HOME/AppData/Local/Android/Sdk}/platform-tools/adb"
PKG="org.nativescript.ContadorCicloVida"
ACT="$PKG/com.tns.NativeScriptActivity"

pausa() { sleep "${1:-2}"; }

rotar_a() {
  "$ADB" shell settings put system accelerometer_rotation 0
  "$ADB" shell settings put system user_rotation "$1"
}

case "${1:-}" in
  rotar)
    echo ">>> vertical -> horizontal"
    rotar_a 1
    pausa 3
    echo ">>> horizontal -> vertical"
    rotar_a 0
    pausa 2
    echo ">>> listo. Revisa el log en pantalla o corre: $0 logcat"
    ;;

  home)
    echo ">>> saliendo al Home"
    "$ADB" shell input keyevent KEYCODE_HOME
    pausa 3
    echo ">>> volviendo a la app"
    "$ADB" shell am start -n "$ACT"
    pausa 2
    ;;

  matar)
    # `am kill` solo mata procesos en segundo plano, que es exactamente lo que
    # hace Android bajo presion de memoria. El Bundle SI sobrevive a esto.
    echo ">>> Home + kill del proceso en segundo plano"
    "$ADB" shell input keyevent KEYCODE_HOME
    pausa 2
    "$ADB" shell am kill "$PKG"
    pausa 2
    echo ">>> reabriendo (Android restaura desde el Bundle)"
    "$ADB" shell am start -n "$ACT"
    pausa 3
    ;;

  frio)
    # force-stop descarta tambien el Bundle: es el equivalente a deslizar la app
    # fuera de Recientes. Solo SharedPreferences sobrevive.
    echo ">>> force-stop (arranque en frio, sin Bundle)"
    "$ADB" shell am force-stop "$PKG"
    pausa 2
    "$ADB" shell am start -n "$ACT"
    pausa 3
    ;;

  logcat)
    echo ">>> siguiendo el ciclo de vida (Ctrl+C para salir)"
    "$ADB" logcat -c
    "$ADB" logcat | grep --line-buffered "CICLO"
    ;;

  limpiar)
    echo ">>> borrando datos de la app (SharedPreferences incluido)"
    "$ADB" shell pm clear "$PKG"
    ;;

  *)
    sed -n '3,12p' "$0"
    exit 1
    ;;
esac
