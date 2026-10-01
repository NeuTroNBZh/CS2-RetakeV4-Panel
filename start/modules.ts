import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import dbConfig from '#config/database'
import { availableModules } from '#core/modules/catalog'
import { parseModuleList, resolveModules } from '#core/modules/registry'

const CONNECTION_TIMEOUT_MS = 5000

async function isReachable(name: string): Promise<boolean> {
  const probe = db.connection(name).rawQuery('SELECT 1')
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), CONNECTION_TIMEOUT_MS))
  try {
    await Promise.race([probe, timeout])
    return true
  } catch (error) {
    logger.warn({ err: error, connection: name }, 'database connection %s is not reachable', name)
    return false
  }
}

const configured = Object.keys(dbConfig.connections)
const reachable = await Promise.all(configured.map(async (name) => ((await isReachable(name)) ? name : null)))
const resolution = resolveModules(
  parseModuleList(env.get('PANEL_MODULES'), ['loadouts']),
  availableModules,
  new Set(reachable.filter((name): name is string => name !== null))
)

for (const { name, reason } of resolution.disabled) {
  logger.warn('module %s disabled: %s', name, reason)
}

export const activeModules = resolution.active
