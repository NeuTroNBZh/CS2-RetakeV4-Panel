const SUMMARIES_URL = 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/'

export interface SteamProfile {
  name: string
  avatarUrl: string
}

export async function fetchProfile(
  steamId: string,
  apiKey: string | undefined,
  fetchFn: typeof fetch,
  onError: (reason: string) => void = () => {}
): Promise<SteamProfile | null> {
  if (!apiKey) return null
  try {
    const url = `${SUMMARIES_URL}?${new URLSearchParams({ key: apiKey, steamids: steamId }).toString()}`
    const response = await fetchFn(url, { signal: AbortSignal.timeout(5000) })
    if (!response.ok) {
      onError(`Steam API answered HTTP ${response.status}`)
      return null
    }
    const body = (await response.json()) as {
      response?: { players?: { personaname?: unknown; avatarfull?: unknown }[] }
    }
    const player = body.response?.players?.[0]
    if (typeof player?.personaname !== 'string' || typeof player.avatarfull !== 'string') {
      onError('Steam API returned an unexpected body')
      return null
    }
    return { name: player.personaname, avatarUrl: player.avatarfull }
  } catch (error) {
    onError(`Steam API request failed: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}
