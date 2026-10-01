import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import { LoadoutRepository } from '#modules/loadouts/loadout_repository'
import { isAllowed, readCatalog } from '#modules/loadouts/catalog'
import { buildLoadoutsView } from '#modules/loadouts/loadouts_view'
import { awpValidator, resetValidator, weaponValidator } from '#modules/loadouts/validators'

const SERVICE_UNAVAILABLE = 503

@inject()
export default class LoadoutsController {
  constructor(private readonly repository: LoadoutRepository) {}

  private serverKey(): string {
    return env.get('PANEL_RETAKE_SERVER', 'default')
  }

  /**
   * Runs a repository write. A retake database failure is isolated to this module: Inertia gets a flash error
   * and a redirect back, other clients a 503.
   */
  private async guarded(
    { request, response, session, logger }: HttpContext,
    action: () => Promise<unknown>
  ) {
    try {
      await action()
    } catch (error) {
      logger.error({ err: error }, 'loadouts: retake database unavailable')
      if (request.header('x-inertia')) {
        session.flash('error', 'loadouts.unavailable')
        return response.redirect().back()
      }
      return response
        .status(SERVICE_UNAVAILABLE)
        .send({ errors: [{ message: 'loadouts.unavailable' }] })
    }
    session.flash('success', 'loadouts.saved')
    return response.redirect().back()
  }

  async show({ inertia, auth, response, logger }: HttpContext) {
    try {
      const [row, preferences] = await Promise.all([
        this.repository.catalogRow(this.serverKey()),
        this.repository.preferences(auth.user!.steamId),
      ])
      return inertia.render('loadouts/index', {
        view: buildLoadoutsView(readCatalog(row), preferences),
      })
    } catch (error) {
      logger.error({ err: error }, 'loadouts: retake database unavailable')
      response.status(SERVICE_UNAVAILABLE)
      return inertia.render('loadouts/unavailable', {})
    }
  }

  async updateWeapon(ctx: HttpContext) {
    const { request, response, auth, session } = ctx
    const selection = await request.validateUsing(weaponValidator)
    let result
    try {
      result = readCatalog(await this.repository.catalogRow(this.serverKey()))
    } catch (error) {
      return this.guarded(ctx, () => Promise.reject(error))
    }
    if (result.kind !== 'ok' || !isAllowed(result.catalog, selection)) {
      // The catalog may have been republished since the page was shown: Inertia gets a flash, API clients a 422.
      if (request.header('x-inertia')) {
        session.flash('error', 'loadouts.not_allowed')
        return response.redirect().back()
      }
      return response.unprocessableEntity({
        errors: [{ field: 'weapon', message: 'loadouts.not_allowed' }],
      })
    }
    return this.guarded(ctx, () =>
      this.repository.setWeapon(
        auth.user!.steamId,
        selection.team,
        selection.roundType,
        selection.slot,
        selection.weapon
      )
    )
  }

  async reset(ctx: HttpContext) {
    const { team, roundType } = await ctx.request.validateUsing(resetValidator)
    return this.guarded(ctx, () => this.repository.reset(ctx.auth.user!.steamId, team, roundType))
  }

  async updateAwp(ctx: HttpContext) {
    const { team, optIn } = await ctx.request.validateUsing(awpValidator)
    return this.guarded(ctx, () => this.repository.setAwp(ctx.auth.user!.steamId, team, optIn))
  }
}
