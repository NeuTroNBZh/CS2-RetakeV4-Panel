import type { ModuleResolution, PanelModule } from '#core/modules/types'

export function parseModuleList(raw: string | undefined, fallback: string[]): string[] {
  const names = (raw ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
  return names.length === 0 ? fallback : [...new Set(names)]
}

export function resolveModules(
  enabled: string[],
  available: PanelModule[],
  readyConnections: ReadonlySet<string>
): ModuleResolution {
  return enabled.reduce<ModuleResolution>(
    (result, name) => {
      const module = available.find((candidate) => candidate.name === name)
      if (!module) {
        return { ...result, disabled: [...result.disabled, { name, reason: 'unknown module' }] }
      }
      const missing = module.connections.find((connection) => !readyConnections.has(connection))
      if (missing) {
        return {
          ...result,
          disabled: [
            ...result.disabled,
            { name, reason: `connection "${missing}" is not available` },
          ],
        }
      }
      return { ...result, active: [...result.active, module] }
    },
    { active: [], disabled: [] }
  )
}
