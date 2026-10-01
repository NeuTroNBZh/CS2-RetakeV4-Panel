import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { LoadoutRepository } from '#modules/loadouts/loadout_repository'
import { resetPluginTables } from '#tests/bootstrap'

const ALICE = '76561198000000001'
const HUGE = '18446744073709551614'

async function rows(steamId: string) {
  const [result] = await db
    .connection('retake')
    .rawQuery(
      'SELECT team, round_type, primary_weapon, secondary_weapon, awp_opt_in, updated_at FROM player_loadout WHERE steam_id = ? ORDER BY team, round_type',
      [steamId]
    )
  return result as {
    team: number
    round_type: string
    primary_weapon: string | null
    secondary_weapon: string | null
    awp_opt_in: number
    updated_at: Date
  }[]
}

test.group('LoadoutRepository', (group) => {
  group.each.setup(() => resetPluginTables())
  const repository = new LoadoutRepository()

  test('setWeapon creates then updates only its slot', async ({ assert }) => {
    await repository.setWeapon(ALICE, 'CT', 'FullBuy', 'primary', 'weapon_aug')
    await repository.setWeapon(ALICE, 'CT', 'FullBuy', 'secondary', 'weapon_deagle')
    const [row] = await rows(ALICE)
    assert.equal(row.team, 1)
    assert.equal(row.primary_weapon, 'weapon_aug')
    assert.equal(row.secondary_weapon, 'weapon_deagle')
    assert.equal(row.awp_opt_in, 0)
  })

  test('every write moves updated_at forward', async ({ assert }) => {
    await repository.setWeapon(ALICE, 'T', 'Mid', 'primary', 'weapon_mac10')
    const [before] = await rows(ALICE)
    await new Promise((resolve) => setTimeout(resolve, 5))
    await repository.setWeapon(ALICE, 'T', 'Mid', 'primary', 'weapon_mp9')
    const [after] = await rows(ALICE)
    assert.isAbove(after.updated_at.getTime(), before.updated_at.getTime())
  })

  test('reset clears both weapons', async ({ assert }) => {
    await repository.setWeapon(ALICE, 'T', 'Mid', 'primary', 'weapon_mac10')
    await repository.reset(ALICE, 'T', 'Mid')
    const [row] = await rows(ALICE)
    assert.isNull(row.primary_weapon)
    assert.isNull(row.secondary_weapon)
  })

  test('setAwp writes the * row of both teams and keeps weapons', async ({ assert }) => {
    await repository.setAwp(ALICE, true)
    const all = await rows(ALICE)
    assert.deepEqual(
      all.map((r) => [r.team, r.round_type, r.awp_opt_in]),
      [
        [0, '*', 1],
        [1, '*', 1],
      ]
    )
    await repository.setAwp(ALICE, false)
    const afterReset = await rows(ALICE)
    assert.deepEqual(
      afterReset.map((r) => r.awp_opt_in),
      [0, 0]
    )
  })

  test('preferences reads the rows of the player only', async ({ assert }) => {
    await repository.setWeapon(ALICE, 'CT', 'FullBuy', 'primary', 'weapon_aug')
    await repository.setWeapon('76561198000000002', 'CT', 'FullBuy', 'primary', 'weapon_m4a1')
    assert.deepEqual(await repository.preferences(ALICE), [
      { team: 'CT', roundType: 'FullBuy', primary: 'weapon_aug', secondary: null, awpOptIn: false },
    ])
  })

  test('steam ids above 2^63 round trip', async ({ assert }) => {
    await repository.setWeapon(HUGE, 'T', 'Mid', 'primary', 'weapon_mac10')
    assert.lengthOf(await repository.preferences(HUGE), 1)
  })

  test('catalogRow reads the configured server', async ({ assert }) => {
    await db
      .connection('retake')
      .rawQuery(
        "INSERT INTO retake_catalog VALUES ('default', 1, '{\"roundTypes\":[]}', UTC_TIMESTAMP(6))"
      )
    assert.deepEqual(await repository.catalogRow('default'), {
      format_version: 1,
      catalog: '{"roundTypes":[]}',
    })
    assert.isNull(await repository.catalogRow('other'))
  })
})
