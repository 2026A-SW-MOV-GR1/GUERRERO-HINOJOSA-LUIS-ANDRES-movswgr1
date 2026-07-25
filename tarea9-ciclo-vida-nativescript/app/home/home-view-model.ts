import { Observable, PropertyChangeData } from '@nativescript/core'

import { Contador } from '../counter-store'
import { clearLog, log, logAsText, logEntries, marker } from '../lifecycle-log'

export class HomeViewModel extends Observable {
  /**
   * Contador VOLATIL: vive solo dentro de esta instancia del ViewModel.
   * Si la Activity se recrea, NativeScript construye un ViewModel nuevo y este
   * numero vuelve a 0. Es el "control" del experimento: sirve para ver la
   * diferencia frente al contador persistido.
   */
  private _volatil = 0

  readonly logEntries = logEntries

  constructor() {
    super()

    // El contador bueno NO se inicializa en 0: se lee del store, que ya fue
    // restaurado desde el Bundle o desde SharedPreferences en onCreate.
    log('HomeViewModel', `construido con contador = ${Contador.valor}`, 'page')

    // Si Android recrea la Activity, NativeScript conserva este ViewModel: la
    // restauracion ocurre sin que nadie vuelva a construirlo. Sin esta
    // suscripcion la pantalla seguiria mostrando los valores previos.
    Contador.suscribir(() => this.refrescar())

    this.refrescar()
  }

  get count(): number {
    return Contador.valor
  }

  get volatil(): number {
    return this._volatil
  }

  get bundleTexto(): string {
    const v = Contador.valorEnBundle

    return v === null ? 'sin dato' : String(v)
  }

  get settingsTexto(): string {
    return String(Contador.valorEnSettings)
  }

  get persistencia(): boolean {
    return Contador.persistenciaActiva
  }

  /**
   * Se maneja con el evento y no con binding de dos vias: `Observable.set()`
   * guarda en un mapa interno y no invocaria el setter, asi que el store nunca
   * se enteraria del cambio.
   */
  onPersistenciaChange(args: PropertyChangeData): void {
    Contador.persistenciaActiva = <boolean>args.value
    this.notifyPropertyChange('persistenciaTexto', this.persistenciaTexto)
  }

  get persistenciaTexto(): string {
    return Contador.persistenciaActiva
      ? 'Persistencia ACTIVA: se restaura al recrear'
      : 'Persistencia APAGADA: el estado se perdera'
  }

  onIncrementar(): void {
    this._volatil += 1
    Contador.incrementar()
    log('+1', `contador = ${Contador.valor}`, 'state')
    this.refrescar()
  }

  onReiniciar(): void {
    this._volatil = 0
    Contador.reiniciar()
    this.refrescar()
  }

  onMarcar(): void {
    marker('marcador manual')
  }

  onLimpiarLog(): void {
    clearLog()
    log('log limpiado', '', 'state')
  }

  /** Vuelca el log completo a la terminal de un solo golpe, listo para copiar. */
  onVolcarLog(): void {
    console.log('\n===== SECUENCIA DE CICLO DE VIDA =====')
    console.log(logAsText())
    console.log('===== FIN =====\n')
  }

  /**
   * Re-lee las tres capas. Se llama tras cada accion y en `navigatedTo`, para
   * que la pantalla no muestre un valor anterior a la restauracion.
   */
  refrescar(): void {
    this.notifyPropertyChange('count', this.count)
    this.notifyPropertyChange('volatil', this.volatil)
    this.notifyPropertyChange('bundleTexto', this.bundleTexto)
    this.notifyPropertyChange('settingsTexto', this.settingsTexto)
    this.notifyPropertyChange('persistencia', this.persistencia)
    this.notifyPropertyChange('persistenciaTexto', this.persistenciaTexto)
  }
}
