import env from '#start/env'
import { assertProductionUrl } from '#core/production_checks'

assertProductionUrl(env.get('APP_URL'), env.get('NODE_ENV'))
