import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import Player from '#models/player'
import { SteamOpenId } from '#core/steam/steam_openid_service'

const STEAM_ID = '76561198000000001'

class FakeSteamOpenId extends SteamOpenId {
  constructor(private readonly result: string | null) {
    super()
  }
  loginUrl() {
    return 'https://steamcommunity.com/openid/login?fake=1'
  }
  async verify() {
    return this.result
  }
}

test.group('Steam login', (group) => {
  group.each.setup(() => testUtils.db('panel').withGlobalTransaction())
  group.each.teardown(() => app.container.restore(SteamOpenId))

  test('redirects to Steam without forwarding the query string', async ({ client }) => {
    const response = await client.get('/login?x=1').redirects(0)
    response.assertStatus(302)
    response.assertHeader('location', 'https://steamcommunity.com/openid/login?fake=1')
  }).setup(() => app.container.swap(SteamOpenId, () => new FakeSteamOpenId(null)))

  test('a valid callback logs the player in and records him', async ({ client, assert }) => {
    app.container.swap(SteamOpenId, () => new FakeSteamOpenId(STEAM_ID))
    const response = await client.get('/auth/steam/callback?openid.sig=x').redirects(0)
    response.assertStatus(302)
    response.assertHeader('location', '/')
    response.assertSession('auth_web', STEAM_ID)
    const player = await Player.findOrFail(STEAM_ID)
    assert.equal(player.steamId, STEAM_ID)
  })

  test('an invalid callback does not log in', async ({ client, assert }) => {
    app.container.swap(SteamOpenId, () => new FakeSteamOpenId(null))
    const response = await client.get('/auth/steam/callback?openid.sig=x').redirects(0)
    response.assertStatus(302)
    response.assertHeader('location', '/')
    response.assertSessionMissing('auth_web')
    assert.isNull(await Player.find(STEAM_ID))
  })

  test('logout with a csrf token ends the session', async ({ client }) => {
    const player = await Player.create({ steamId: STEAM_ID })
    const response = await client.post('/logout').loginAs(player).withCsrfToken().redirects(0)
    response.assertStatus(302)
    response.assertSessionMissing('auth_web')
  })

  test('logout without a csrf token keeps the player logged in', async ({ client }) => {
    const player = await Player.create({ steamId: STEAM_ID })
    const response = await client.post('/logout').loginAs(player).redirects(0)
    response.assertStatus(302)
    response.assertSession('auth_web', STEAM_ID)
  })
})
