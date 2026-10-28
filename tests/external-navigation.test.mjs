import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { EventEmitter } from 'node:events'
const { externalWebURL, installExternalNavigation } = createRequire(import.meta.url)('../desktop/external-navigation.cjs')
const base = 'http://127.0.0.1:5186'
test('desktop opens web links externally and keeps file, script and internal URLs out of the system shell', () => {
  for (const url of ['https://pan.baidu.com/s/demo?pwd=1234','https://github.com/owner/repo/releases/download/v1/game.zip']) assert.equal(externalWebURL(url,base),url)
  for (const url of [`${base}/portfolio`,'file:///C:/Windows/test.exe','javascript:alert(1)','data:text/html,test','https://user:password@example.com','invalid']) assert.equal(externalWebURL(url,base),null)
})
test('popup and same-frame download clicks open once; editor navigation stays in the app', async () => {
  const contents = new EventEmitter(), opened = [], errors = []
  contents.setWindowOpenHandler = handler => { contents.popup = handler }
  installExternalNavigation(contents,{ getBase:()=>base,shellURL:'file:///studio/index.html',openExternal:async url=>opened.push(url),onError:error=>errors.push(error) })
  const baidu = 'https://pan.baidu.com/s/demo?pwd=1234'
  assert.deepEqual(contents.popup({url:baidu}),{action:'deny'})
  let prevented = 0
  const github = 'https://github.com/owner/repo'
  contents.emit('will-frame-navigate',{url:github,preventDefault:()=>prevented++})
  contents.emit('will-frame-navigate',{url:`${base}/utilities/anki`,preventDefault:()=>prevented++})
  contents.popup({url:'file:///C:/test.exe'})
  await new Promise(resolve=>setImmediate(resolve))
  assert.deepEqual(opened,[baidu,github]); assert.equal(prevented,1); assert.deepEqual(errors,[])
})
