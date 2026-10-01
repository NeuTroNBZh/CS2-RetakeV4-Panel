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

router.on('/').renderInertia('home', {}).as('home')

for (const module of activeModules) {
  module.registerRoutes()
}
