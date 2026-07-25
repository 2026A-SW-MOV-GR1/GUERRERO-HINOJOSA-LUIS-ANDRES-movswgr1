import { EventData, NavigatedData, Page, ScrollView } from '@nativescript/core'

import { log, logEntries } from '../lifecycle-log'
import { HomeViewModel } from './home-view-model'

/**
 * Ciclo de vida a nivel de PAGE. Es el nivel que la mayoria de tutoriales de
 * NativeScript llama "ciclo de vida", pero no es el de Android: una Page se
 * crea y destruye por navegacion, no por el sistema operativo.
 *
 * Se registra aqui para dejar claro en el log que son dos capas distintas.
 */

let scrollLog: ScrollView | null = null

export function onNavigatingTo(args: NavigatedData): void {
  const page = <Page>args.object

  log('Page.navigatingTo', `isBackNavigation = ${args.isBackNavigation}`, 'page')

  page.bindingContext = new HomeViewModel()

  page.on(Page.loadedEvent, () => log('Page.loaded', '', 'page'))
  page.on(Page.unloadedEvent, () => log('Page.unloaded', '', 'page'))
  page.on(Page.navigatingFromEvent, () => log('Page.navigatingFrom', '', 'page'))
  page.on(Page.navigatedFromEvent, () => log('Page.navigatedFrom', '', 'page'))
}

export function onNavigatedTo(args: NavigatedData): void {
  const page = <Page>args.object
  const vm = <HomeViewModel>page.bindingContext

  log('Page.navigatedTo', '', 'page')

  // Ultimo resync: en este punto la restauracion desde el Bundle ya ocurrio
  // con certeza, asi que la pantalla nunca muestra un valor previo.
  vm?.refrescar()
}

export function onLogLoaded(args: EventData): void {
  scrollLog = <ScrollView>args.object

  // Mantener el log pegado abajo para que el ultimo evento siempre sea visible.
  logEntries.on('change', () => {
    setTimeout(() => {
      scrollLog?.scrollToVerticalOffset(scrollLog.scrollableHeight, false)
    }, 40)
  })
}
