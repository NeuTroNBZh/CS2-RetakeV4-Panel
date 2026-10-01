import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import { buildLoginUrl, STEAM_OPENID_ENDPOINT, verifyAssertion } from '#core/steam/openid'

export class SteamOpenId {
  private callbackUrl(): string {
    return new URL('/auth/steam/callback', env.get('APP_URL')).toString()
  }

  loginUrl(): string {
    return buildLoginUrl(this.callbackUrl(), new URL(env.get('APP_URL')).origin)
  }

  async verify(query: Record<string, unknown>): Promise<string | null> {
    return verifyAssertion(
      query,
      this.callbackUrl(),
      async (body) => {
        const response = await fetch(STEAM_OPENID_ENDPOINT, {
          method: 'POST',
          body,
          signal: AbortSignal.timeout(10000),
        })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        return response.text()
      },
      (reason) => logger.warn({ reason }, 'Steam login rejected')
    )
  }
}
