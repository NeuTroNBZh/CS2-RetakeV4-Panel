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
const HomeController = () => import('#controllers/home_controller')
const LocaleController = () => import('#controllers/locale_controller')
const HealthController = () => import('#controllers/health_controller')

router.get('/health', [HealthController, 'show']).as('health')
router.get('/', [HomeController, 'show']).as('home')
router.post('/locale', [LocaleController, 'update']).as('locale.update')

router.get('/login', [AuthController, 'login']).as('auth.login').use(loginThrottle)
router
  .get('/auth/steam/callback', [AuthController, 'callback'])
  .as('auth.callback')
  .use(loginThrottle)
router.post('/logout', [AuthController, 'logout']).as('auth.logout')

for (const module of activeModules) {
  module.registerRoutes()
}
