import { test } from '@japa/runner'
import { fetchProfile } from '#core/steam/steam_profiles'

const STEAM_ID = '76561198000000001'

const respond = (body: unknown, ok = true): typeof fetch =>
  (async () => ({ ok, json: async () => body }) as Response) as typeof fetch

test.group('fetchProfile', () => {
  test('returns name and avatar', async ({ assert }) => {
    const body = {
      response: {
        players: [
          {
            steamid: STEAM_ID,
            personaname: 'Alice',
            avatarfull: 'https://avatars.steamstatic.com/a.jpg',
          },
        ],
      },
    }
    assert.deepEqual(await fetchProfile(STEAM_ID, 'key', respond(body)), {
      name: 'Alice',
      avatarUrl: 'https://avatars.steamstatic.com/a.jpg',
    })
  })

  test('returns null without an api key', async ({ assert }) => {
    assert.isNull(await fetchProfile(STEAM_ID, undefined, respond({})))
  })

  test('returns null on an error response or unexpected body', async ({ assert }) => {
    assert.isNull(await fetchProfile(STEAM_ID, 'key', respond({}, false)))
    assert.isNull(await fetchProfile(STEAM_ID, 'key', respond({ response: { players: [] } })))
  })

  test('returns null when the request throws', async ({ assert }) => {
    const failing = (async () => {
      throw new Error('network')
    }) as typeof fetch
    assert.isNull(await fetchProfile(STEAM_ID, 'key', failing))
  })
  test('reports why no profile was returned', async ({ assert }) => {
    const reasons: string[] = []
    const onError = (reason: string) => reasons.push(reason)
    const failing = (async () => {
      throw new Error('network down')
    }) as typeof fetch
    const forbidden = (async () => ({ ok: false, status: 403 }) as Response) as typeof fetch
    await fetchProfile(STEAM_ID, 'key', failing, onError)
    await fetchProfile(STEAM_ID, 'key', forbidden, onError)
    await fetchProfile(STEAM_ID, 'key', respond({ response: { players: [] } }), onError)
    assert.lengthOf(reasons, 3)
    assert.include(reasons[0], 'network down')
    assert.include(reasons[1], '403')
    assert.include(reasons[2], 'unexpected')
  })

  test('stays silent without an api key', async ({ assert }) => {
    const reasons: string[] = []
    await fetchProfile(STEAM_ID, undefined, respond({}), (reason) => reasons.push(reason))
    assert.lengthOf(reasons, 0)
  })
})
