import { test } from '@japa/runner'
import { readFile } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'
import Player from '#models/player'
import { LoadoutRepository } from '#modules/loadouts/loadout_repository'
import { resetPluginTables } from '#tests/bootstrap'

const ALICE = '76561198000000001'

async function publishCatalog() {
  const catalog = await readFile(
    new URL('../../fixtures/contract/catalog.v1.json', import.meta.url),
    'utf8'
  )
  await db
    .connection('retake')
    .rawQuery('INSERT INTO retake_catalog VALUES (?, 1, ?, UTC_TIMESTAMP(6))', ['default', catalog])
}

async function savedPrimary(team: number, roundType: string) {
  const [rows] = await db
    .connection('retake')
    .rawQuery(
      'SELECT primary_weapon FROM player_loadout WHERE steam_id = ? AND team = ? AND round_type = ?',
      [ALICE, team, roundType]
    )
  return (rows as { primary_weapon: string | null }[])[0]?.primary_weapon ?? null
}

class FailingWritesRepository extends LoadoutRepository {
  async catalogRow(): Promise<never> {
    throw new Error('connection refused')
  }
  async reset(): Promise<never> {
    throw new Error('connection refused')
  }
  async setAwp(): Promise<never> {
    throw new Error('connection refused')
  }
}

test.group('Loadouts', (group) => {
  group.each.setup(() => testUtils.db('panel').withGlobalTransaction())
  group.each.setup(() => resetPluginTables())
  group.each.teardown(() => app.container.restore(LoadoutRepository))

  test('redirects guests to login', async ({ client }) => {
    const response = await client.get('/loadouts').redirects(0)
    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })

  test('shows the catalog and the saved choices', async ({ client }) => {
    await publishCatalog()
    const player = await Player.create({ steamId: ALICE })
    const response = await client.get('/loadouts').loginAs(player).withInertia()
    response.assertInertiaComponent('loadouts/index')
    response.assertInertiaPropsContains({
      view: { status: 'ok', awp: { offered: true, optIn: false } },
    })
  })

  test('says when no catalog was published', async ({ client }) => {
    const player = await Player.create({ steamId: ALICE })
    const response = await client.get('/loadouts').loginAs(player).withInertia()
    response.assertInertiaPropsContains({ view: { status: 'missing' } })
  })

  test('saves a weapon from the catalog', async ({ client, assert }) => {
    await publishCatalog()
    const player = await Player.create({ steamId: ALICE })
    const response = await client
      .post('/loadouts/weapon')
      .loginAs(player)
      .withCsrfToken()
      .json({ team: 'CT', roundType: 'FullBuy', slot: 'primary', weapon: 'weapon_aug' })
      .redirects(0)
    response.assertStatus(302)
    assert.equal(await savedPrimary(1, 'FullBuy'), 'weapon_aug')
  })

  test('rejects a weapon outside the catalog', async ({ client, assert }) => {
    await publishCatalog()
    const player = await Player.create({ steamId: ALICE })
    const response = await client
      .post('/loadouts/weapon')
      .loginAs(player)
      .withCsrfToken()
      .json({ team: 'CT', roundType: 'FullBuy', slot: 'primary', weapon: 'weapon_awp' })
    response.assertStatus(422)
    assert.isNull(await savedPrimary(1, 'FullBuy'))
  })

  test('redirects back with a flash error for an Inertia request outside the catalog', async ({
    client,
    assert,
  }) => {
    await publishCatalog()
    const player = await Player.create({ steamId: ALICE })
    const response = await client
      .post('/loadouts/weapon')
      .loginAs(player)
      .withCsrfToken()
      .header('x-inertia', 'true')
      .json({ team: 'CT', roundType: 'FullBuy', slot: 'primary', weapon: 'weapon_awp' })
      .redirects(0)
    response.assertStatus(302)
    assert.isNull(await savedPrimary(1, 'FullBuy'))
  })

  test('rejects an unknown round type', async ({ client }) => {
    await publishCatalog()
    const player = await Player.create({ steamId: ALICE })
    const response = await client
      .post('/loadouts/weapon')
      .loginAs(player)
      .withCsrfToken()
      .json({ team: 'CT', roundType: 'Nope', slot: 'primary', weapon: 'weapon_aug' })
    response.assertStatus(422)
  })

  test('rejects malformed input', async ({ client }) => {
    await publishCatalog()
    const player = await Player.create({ steamId: ALICE })
    const response = await client
      .post('/loadouts/weapon')
      .loginAs(player)
      .withCsrfToken()
      .json({ team: 'X', roundType: 'FullBuy', slot: 'primary', weapon: 'weapon_aug' })
      .accept('json')
    response.assertStatus(422)
  })

  test('requires a csrf token', async ({ client, assert }) => {
    await publishCatalog()
    const player = await Player.create({ steamId: ALICE })
    const response = await client
      .post('/loadouts/weapon')
      .loginAs(player)
      .json({ team: 'CT', roundType: 'FullBuy', slot: 'primary', weapon: 'weapon_aug' })
      .redirects(0)
    // Shield answers a bad token by redirecting back with an error: what matters is that nothing was written.
    assert.notEqual(response.status(), 200)
    assert.isNull(await savedPrimary(1, 'FullBuy'))
  })

  test('only writes for the logged in player', async ({ client, assert }) => {
    await publishCatalog()
    const player = await Player.create({ steamId: ALICE })
    await client.post('/loadouts/weapon').loginAs(player).withCsrfToken().json({
      team: 'CT',
      roundType: 'FullBuy',
      slot: 'primary',
      weapon: 'weapon_aug',
      steamId: '76561198000000002',
    })
    const [rows] = await db
      .connection('retake')
      .rawQuery('SELECT CAST(steam_id AS CHAR) AS steam_id FROM player_loadout')
    assert.deepEqual(
      (rows as { steam_id: string }[]).map((r) => r.steam_id),
      [ALICE]
    )
  })

  test('resets a round type and toggles the AWP', async ({ client, assert }) => {
    await publishCatalog()
    const player = await Player.create({ steamId: ALICE })
    await client
      .post('/loadouts/weapon')
      .loginAs(player)
      .withCsrfToken()
      .json({ team: 'T', roundType: 'FullBuy', slot: 'primary', weapon: 'weapon_sg556' })
    await client
      .post('/loadouts/reset')
      .loginAs(player)
      .withCsrfToken()
      .json({ team: 'T', roundType: 'FullBuy' })
    assert.isNull(await savedPrimary(0, 'FullBuy'))
    const awp = await client
      .post('/loadouts/awp')
      .loginAs(player)
      .withCsrfToken()
      .json({ optIn: true })
      .redirects(0)
    awp.assertStatus(302)
  })

  test('shows the module error when the retake database fails', async ({ client }) => {
    class FailingRepository extends LoadoutRepository {
      async catalogRow(): Promise<never> {
        throw new Error('connection refused')
      }
    }
    app.container.swap(LoadoutRepository, () => new FailingRepository())
    const player = await Player.create({ steamId: ALICE })
    const response = await client.get('/loadouts').loginAs(player).withInertia()
    response.assertStatus(503)
    response.assertInertiaComponent('loadouts/unavailable')
    const home = await client.get('/').loginAs(player).withInertia()
    home.assertStatus(200)
  })

  test('answers 503 to a write when the retake database fails', async ({ client, assert }) => {
    await publishCatalog()
    app.container.swap(LoadoutRepository, () => new FailingWritesRepository())
    const player = await Player.create({ steamId: ALICE })
    const weapon = await client
      .post('/loadouts/weapon')
      .loginAs(player)
      .withCsrfToken()
      .json({ team: 'CT', roundType: 'FullBuy', slot: 'primary', weapon: 'weapon_aug' })
    weapon.assertStatus(503)
    const awp = await client
      .post('/loadouts/awp')
      .loginAs(player)
      .withCsrfToken()
      .json({ optIn: true })
    awp.assertStatus(503)
    const reset = await client
      .post('/loadouts/reset')
      .loginAs(player)
      .withCsrfToken()
      .json({ team: 'CT', roundType: 'FullBuy' })
    reset.assertStatus(503)
    assert.isNull(await savedPrimary(1, 'FullBuy'))
  })

  test('redirects back with an error for an Inertia write when the retake database fails', async ({
    client,
  }) => {
    app.container.swap(LoadoutRepository, () => new FailingWritesRepository())
    const player = await Player.create({ steamId: ALICE })
    const response = await client
      .post('/loadouts/awp')
      .loginAs(player)
      .withCsrfToken()
      .header('x-inertia', 'true')
      .json({ optIn: true })
      .redirects(0)
    response.assertStatus(302)
  })

  test('limits writes to 30 per minute and per player', async ({ client }) => {
    const player = await Player.create({ steamId: '76561198000000099' })
    for (let i = 0; i < 30; i++) {
      const ok = await client
        .post('/loadouts/reset')
        .loginAs(player)
        .withCsrfToken()
        .json({ team: 'CT', roundType: 'FullBuy' })
        .redirects(0)
      ok.assertStatus(302)
    }
    const limited = await client
      .post('/loadouts/reset')
      .loginAs(player)
      .withCsrfToken()
      .json({ team: 'CT', roundType: 'FullBuy' })
      .redirects(0)
    limited.assertStatus(429)
  })
})
