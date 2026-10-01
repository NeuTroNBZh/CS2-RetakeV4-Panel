const STEAM_ID_64 = /^\d{17}$/

export function isSteamId64(value: unknown): value is string {
  return typeof value === 'string' && STEAM_ID_64.test(value)
}
