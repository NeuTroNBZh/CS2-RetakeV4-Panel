import { test } from '@japa/runner'
import { weaponCategory, weaponLabel } from '#modules/loadouts/weapons'

test.group('weapons', () => {
  test('known weapons have a label and a category', ({ assert }) => {
    assert.equal(weaponLabel('weapon_m4a1_silencer'), 'M4A1-S')
    assert.equal(weaponCategory('weapon_m4a1_silencer'), 'rifle')
    assert.equal(weaponCategory('weapon_deagle'), 'pistol')
  })

  test('unknown weapons show their raw id', ({ assert }) => {
    assert.equal(weaponLabel('weapon_future_gun'), 'weapon_future_gun')
    assert.equal(weaponCategory('weapon_future_gun'), 'unknown')
  })
})
