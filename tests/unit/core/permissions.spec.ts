import { test } from '@japa/runner'
import { can, parseAdmins } from '#core/permissions'

const ADMIN = '76561198000000009'
const PLAYER = '76561198000000001'

test.group('permissions', () => {
  test('parses admins and drops invalid ids', ({ assert }) => {
    assert.deepEqual([...parseAdmins(` ${ADMIN}, nope, 123,${ADMIN}`)], [ADMIN])
    assert.equal(parseAdmins(undefined).size, 0)
  })

  test('players need a session', ({ assert }) => {
    assert.isFalse(can(null, 'player', new Set()))
    assert.isTrue(can(PLAYER, 'player', new Set()))
  })

  test('admins are listed', ({ assert }) => {
    const admins = parseAdmins(ADMIN)
    assert.isTrue(can(ADMIN, 'admin', admins))
    assert.isFalse(can(PLAYER, 'admin', admins))
    assert.isFalse(can(null, 'admin', admins))
  })
})
