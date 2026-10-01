import { test } from '@japa/runner'
import { messages, translate } from '../../../inertia/i18n/index.js'

test.group('i18n', () => {
  test('en and fr have the same keys', ({ assert }) => {
    assert.deepEqual(Object.keys(messages.fr).sort(), Object.keys(messages.en).sort())
  })

  test('replaces parameters', ({ assert }) => {
    assert.equal(translate('en', 'core.welcome', { name: 'Alice' }), 'Welcome, Alice')
  })

  test('falls back to the key when missing', ({ assert }) => {
    assert.equal(translate('fr', 'missing.key'), 'missing.key')
  })
})
