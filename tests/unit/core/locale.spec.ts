import { test } from '@japa/runner'
import { resolveLocale } from '#core/locale'

test.group('resolveLocale', () => {
  test('the cookie wins', ({ assert }) => {
    assert.equal(resolveLocale('fr', 'en-US,en;q=0.9', 'en'), 'fr')
  })

  test('then the browser language', ({ assert }) => {
    assert.equal(resolveLocale(undefined, 'fr-FR,fr;q=0.9,en;q=0.8', 'en'), 'fr')
    assert.equal(resolveLocale('de', 'de-DE,en;q=0.5', 'fr'), 'en')
  })

  test('then the fallback', ({ assert }) => {
    assert.equal(resolveLocale(undefined, undefined, 'fr'), 'fr')
    assert.equal(resolveLocale(42, 'de-DE', 'en'), 'en')
  })
})
