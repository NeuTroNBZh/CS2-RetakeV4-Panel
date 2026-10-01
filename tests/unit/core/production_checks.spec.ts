import { test } from '@japa/runner'
import { assertProductionUrl } from '#core/production_checks'

test.group('assertProductionUrl', () => {
  test('accepts https in production', ({ assert }) => {
    assert.doesNotThrow(() => assertProductionUrl('https://panel.example.com', 'production'))
  })

  test('rejects http in production', ({ assert }) => {
    assert.throws(
      () => assertProductionUrl('http://panel.example.com', 'production'),
      /APP_URL must use https/
    )
  })

  test('rejects an invalid url in production', ({ assert }) => {
    assert.throws(() => assertProductionUrl('panel', 'production'), /APP_URL must use https/)
  })

  test('accepts http outside production', ({ assert }) => {
    assert.doesNotThrow(() => assertProductionUrl('http://localhost:3333', 'development'))
    assert.doesNotThrow(() => assertProductionUrl('http://localhost:3333', 'test'))
  })
})
