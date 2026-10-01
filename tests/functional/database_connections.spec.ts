import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'

test.group('database connections', () => {
  test('panel and retake connections reach the same test database', async ({ assert }) => {
    const panel = await db.connection('panel').rawQuery('select database() as name')
    const retake = await db.connection('retake').rawQuery('select database() as name')

    assert.equal(panel[0][0].name, 'panel_test')
    assert.equal(retake[0][0].name, 'panel_test')
  })
})
