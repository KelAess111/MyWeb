import test from 'node:test'
import assert from 'node:assert/strict'
import {createPdfProxy,MAX_PDF_BYTES} from '../api/pdf-proxy.js'
const url='https://github.com/KelAess111/MyWeb/releases/download/v1.0.0/_.pdf'
function response() {return {headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.code=n;return this},json(v){this.body=v;return this},send(v){this.body=v;return this}}}
test('PDF proxy denies arbitrary sources, arrays and redirects before fetching external hosts',async()=>{
  let calls=0
  const handler=createPdfProxy(async()=>{calls++;return new Response(null,{status:302,headers:{location:'http://127.0.0.1/private'}})})
  for(const value of [undefined,[url],url.replace('KelAess111','other'),url+'?x=1','https://github.com/login']) {const res=response();await handler({method:'GET',query:{url:value}},res);assert.equal(res.code,403)}
  assert.equal(calls,0)
  const res=response();await handler({method:'GET',query:{url}},res);assert.equal(res.code,502);assert.equal(calls,1)
})
test('PDF proxy checks signatures, declared and actual sizes, and allows GitHub asset redirects',async()=>{
  for(const upstream of [new Response('html',{headers:{'content-type':'text/html'}}),new Response('fake',{headers:{'content-type':'application/pdf'}})]) {
    const res=response();await createPdfProxy(async()=>upstream)({method:'GET',query:{url}},res);assert.equal(res.code,502)
  }
  for(const upstream of [new Response('small',{headers:{'content-type':'application/pdf','content-length':String(MAX_PDF_BYTES+1)}}),new Response(new Uint8Array(MAX_PDF_BYTES+1),{headers:{'content-type':'application/pdf'}})]) {
    const res=response();await createPdfProxy(async()=>upstream)({method:'GET',query:{url}},res);assert.equal(res.code,413)
  }
  let calls=0
  const res=response();await createPdfProxy(async()=>++calls===1?new Response(null,{status:302,headers:{location:'https://release-assets.githubusercontent.com/github-production-release-asset/123/pdf?signature=test'}}):new Response('%PDF-1.7 test',{headers:{'content-type':'application/octet-stream'}}))({method:'GET',query:{url}},res)
  assert.equal(calls,2);assert.ok(Buffer.isBuffer(res.body));assert.equal(res.headers['X-Content-Type-Options'],'nosniff')
})
test('PDF proxy limits concurrency and per-instance request volume',async()=>{
  let release
  const pending=new Promise(resolve=>{release=resolve})
  const handler=createPdfProxy(async()=>{await pending;return new Response('%PDF-1.7',{headers:{'content-type':'application/pdf'}})})
  const a=handler({method:'GET',query:{url}},response()),b=handler({method:'GET',query:{url}},response())
  const res=response();await handler({method:'GET',query:{url}},res);assert.equal(res.code,429)
  release();await Promise.all([a,b])
  let now=0;const limited=createPdfProxy(async()=>new Response('%PDF-1.7',{headers:{'content-type':'application/pdf'}}),()=>now)
  for(let i=0;i<40;i++)await limited({method:'GET',query:{url}},response())
  const blocked=response();await limited({method:'GET',query:{url}},blocked);assert.equal(blocked.code,429)
  now=60001;const fresh=response();await limited({method:'GET',query:{url}},fresh);assert.ok(Buffer.isBuffer(fresh.body))
})
