import { Application } from '@nativescript/core'

import { registrarCicloDeVida } from './lifecycle-hooks'

// El orden importa: hay que suscribirse ANTES de Application.run(), porque
// `launch` y el primer `activityCreated` se disparan dentro de esa llamada.
// Si registramos despues, perdemos los dos primeros eventos de la secuencia.
registrarCicloDeVida()

Application.run({ moduleName: 'app-root' })

/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/
