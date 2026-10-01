export const STEAM_OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login'

const OPENID_NS = 'http://specs.openid.net/auth/2.0'
const IDENTIFIER_SELECT = 'http://specs.openid.net/auth/2.0/identifier_select'
const CLAIMED_ID = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/

export function buildLoginUrl(returnTo: string, realm: string): string {
  const params = new URLSearchParams({
    'openid.ns': OPENID_NS,
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnTo,
    'openid.realm': realm,
    'openid.identity': IDENTIFIER_SELECT,
    'openid.claimed_id': IDENTIFIER_SELECT,
  })
  return `${STEAM_OPENID_ENDPOINT}?${params.toString()}`
}

function text(query: Record<string, unknown>, key: string): string | null {
  const value = query[key]
  return typeof value === 'string' ? value : null
}

export async function verifyAssertion(
  query: Record<string, unknown>,
  expectedReturnTo: string,
  checkAuthentication: (body: URLSearchParams) => Promise<string>
): Promise<string | null> {
  if (text(query, 'openid.mode') !== 'id_res') return null
  if (text(query, 'openid.op_endpoint') !== STEAM_OPENID_ENDPOINT) return null
  if (text(query, 'openid.return_to') !== expectedReturnTo) return null
  const steamId = CLAIMED_ID.exec(text(query, 'openid.claimed_id') ?? '')?.[1]
  if (!steamId) return null

  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith('openid.') && typeof value === 'string') {
      body.set(key, value)
    }
  }
  body.set('openid.mode', 'check_authentication')
  try {
    const answer = await checkAuthentication(body)
    return answer.split('\n').some((line) => line.trim() === 'is_valid:true') ? steamId : null
  } catch {
    return null
  }
}
