import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const retakeHost = env.get('RETAKE_DB_HOST')

const dbConfig = defineConfig({
  connection: 'panel',
  connections: {
    panel: {
      client: 'mysql2',
      connection: {
        host: env.get('PANEL_DB_HOST'),
        port: env.get('PANEL_DB_PORT'),
        user: env.get('PANEL_DB_USER'),
        password: env.get('PANEL_DB_PASSWORD'),
        database: env.get('PANEL_DB_DATABASE'),
      },
      migrations: { naturalSort: true, paths: ['database/migrations'] },
      schemaGeneration: {
        enabled: true,
        rulesPaths: ['./database/schema_rules.js'],
      },
    },
    // The plugin's database: the panel never migrates it.
    ...(retakeHost
      ? {
          retake: {
            client: 'mysql2' as const,
            connection: {
              host: retakeHost,
              port: env.get('RETAKE_DB_PORT', 3306),
              user: env.get('RETAKE_DB_USER'),
              password: env.get('RETAKE_DB_PASSWORD'),
              database: env.get('RETAKE_DB_DATABASE'),
              supportBigNumbers: true,
              bigNumberStrings: true,
            },
          },
        }
      : {}),
  },
})

export default dbConfig
