import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp,mkdir,readFile,writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import localContent from '../scripts/local-content.mjs'

test('local content writes keep a backup and reject malformed or unauthorized requests',async () => {
  const root=await mkdtemp(join(tmpdir(),'kel-content-test-'))
  await mkdir(join(root,'public/content'),{recursive:true})
  const file=join(root,'public/content/anki-cards.json')
  await writeFile(file,'[]\n')
  let handler
  localContent().configureServer({ config:{root,env:{VITE_EDIT_MODE:'true'}},middlewares:{use:(_path,fn) => handler=fn} })
  const send = (body,extraHeaders={}) => new Promise(resolve => {
    const req=Readable.from([body]); req.socket={remoteAddress:'127.0.0.1'}; req.method='PUT'
    req.headers={host:'localhost:5173',origin:'http://localhost:5173','x-kel-edit-mode':'local','content-type':'application/json',...extraHeaders}
    const res={ statusCode:200,setHeader(){},end(text){ resolve({status:this.statusCode,body:JSON.parse(text)}) } }
    handler(req,res)
  })
  const cards=[{id:'test',language:'english',original_text:'test',translation:'测试'}]
  assert.equal((await send(JSON.stringify(cards),{'x-kel-edit-mode':undefined})).status,403)
  assert.equal((await send('{')).status,400)
  assert.equal((await send(JSON.stringify(cards))).status,200)
  assert.deepEqual(JSON.parse(await readFile(file,'utf8')),cards)
  assert.equal(await readFile(`${file}.backup.local`,'utf8'),'[]\n')
  assert.equal((await send(JSON.stringify([cards[0],cards[0]]))).status,400)
  assert.deepEqual(JSON.parse(await readFile(file,'utf8')),cards)
})
