import { test } from '@japa/runner'
import { STEAM_OPENID_ENDPOINT, buildLoginUrl, verifyAssertion } from '#core/steam/openid'

const RETURN_TO = 'https://panel.example.com/auth/steam/callback'
const STEAM_ID = '76561198000000001'

const assertion = (overrides: Record<string, string> = {}) => ({
  'openid.ns': 'http://specs.openid.net/auth/2.0',
  'openid.mode': 'id_res',
  'openid.op_endpoint': STEAM_OPENID_ENDPOINT,
  'openid.claimed_id': `https://steamcommunity.com/openid/id/${STEAM_ID}`,
  'openid.identity': `https://steamcommunity.com/openid/id/${STEAM_ID}`,
  'openid.return_to': RETURN_TO,
  'openid.response_nonce': '2026-10-01T12:00:00Zabc',
  'openid.assoc_handle': '1234567890',
  'openid.signed': 'signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle',
  'openid.sig': 'c2lnbmF0dXJl',
  ...overrides,
})

const valid = async () => 'ns:http://specs.openid.net/auth/2.0\nis_valid:true\n'
const invalid = async () => 'ns:http://specs.openid.net/auth/2.0\nis_valid:false\n'

test.group('Steam OpenID', () => {
  test('builds the login url', ({ assert }) => {
    const url = new URL(buildLoginUrl(RETURN_TO, 'https://panel.example.com'))
    assert.equal(url.origin + url.pathname, STEAM_OPENID_ENDPOINT)
    assert.equal(url.searchParams.get('openid.mode'), 'checkid_setup')
    assert.equal(url.searchParams.get('openid.return_to'), RETURN_TO)
    assert.equal(url.searchParams.get('openid.realm'), 'https://panel.example.com')
    assert.equal(
      url.searchParams.get('openid.identity'),
      'http://specs.openid.net/auth/2.0/identifier_select'
    )
  })

  test('returns the SteamID of a valid assertion', async ({ assert }) => {
    assert.equal(await verifyAssertion(assertion(), RETURN_TO, valid), STEAM_ID)
  })

  test('sends the assertion back with check_authentication', async ({ assert }) => {
    let sent: URLSearchParams | undefined
    await verifyAssertion(assertion(), RETURN_TO, async (body) => {
      sent = body
      return 'is_valid:true'
    })
    assert.equal(sent?.get('openid.mode'), 'check_authentication')
    assert.equal(sent?.get('openid.sig'), 'c2lnbmF0dXJl')
  })

  test('rejects when Steam says the signature is invalid', async ({ assert }) => {
    assert.isNull(await verifyAssertion(assertion(), RETURN_TO, invalid))
  })

  test('rejects a forged return_to', async ({ assert }) => {
    assert.isNull(
      await verifyAssertion(
        assertion({ 'openid.return_to': 'https://evil.example.com/cb' }),
        RETURN_TO,
        valid
      )
    )
  })

  test('rejects a foreign claimed_id', async ({ assert }) => {
    const foreign = assertion({
      'openid.claimed_id': `https://evil.example.com/openid/id/${STEAM_ID}`,
    })
    assert.isNull(await verifyAssertion(foreign, RETURN_TO, valid))
  })

  test('rejects a foreign op_endpoint', async ({ assert }) => {
    assert.isNull(
      await verifyAssertion(
        assertion({ 'openid.op_endpoint': 'https://evil.example.com/openid/login' }),
        RETURN_TO,
        valid
      )
    )
  })

  test('rejects a cancelled login', async ({ assert }) => {
    assert.isNull(await verifyAssertion(assertion({ 'openid.mode': 'cancel' }), RETURN_TO, valid))
  })

  test('rejects when Steam cannot be reached', async ({ assert }) => {
    const failing = async () => {
      throw new Error('network')
    }
    assert.isNull(await verifyAssertion(assertion(), RETURN_TO, failing))
  })
  test('reports why an assertion was rejected', async ({ assert }) => {
    const reasons: string[] = []
    const onError = (reason: string) => reasons.push(reason)
    const failing = async () => {
      throw new Error('network down')
    }
    await verifyAssertion(assertion(), RETURN_TO, failing, onError)
    await verifyAssertion(assertion(), RETURN_TO, invalid, onError)
    await verifyAssertion(
      assertion({ 'openid.return_to': 'https://evil.example.com/cb' }),
      RETURN_TO,
      valid,
      onError
    )
    assert.lengthOf(reasons, 3)
    assert.include(reasons[0], 'network down')
    assert.include(reasons[1], 'is_valid')
    assert.include(reasons[2], 'return_to')
  })

  test('does not report a successful verification', async ({ assert }) => {
    const reasons: string[] = []
    await verifyAssertion(assertion(), RETURN_TO, valid, (reason) => reasons.push(reason))
    assert.lengthOf(reasons, 0)
  })
})
