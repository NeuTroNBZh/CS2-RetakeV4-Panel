import db from '@adonisjs/lucid/services/db'
import { ANY_ROUND_TYPE, TEAMS, TEAM_VALUE, type Slot, type Team } from '#modules/loadouts/catalog'

export interface PreferenceRow {
  team: Team
  roundType: string
  primary: string | null
  secondary: string | null
  awpOptIn: boolean
}

// The RetakeV4 plugin owns these tables: the panel only reads and writes rows, with the plugin's exact encoding.
export class LoadoutRepository {
  private get connection() {
    return db.connection('retake')
  }

  async catalogRow(serverKey: string): Promise<{ format_version: number; catalog: string } | null> {
    const [rows] = await this.connection.rawQuery(
      'SELECT format_version, catalog FROM retake_catalog WHERE server_key = ?',
      [serverKey]
    )
    const row = (rows as { format_version: number; catalog: string }[])[0]
    return row ? { format_version: Number(row.format_version), catalog: row.catalog } : null
  }

  async preferences(steamId: string): Promise<PreferenceRow[]> {
    const [rows] = await this.connection.rawQuery(
      'SELECT team, round_type, primary_weapon, secondary_weapon, awp_opt_in FROM player_loadout WHERE steam_id = ? ORDER BY team, round_type',
      [steamId]
    )
    return (
      rows as {
        team: number
        round_type: string
        primary_weapon: string | null
        secondary_weapon: string | null
        awp_opt_in: number
      }[]
    ).map((row) => ({
      team: row.team === TEAM_VALUE.T ? 'T' : 'CT',
      roundType: row.round_type,
      primary: row.primary_weapon,
      secondary: row.secondary_weapon,
      awpOptIn: Number(row.awp_opt_in) === 1,
    }))
  }

  async setWeapon(
    steamId: string,
    team: Team,
    roundType: string,
    slot: Slot,
    weapon: string
  ): Promise<void> {
    // `column` comes only from the typed `slot`, never from user input: the single interpolation here.
    const column = slot === 'primary' ? 'primary_weapon' : 'secondary_weapon'
    await this.connection.rawQuery(
      `INSERT INTO player_loadout (steam_id, team, round_type, ${column}, awp_opt_in, updated_at)
       VALUES (?, ?, ?, ?, 0, UTC_TIMESTAMP(6))
       ON DUPLICATE KEY UPDATE ${column} = VALUES(${column}), updated_at = VALUES(updated_at)`,
      [steamId, TEAM_VALUE[team], roundType, weapon]
    )
  }

  async reset(steamId: string, team: Team, roundType: string): Promise<void> {
    await this.connection.rawQuery(
      `UPDATE player_loadout SET primary_weapon = NULL, secondary_weapon = NULL, updated_at = UTC_TIMESTAMP(6)
       WHERE steam_id = ? AND team = ? AND round_type = ?`,
      [steamId, TEAM_VALUE[team], roundType]
    )
  }

  async setAwp(steamId: string, optIn: boolean): Promise<void> {
    await this.connection.transaction(async (trx) => {
      for (const team of TEAMS) {
        await trx.rawQuery(
          `INSERT INTO player_loadout (steam_id, team, round_type, awp_opt_in, updated_at)
           VALUES (?, ?, ?, ?, UTC_TIMESTAMP(6))
           ON DUPLICATE KEY UPDATE awp_opt_in = VALUES(awp_opt_in), updated_at = VALUES(updated_at)`,
          [steamId, TEAM_VALUE[team], ANY_ROUND_TYPE, optIn ? 1 : 0]
        )
      }
    })
  }
}
