import test from 'node:test'
import assert from 'node:assert/strict'
import {createAuthorSessionManager,authorConnectionMessage} from '../src/utils/authorSessionCore.js'
const author={id:'author'}, credentials=()=>({email:'author@example.invalid',password:'test-only-password'})
function setup({session=null,editing=true,signIn}={}) {
  let signIns=0,reads=0
  const client={auth:{getSession:async()=>{reads++;return{data:{session}}},signInWithPassword:async values=>{signIns++;return signIn ? signIn(values) : {data:{session:{user:author}},error:null}}}}
  return {ensure:createAuthorSessionManager({client,isEditing:()=>editing,credentials,expectedUserId:'author'}),counts:()=>({reads,signIns})}
}
test('a fresh local editor session logs in automatically once for concurrent modules',async()=>{
  const state=setup()
  const sessions=await Promise.all([state.ensure(),state.ensure(),state.ensure()])
  assert.ok(sessions.every(session=>session.user.id==='author'))
  assert.deepEqual(state.counts(),{reads:1,signIns:1})
})
test('preview never reads credentials or signs in',async()=>{
  const state=setup({editing:false})
  assert.equal(await state.ensure(),null)
  assert.deepEqual(state.counts(),{reads:0,signIns:0})
})
test('existing author login is reused; other users do not grant author access',async()=>{
  const state=setup({session:{user:author}})
  assert.equal((await state.ensure()).user.id,'author')
  assert.equal(state.counts().signIns,0)
  const wrong=setup({signIn:async()=>({data:{session:{user:{id:'visitor'}}}})})
  await assert.rejects(wrong.ensure(),/author-account-mismatch/)
})
test('login errors are actionable and failed sign-in can be retried',async()=>{
  let calls=0
  const state=setup({signIn:async()=>++calls===1?{error:{code:'invalid_credentials',status:400}}:{data:{session:{user:author}}}})
  await assert.rejects(state.ensure(),/author-login-invalid/)
  assert.equal((await state.ensure()).user.id,'author')
  assert.match(authorConnectionMessage(new Error('author-login-invalid')),/不需要上传/)
  assert.ok(!authorConnectionMessage(new Error('author-login-invalid')).includes('test-only-password'))
})
test('missing local credentials never create a fake author session',async()=>{
  const ensure=createAuthorSessionManager({client:{auth:{getSession:async()=>({data:{session:null}})}},isEditing:()=>true,credentials:()=>({}),expectedUserId:'author'})
  await assert.rejects(ensure(),/missing-author-credentials/)
})
