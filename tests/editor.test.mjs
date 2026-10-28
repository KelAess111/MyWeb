import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { resolveEditMode } from '../src/utils/editMode.js'
import { parseCardTsv, uniqueNewCards } from '../src/utils/ankiImport.js'
import { vocabularyPacks } from '../src/data/ankiVocabulary.js'
import { allowLocalWrite, validCards } from '../scripts/local-content.mjs'
const require = createRequire(import.meta.url)
const { publishable, parseStatus } = require('../desktop/publisher.cjs')
const editable = {dev:true, enabled:true, hostname:'localhost',search:'?editMode=local',preview:null,edit:null}

test('editing requires development, loopback and explicit edit mode', () => {
  assert.equal(resolveEditMode(editable),true)
  for (const setting of [{dev:false},{enabled:false},{hostname:'portfolio.example.com'},{search:''},{search:'?preview=true&editMode=local'}]) assert.equal(resolveEditMode({...editable,...setting}),false)
  assert.equal(resolveEditMode({...editable,search:'',edit:'true'}),true)
  assert.equal(resolveEditMode({...editable,search:'',edit:'true',preview:'true'}),false)
  assert.equal(resolveEditMode({...editable,preview:'true'}),true,'explicit edit can leave a previous preview session')
  assert.equal(resolveEditMode({...editable,dev:false,edit:'true'}),false,'stale flags cannot enable production editing')
})
test('file writes require exact loopback Host, Origin and editor header', () => {
  const req = {socket:{remoteAddress:'127.0.0.1'},headers:{host:'127.0.0.1:5173',origin:'http://127.0.0.1:5173','x-kel-edit-mode':'local'}}
  assert.equal(allowLocalWrite(req,true),true)
  assert.equal(allowLocalWrite(req,false),false)
  for (const headers of [{...req.headers,origin:'https://attacker.example'},{...req.headers,host:'attacker.example'},{...req.headers,'x-kel-edit-mode':undefined},{...req.headers,origin:undefined}]) assert.equal(allowLocalWrite({...req,headers},true),false)
  assert.equal(allowLocalWrite({...req,socket:{remoteAddress:'192.168.1.5'}},true),false)
})
test('500-word packs have distinct complete cards with Japanese readings', () => {
  const cards = Object.values(vocabularyPacks).flat()
  assert.equal(cards.length,1000)
  assert.equal(vocabularyPacks.english.length,500)
  assert.equal(vocabularyPacks.japanese.length,500)
  assert.equal(validCards(cards),true)
  assert.equal(uniqueNewCards(cards,cards).length,0)
  assert.ok(vocabularyPacks.japanese.every(card => card.pronunciation && card.kanji_form && card.special_note))
  assert.equal(validCards([cards[0],cards[0]]),false)
  assert.equal(validCards([{...cards[0],translation:''}]),false)
})
test('bulk import validates all rows and deduplicates kana, kanji and normalized English', () => {
  const parsed = parseCardTsv('word\treading\t\tn.\t释义\t注释','english')
  assert.equal(parsed[0].translation,'释义')
  assert.throws(() => parseCardTsv('broken\trow\tincomplete','english'))
  assert.throws(() => parseCardTsv('word\treading\t\tn.\t释义\t注释\nbroken','english'))
  assert.equal(uniqueNewCards([{language:'english',original_text:'Word'}],[{language:'english',original_text:'ＷＯＲＤ'}]).length,0)
  assert.equal(uniqueNewCards([{language:'japanese',original_text:'きたい',kanji_form:'期待'}],[{language:'japanese',original_text:'期待'}]).length,0)
})
test('upload scope excludes secrets, other workspaces and generated files', () => {
  for (const path of ['.env.local','musicaccept.env','.claude/worktrees/a/src/App.jsx','desktop/node_modules/a.js','desktop/dist/app.exe','src/secret.json','public/../.env','public/test.key','public/test.local','desktop/.env','src\\App.jsx']) assert.equal(publishable(path),false,path)
  for (const path of ['src/App.jsx','public/content/game-plans.json','public/content/anki-cards.json','desktop/main.cjs','desktop/package-lock.json','.gitignore','package.json']) assert.equal(publishable(path),true,path)
  assert.deepEqual(parseStatus(' M src/App.jsx\0?? public/new.json\0'),[{status:' M',path:'src/App.jsx'},{status:'??',path:'public/new.json'}])
  assert.deepEqual(parseStatus('R  src/new.jsx\0src/old.jsx\0'),[{status:'R ',path:'src/new.jsx'}])
})

test('room entry verification accepts only the expected key without a plaintext configuration', async () => {
  const { pbkdf2Sync } = await import('node:crypto')
  const { verifyAccessKey } = await import('../src/utils/verifyAccessKey.js')
  const accessSalt = '00112233445566778899aabbccddeeff', accessIterations = 1000
  const accessHash = pbkdf2Sync('test-only-value',Buffer.from(accessSalt,'hex'),accessIterations,32,'sha256').toString('hex')
  const options = {accessSalt,accessHash,accessIterations}
  assert.equal(await verifyAccessKey(' test-only-value ',options),true)
  assert.equal(await verifyAccessKey('wrong',options),false)
})

test('public build guard blocks leaked local values without including them in the error',async () => {
  const {mkdtemp,writeFile} = await import('node:fs/promises')
  const {tmpdir} = await import('node:os')
  const {join} = await import('node:path')
  const {verifyPublicSecrets} = await import('../scripts/check-public-content.mjs')
  const root=await mkdtemp(join(tmpdir(),'kel-public-test-'))
  await writeFile(join(root,'app.js'),'safe content')
  await verifyPublicSecrets(root,{PASSWORD:'test-private-123'})
  await writeFile(join(root,'app.js'),'contains test-private-123')
  await assert.rejects(verifyPublicSecrets(root,{PASSWORD:'test-private-123'}),error => error.message.includes('PASSWORD') && !error.message.includes('test-private-123'))
})

test('simple word import accepts two columns and pipe rows, preserving optional empty columns', () => {
  const simple = parseCardTsv('hesitate | 犹豫\ncurious\t好奇的','english')
  assert.equal(simple.length,2)
  assert.equal(simple[0].original_text,'hesitate')
  assert.equal(simple[1].translation,'好奇的')
  const detailed = parseCardTsv('めやす\tmeyasu\t目安\t名词\t大致标准\t','japanese')
  assert.equal(detailed[0].kanji_form,'目安')
  assert.equal(detailed[0].special_note,'')
  assert.throws(() => parseCardTsv('word | ','english'),/中文意思/)
  assert.throws(() => parseCardTsv('word','english'),/第 1 行/)
  assert.equal(uniqueNewCards([{language:'japanese',original_text:'めやす',kanji_form:'目安'}],parseCardTsv('目安 | 大致标准','japanese')).length,0)
})
