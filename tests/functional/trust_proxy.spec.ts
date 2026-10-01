import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { http } from '#config/app'

const LOGIN_LIMIT = 10

test.group('Reverse proxy', (group) => {
  group.each.setup(() => testUtils.db('panel').withGlobalTransaction())

  test('the login rate limit is keyed on the client address forwarded by the proxy', async ({
    client,
  }) => {
    const forwardedFor = '203.0.113.77'
    for (let attempt = 0; attempt < LOGIN_LIMIT; attempt++) {
      const response = await client
        .get('/login')
        .header('x-forwarded-for', forwardedFor)
        .redirects(0)
      response.assertStatus(302)
    }

    const blocked = await client.get('/login').header('x-forwarded-for', forwardedFor).redirects(0)
    blocked.assertStatus(429)

    const otherClient = await client
      .get('/login')
      .header('x-forwarded-for', '203.0.113.78')
      .redirects(0)
    otherClient.assertStatus(302)
  })

  test('only private and loopback peers are trusted as proxies', ({ assert }) => {
    const trusted = http.trustProxy
    assert.isTrue(trusted('127.0.0.1', 0))
    assert.isTrue(trusted('172.18.0.2', 0))
    assert.isTrue(trusted('10.0.0.5', 0))
    assert.isTrue(trusted('192.168.1.10', 0))
    assert.isTrue(trusted('::ffff:172.18.0.2', 0))
    assert.isTrue(trusted('::1', 0))
    assert.isTrue(trusted('fd12:3456::1', 0))
    assert.isFalse(trusted('203.0.113.9', 0))
    assert.isFalse(trusted('172.32.0.1', 0))
    assert.isFalse(trusted('2001:db8::1', 0))
    assert.isFalse(trusted('not-an-ip', 0))
  })
})
