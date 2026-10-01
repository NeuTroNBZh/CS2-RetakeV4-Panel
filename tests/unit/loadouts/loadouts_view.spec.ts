import { test } from '@japa/runner'
import { readFile } from 'node:fs/promises'
import { readCatalog } from '#modules/loadouts/catalog'
import { buildLoadoutsView } from '#modules/loadouts/loadouts_view'

const catalog = async () =>
  readCatalog({
    format_version: 1,
    catalog: await readFile(
      new URL('../../fixtures/contract/catalog.v1.json', import.meta.url),
      'utf8'
    ),
  })

test.group('buildLoadoutsView', () => {
  test('lists round types with a choice, per team', async ({ assert }) => {
    const view = buildLoadoutsView(await catalog(), [])
    assert.equal(view.status, 'ok')
    assert.deepEqual(
      view.teams.CT.map((r) => r.name),
      ['Pistol', 'FullBuy']
    )
    assert.deepEqual(
      view.teams.CT[1].primary.choices.map((c) => c.id),
      ['weapon_m4a1_silencer', 'weapon_aug']
    )
    assert.equal(view.teams.CT[1].primary.defaultId, 'weapon_m4a1_silencer')
    assert.equal(view.teams.CT[1].primary.choices[0].label, 'M4A1-S')
  })

  test('marks the saved choices and the AWP opt-in', async ({ assert }) => {
    const view = buildLoadoutsView(await catalog(), [
      { team: 'CT', roundType: 'FullBuy', primary: 'weapon_aug', secondary: null, awpOptIn: false },
      { team: 'T', roundType: '*', primary: null, secondary: null, awpOptIn: true },
    ])
    assert.equal(view.teams.CT[1].primary.selected, 'weapon_aug')
    assert.isNull(view.teams.CT[1].secondary.selected)
    assert.deepEqual(view.awp, { offered: true, optIn: true })
  })

  test('a saved weapon no longer offered is not shown as selected', async ({ assert }) => {
    const view = buildLoadoutsView(await catalog(), [
      {
        team: 'CT',
        roundType: 'FullBuy',
        primary: 'weapon_famas',
        secondary: null,
        awpOptIn: false,
      },
    ])
    assert.isNull(view.teams.CT[1].primary.selected)
  })

  test('reports catalog problems', ({ assert }) => {
    assert.equal(buildLoadoutsView({ kind: 'missing' }, []).status, 'missing')
    const unsupported = buildLoadoutsView({ kind: 'unsupported', formatVersion: 3 }, [])
    assert.deepEqual([unsupported.status, unsupported.formatVersion], ['unsupported', 3])
    assert.deepEqual(buildLoadoutsView({ kind: 'invalid' }, []).teams, { T: [], CT: [] })
  })
})
