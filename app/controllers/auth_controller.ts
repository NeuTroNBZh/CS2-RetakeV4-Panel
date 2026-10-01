import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import Player from '#models/player'
import { SteamOpenId } from '#core/steam/steam_openid_service'
import { fetchProfile } from '#core/steam/steam_profiles'

@inject()
export default class AuthController {
  constructor(private readonly steam: SteamOpenId) {}

  async login({ response }: HttpContext) {
    return response.redirect(this.steam.loginUrl())
  }

  async callback({ request, response, auth, session }: HttpContext) {
    const steamId = await this.steam.verify(request.qs())
    if (!steamId) {
      session.flash('error', 'core.login.failed')
      return response.redirect('/')
    }
    const profile = await fetchProfile(steamId, env.get('STEAM_API_KEY'), fetch)
    const player = await Player.updateOrCreate(
      { steamId },
      {
        lastLoginAt: DateTime.utc(),
        ...(profile ? { displayName: profile.name, avatarUrl: profile.avatarUrl } : {}),
      }
    )
    await auth.use('web').login(player)
    return response.redirect('/')
  }

  async logout({ response, auth }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/')
  }
}
