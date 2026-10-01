import type { Permission } from '#core/modules/types'
import { isSteamId64 } from '#core/steam/steam_id'

export function parseAdmins(raw: string | undefined): ReadonlySet<string> {
  return new Set(
    (raw ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(isSteamId64)
  )
}

export function can(
  steamId: string | null,
  permission: Permission,
  admins: ReadonlySet<string>
): boolean {
  if (steamId === null) {
    return false
  }
  return permission === 'player' || admins.has(steamId)
}
