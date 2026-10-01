import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Player from '#models/player'

test.group('Home', (group) => {
  group.each.setup(() => testUtils.db('panel').withGlobalTransaction())

  test('guests see the login button and no menu', async ({ client }) => {
    const response = await client.get('/').withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('home')
    response.assertInertiaPropsContains({ user: null, menu: [] })
  })

  test('players see their menu', async ({ client }) => {
    const player = await Player.create({ steamId: '76561198000000001' })
    const response = await client.get('/').loginAs(player).withInertia()
    response.assertInertiaPropsContains({ user: { steamId: '76561198000000001' } })
  })

  test('the locale cookie is honoured', async ({ client }) => {
    const response = await client
      .post('/locale')
      .withCsrfToken()
      .form({ locale: 'fr' })
      .redirects(0)
    response.assertStatus(302)
    response.assertCookie('panel_locale', 'fr')
  })

  test('an unknown locale is rejected', async ({ client }) => {
    const response = await client
      .post('/locale')
      .withCsrfToken()
      .form({ locale: 'de' })
      .redirects(0)
    response.assertStatus(302)
    response.assertCookieMissing('panel_locale')
  })
})
