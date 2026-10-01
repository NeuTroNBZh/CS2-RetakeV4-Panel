/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| The "limiter.define" method creates an HTTP middleware to apply rate
| limits on a route or a group of routes.
|
*/

import limiter from '@adonisjs/limiter/services/main'

export const loginThrottle = limiter.define('login', (ctx) =>
  limiter.allowRequests(10).every('1 minute').usingKey(`login_${ctx.request.ip()}`)
)

export const writeThrottle = limiter.define('writes', (ctx) =>
  limiter
    .allowRequests(30)
    .every('1 minute')
    .usingKey(`write_${ctx.auth.user?.steamId ?? ctx.request.ip()}`)
)
