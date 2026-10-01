/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { activeModules } from '#start/modules'
import { loginThrottle } from '#start/limiter'

const AuthController = () => import('#controllers/auth_controller')

router.on('/').renderInertia('home', {}).as('home')

router.get('/login', [AuthController, 'login']).as('auth.login').use(loginThrottle)
router
  .get('/auth/steam/callback', [AuthController, 'callback'])
  .as('auth.callback')
  .use(loginThrottle)
router.post('/logout', [AuthController, 'logout']).as('auth.logout')

for (const module of activeModules) {
  module.registerRoutes()
}
