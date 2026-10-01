/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string(),
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),
  LIMITER_STORE: Env.schema.enum(['database', 'memory'] as const),

  PANEL_DB_HOST: Env.schema.string({ format: 'host' }),
  PANEL_DB_PORT: Env.schema.number(),
  PANEL_DB_USER: Env.schema.string(),
  PANEL_DB_PASSWORD: Env.schema.string.optional(),
  PANEL_DB_DATABASE: Env.schema.string(),

  RETAKE_DB_HOST: Env.schema.string.optional({ format: 'host' }),
  RETAKE_DB_PORT: Env.schema.number.optional(),
  RETAKE_DB_USER: Env.schema.string.optional(),
  RETAKE_DB_PASSWORD: Env.schema.string.optional(),
  RETAKE_DB_DATABASE: Env.schema.string.optional(),

  PANEL_RETAKE_SERVER: Env.schema.string.optional(),
  PANEL_MODULES: Env.schema.string.optional(),
  PANEL_ADMINS: Env.schema.string.optional(),
  STEAM_API_KEY: Env.schema.string.optional(),
  PANEL_LOCALE: Env.schema.enum.optional(['en', 'fr'] as const),
})
