import { test } from '@japa/runner'
import { parseModuleList, resolveModules } from '#core/modules/registry'
import type { PanelModule } from '#core/modules/types'

const module = (name: string, connections: string[] = []): PanelModule => ({
  name,
  connections,
  menu: [],
  registerRoutes: () => {},
})

test.group('parseModuleList', () => {
  test('uses the fallback when empty', ({ assert }) => {
    assert.deepEqual(parseModuleList(undefined, ['loadouts']), ['loadouts'])
    assert.deepEqual(parseModuleList('  ', ['loadouts']), ['loadouts'])
  })

  test('splits, trims and deduplicates', ({ assert }) => {
    assert.deepEqual(parseModuleList(' loadouts, stats ,loadouts', []), ['loadouts', 'stats'])
  })
})

test.group('resolveModules', () => {
  test('activates enabled modules whose connections are ready', ({ assert }) => {
    const result = resolveModules(
      ['loadouts'],
      [module('loadouts', ['retake'])],
      new Set(['panel', 'retake'])
    )
    assert.deepEqual(
      result.active.map((m) => m.name),
      ['loadouts']
    )
    assert.deepEqual(result.disabled, [])
  })

  test('disables a module whose connection is missing', ({ assert }) => {
    const result = resolveModules(
      ['loadouts'],
      [module('loadouts', ['retake'])],
      new Set(['panel'])
    )
    assert.deepEqual(result.active, [])
    assert.deepEqual(result.disabled, [
      { name: 'loadouts', reason: 'connection "retake" is not available' },
    ])
  })

  test('reports unknown modules', ({ assert }) => {
    const result = resolveModules(['skins'], [module('loadouts')], new Set())
    assert.deepEqual(result.disabled, [{ name: 'skins', reason: 'unknown module' }])
  })

  test('ignores available modules that are not enabled', ({ assert }) => {
    const result = resolveModules([], [module('loadouts')], new Set())
    assert.deepEqual(result.active, [])
    assert.deepEqual(result.disabled, [])
  })
})
