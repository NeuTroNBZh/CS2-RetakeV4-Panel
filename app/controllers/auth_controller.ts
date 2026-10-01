import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import Player from '#models/player'
import { SteamOpenId } from '#core/steam/steam_openid_service'
import { fetchProfile } from '#core/steam/steam_profiles'

@inject()
export default class AuthController {
  constructor(private readonly steam: SteamOpenId) {}

  async login({ response }: HttpContext) {
    return response.redirect(this.steam.loginUrl(), false)
  }

  async callback({ request, response, auth, session }: HttpContext) {
    const steamId = await this.steam.verify(request.qs())
    if (!steamId) {
      session.flash('error', 'core.login.failed')
      return response.redirect('/', false)
    }
    const profile = await fetchProfile(steamId, env.get('STEAM_API_KEY'), fetch, (reason) =>
      logger.warn({ reason, steamId }, 'Steam profile not fetched')
    )
    const player = await Player.updateOrCreate(
      { steamId },
      {
        lastLoginAt: DateTime.utc(),
        ...(profile ? { displayName: profile.name, avatarUrl: profile.avatarUrl } : {}),
      }
    )
    await auth.use('web').login(player)
    return response.redirect('/', false)
  }

  async logout({ response, auth }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/', false)
  }
}
