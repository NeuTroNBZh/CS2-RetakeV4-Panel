/*
|--------------------------------------------------------------------------
| Test runner entrypoint
|--------------------------------------------------------------------------
|
| The "test.ts" file is the entrypoint for running tests using Japa.
|
| Either you can run this file directly or use the "test"
| command to run this file and monitor file changes.
|
*/

process.env.NODE_ENV = 'test'

import 'reflect-metadata'
import { Ignitor, prettyPrintError } from '@adonisjs/core/ignitor'
import { configure, processCLIArgs, run } from '@japa/runner'
import { createDB } from 'mysql-memory-server'

/**
 * Starts an ephemeral MySQL before the app boots and points both database
 * connections (panel and retake) at the same database. Variables already
 * present in process.env win over .env.test. Set PANEL_TEST_DB=external to
 * use the MySQL described by .env.test instead (see compose.test.yml).
 */
const TEST_DB_NAME = 'panel_test'

async function startTestDatabase(): Promise<Awaited<ReturnType<typeof createDB>> | null> {
  if (process.env.PANEL_TEST_DB === 'external') {
    return null
  }
  const db = await createDB({ version: '8.4.x', dbName: TEST_DB_NAME })
  for (const prefix of ['PANEL_DB', 'RETAKE_DB']) {
    process.env[`${prefix}_HOST`] = '127.0.0.1'
    process.env[`${prefix}_PORT`] = String(db.port)
    process.env[`${prefix}_USER`] = db.username
    process.env[`${prefix}_PASSWORD`] = ''
    process.env[`${prefix}_DATABASE`] = TEST_DB_NAME
  }
  return db
}

const testDatabase = await startTestDatabase()

let stopPromise: Promise<void> | null = null
function stopTestDatabase(): Promise<void> {
  stopPromise ??= testDatabase ? testDatabase.stop() : Promise.resolve()
  return stopPromise
}

/**
 * URL to the application root. AdonisJS need it to resolve
 * paths to file and directories for scaffolding commands
 */
const APP_ROOT = new URL('../', import.meta.url)

/**
 * The importer is used to import files in context of the
 * application.
 */
const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    app.booting(async () => {
      await import('#start/env')
    })
    app.listen('SIGTERM', () => app.terminate())
    app.listenIf(app.managedByPm2, 'SIGINT', () => app.terminate())
  })
  .testRunner()
  .configure(async (app) => {
    const { runnerHooks, ...config } = await import('../tests/bootstrap.js')

    processCLIArgs(process.argv.splice(2))
    configure({
      ...app.rcFile.tests,
      ...config,
      ...{
        setup: runnerHooks.setup,
        teardown: runnerHooks.teardown.concat([
          () => app.terminate(),
          () => stopTestDatabase(),
        ]),
      },
    })
  })
  .run(() => run())
  .catch((error) => {
    process.exitCode = 1
    prettyPrintError(error)
  })
  .finally(async () => {
    await stopTestDatabase()
    process.exit()
  })
