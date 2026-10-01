import { test } from '@japa/runner'

test.group('Health', () => {
  test('answers without a session', async ({ client }) => {
    const response = await client.get('/health')
    response.assertStatus(200)
    response.assertBody({ status: 'ok' })
  })
})
