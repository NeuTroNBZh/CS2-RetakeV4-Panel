import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'
import env from '#start/env'
import { activeModules } from '#start/modules'
import { can, parseAdmins } from '#core/permissions'
import { LOCALE_COOKIE, resolveLocale } from '#core/locale'

const admins = parseAdmins(env.get('PANEL_ADMINS'))

export default class InertiaMiddleware extends BaseInertiaMiddleware {
  share(ctx: HttpContext) {
    /**
     * A page may be rendered before the session or auth middleware ran (for
     * example on a 404), so the context is only partially hydrated here.
     */
    const { session, auth } = ctx as Partial<HttpContext>
    const player = auth?.user ?? null
    const steamId = player?.steamId ?? null
    const flashed = (key: string): string | undefined => {
      const value = session?.flashMessages.get(key)
      return typeof value === 'string' ? value : undefined
    }

    return {
      errors: ctx.inertia.always(this.getValidationErrors(ctx)),
      flash: ctx.inertia.always({ error: flashed('error'), success: flashed('success') }),
      locale: ctx.inertia.always(
        resolveLocale(
          ctx.request.cookie(LOCALE_COOKIE),
          ctx.request.header('accept-language'),
          env.get('PANEL_LOCALE', 'en')
        )
      ),
      user: ctx.inertia.always(
        player
          ? {
              steamId: player.steamId,
              name: player.displayName ?? player.steamId,
              avatarUrl: player.avatarUrl,
            }
          : null
      ),
      menu: ctx.inertia.always(
        activeModules
          .flatMap((module) => module.menu)
          .filter((entry) => can(steamId, entry.permission, admins))
          .map(({ labelKey, href }) => ({ labelKey, href }))
      ),
    }
  }

  async handle(ctx: HttpContext, next: NextFn) {
    await this.init(ctx)

    const output = await next()
    this.dispose(ctx)

    return output
  }
}

declare module '@adonisjs/inertia/types' {
  type MiddlewareSharedProps = InferSharedProps<InertiaMiddleware>
  export interface SharedProps extends MiddlewareSharedProps {}
}
