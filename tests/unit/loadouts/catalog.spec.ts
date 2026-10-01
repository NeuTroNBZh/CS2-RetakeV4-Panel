import { test } from '@japa/runner'
import { readFile } from 'node:fs/promises'
import {
  ANY_ROUND_TYPE,
  TEAM_VALUE,
  hasChoice,
  isAllowed,
  offersAwp,
  options,
  readCatalog,
  type Catalog,
} from '#modules/loadouts/catalog'

const fixture = async (name: string) => readFile(new URL(`../../fixtures/contract/${name}`, import.meta.url), 'utf8')

async function contractCatalog(): Promise<Catalog> {
  const result = readCatalog({ format_version: 1, catalog: await fixture('catalog.v1.json') })
  if (result.kind !== 'ok') throw new Error(`fixture should parse, got ${result.kind}`)
  return result.catalog
}

test.group('readCatalog', () => {
  test('reads the contract fixture', async ({ assert }) => {
    const catalog = await contractCatalog()
    assert.deepEqual(catalog.roundTypes.map((r) => r.name), ['Pistol', 'FullBuy'])
  })

  test('missing row', ({ assert }) => {
    assert.deepEqual(readCatalog(null), { kind: 'missing' })
  })

  test('unsupported version', ({ assert }) => {
    assert.deepEqual(readCatalog({ format_version: 2, catalog: '{"roundTypes":[]}' }), { kind: 'unsupported', formatVersion: 2 })
  })

  test('invalid JSON', ({ assert }) => {
    assert.deepEqual(readCatalog({ format_version: 1, catalog: '{oops' }), { kind: 'invalid' })
  })

  test('wrong shape', ({ assert }) => {
    assert.deepEqual(readCatalog({ format_version: 1, catalog: '{"roundTypes":[{"name":"X"}]}' }), { kind: 'invalid' })
    assert.deepEqual(readCatalog({ format_version: 1, catalog: '[]' }), { kind: 'invalid' })
  })
})

test.group('catalog rules', () => {
  test('options per round type, team and slot', async ({ assert }) => {
    const catalog = await contractCatalog()
    assert.deepEqual(options(catalog, 'FullBuy', 'CT', 'primary'), ['weapon_m4a1_silencer', 'weapon_aug'])
    assert.deepEqual(options(catalog, 'Pistol', 'T', 'primary'), [])
    assert.deepEqual(options(catalog, 'Unknown', 'T', 'primary'), [])
  })

  test('a round type has a choice when one slot offers more than one weapon', async ({ assert }) => {
    const catalog = await contractCatalog()
    assert.isTrue(hasChoice(catalog.roundTypes[0], 'T'))
  })

  test('only catalog weapons are allowed', async ({ assert }) => {
    const catalog = await contractCatalog()
    assert.isTrue(isAllowed(catalog, { roundType: 'FullBuy', team: 'T', slot: 'primary', weapon: 'weapon_sg556' }))
    assert.isFalse(isAllowed(catalog, { roundType: 'FullBuy', team: 'T', slot: 'primary', weapon: 'weapon_awp' }))
    assert.isFalse(isAllowed(catalog, { roundType: 'FullBuy', team: 'T', slot: 'primary', weapon: 'weapon_m4a1_silencer' }))
    assert.isFalse(isAllowed(catalog, { roundType: 'Nope', team: 'T', slot: 'primary', weapon: 'weapon_ak47' }))
  })

  test('the AWP toggle shows when a round type hands it out', async ({ assert }) => {
    assert.isTrue(offersAwp(await contractCatalog()))
    assert.isFalse(offersAwp({ roundTypes: [] }))
  })
})

test.group('player_loadout contract', () => {
  test('team values and AWP key match the plugin', async ({ assert }) => {
    const contract = JSON.parse(await fixture('player_loadout.json'))
    assert.deepEqual(contract.teams, TEAM_VALUE)
    assert.equal(contract.anyRoundType, ANY_ROUND_TYPE)
  })
})
