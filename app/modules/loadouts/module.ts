import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { writeThrottle } from '#start/limiter'
import type { PanelModule } from '#core/modules/types'

const LoadoutsController = () => import('#modules/loadouts/loadouts_controller')

export const loadoutsModule: PanelModule = {
  name: 'loadouts',
  connections: ['retake'],
  menu: [{ labelKey: 'loadouts.menu', href: '/loadouts', permission: 'player' }],
  registerRoutes() {
    router
      .group(() => {
        router.get('/loadouts', [LoadoutsController, 'show']).as('loadouts.show')
        router.post('/loadouts/weapon', [LoadoutsController, 'updateWeapon']).as('loadouts.weapon').use(writeThrottle)
        router.post('/loadouts/reset', [LoadoutsController, 'reset']).as('loadouts.reset').use(writeThrottle)
        router.post('/loadouts/awp', [LoadoutsController, 'updateAwp']).as('loadouts.awp').use(writeThrottle)
      })
      .use(middleware.auth({ guards: ['web'] }))
  },
}
