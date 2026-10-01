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

  async show({ inertia, auth, response, logger }: HttpContext) {
    try {
      const [row, preferences] = await Promise.all([
        this.repository.catalogRow(this.serverKey()),
        this.repository.preferences(auth.user!.steamId),
      ])
      return inertia.render('loadouts/index', { view: buildLoadoutsView(readCatalog(row), preferences) })
    } catch (error) {
      logger.error({ err: error }, 'loadouts: retake database unavailable')
      response.status(SERVICE_UNAVAILABLE)
      return inertia.render('loadouts/unavailable', {})
    }
  }

  async updateWeapon({ request, response, auth, session }: HttpContext) {
    const selection = await request.validateUsing(weaponValidator)
    const result = readCatalog(await this.repository.catalogRow(this.serverKey()))
    if (result.kind !== 'ok' || !isAllowed(result.catalog, selection)) {
      // The catalog may have been republished since the page was shown: Inertia gets a flash, API clients a 422.
      if (request.header('x-inertia')) {
        session.flash('error', 'loadouts.not_allowed')
        return response.redirect().back()
      }
      return response.unprocessableEntity({ errors: [{ field: 'weapon', message: 'loadouts.not_allowed' }] })
    }
    await this.repository.setWeapon(auth.user!.steamId, selection.team, selection.roundType, selection.slot, selection.weapon)
    session.flash('success', 'loadouts.saved')
    return response.redirect().back()
  }

  async reset({ request, response, auth, session }: HttpContext) {
    const { team, roundType } = await request.validateUsing(resetValidator)
    await this.repository.reset(auth.user!.steamId, team, roundType)
    session.flash('success', 'loadouts.saved')
    return response.redirect().back()
  }

  async updateAwp({ request, response, auth, session }: HttpContext) {
    const { optIn } = await request.validateUsing(awpValidator)
    await this.repository.setAwp(auth.user!.steamId, optIn)
    session.flash('success', 'loadouts.saved')
    return response.redirect().back()
  }
}
