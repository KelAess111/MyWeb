import test from 'node:test'
import assert from 'node:assert/strict'
import { isRecoveryLocation, changeAccountPassword } from '../src/utils/passwordRecovery.js'

test('recognizes homepage recovery callbacks and direct account page without treating OAuth as recovery', () => {
  assert.equal(isRecoveryLocation({ pathname: '/', hash: '#access_token=test&type=recovery' }), true)
  assert.equal(isRecoveryLocation({ pathname: '/account/update-password', hash: '' }), true)
  assert.equal(isRecoveryLocation({ pathname: '/', hash: '#type=signup' }), false)
})

test('invalid input or absent authenticated identity cannot update a password', async () => {
  let updates = 0
  const client = { auth: { getUser: async () => ({ data: { user: null } }), updateUser: async () => { updates++ } } }
  await assert.rejects(changeAccountPassword(client, 'short', 'short'))
  await assert.rejects(changeAccountPassword(client, 'new-password-123', 'different-password'))
  await assert.rejects(changeAccountPassword(client, 'new-password-123', 'new-password-123'))
  assert.equal(updates, 0)
})

test('successful password change requests global logout, without misreporting logout failure as password failure', async () => {
  const calls = []
  const client = { auth: {
    getUser: async () => ({ data: { user: { id: 'test' } } }),
    updateUser: async payload => { calls.push(payload); return {} },
    signOut: async payload => { calls.push(payload); return { error: new Error('offline') } },
  } }
  assert.deepEqual(await changeAccountPassword(client, 'new-password-123', 'new-password-123'), { sessionsRevoked: false })
  assert.deepEqual(calls, [{ password: 'new-password-123' }, { scope: 'global' }])
  client.auth.updateUser = async () => ({ error: new Error('expired') })
  await assert.rejects(changeAccountPassword(client, 'new-password-123', 'new-password-123'))
  assert.equal(calls.length, 2)
})
