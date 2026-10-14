import { test } from '@japa/runner'
import { readFile } from 'node:fs/promises'

// Copies of contract/stats/views.v*.json from CS2-RetakeV4: the read-only views the plugin exposes for websites.
type StatsContract = { version: number; views: Record<string, string[]> }

const NAMES = ['views.v1.json', 'views.v2.json']

async function contract(name: string): Promise<StatsContract> {
  const text = await readFile(
    new URL(`../../fixtures/contract/stats/${name}`, import.meta.url),
    'utf8'
  )
  return JSON.parse(text) as StatsContract
}

test.group('stats views contract', () => {
  test('v1 and v2 carry their version', async ({ assert }) => {
    const v1 = await contract('views.v1.json')
    const v2 = await contract('views.v2.json')
    assert.equal(v1.version, 1)
    assert.equal(v2.version, 2)
  })

  test('every view lists unique columns', async ({ assert }) => {
    for (const name of NAMES) {
      const { views } = await contract(name)
      for (const [view, columns] of Object.entries(views)) {
        assert.isAbove(columns.length, 0, view)
        assert.equal(new Set(columns).size, columns.length, view)
      }
    }
  })

  test('no view exposes an IP address', async ({ assert }) => {
    for (const name of NAMES) {
      const { views } = await contract(name)
      for (const [view, columns] of Object.entries(views)) {
        assert.isFalse(
          columns.some((c) => /(^|_)ip($|_)|address/.test(c)),
          view
        )
      }
    }
  })

  test('v2 adds the views of RetakeV4 4.9', async ({ assert }) => {
    const v1 = await contract('views.v1.json')
    const v2 = await contract('views.v2.json')
    const v1Views = Object.keys(v1.views)
    const v2Views = Object.keys(v2.views)
    assert.isTrue(v2Views.every((view) => !v1Views.includes(view)))
    for (const view of [
      'v2_stats_players',
      'v_stats_player_behaviour',
      'v_stats_retake_odds',
      'v_stats_replays',
      'v_stats_replay_tracks',
    ]) {
      assert.include(v2Views, view)
    }
  })
})
