// Only the portfolio's own release PDFs may enter this proxy.
export const MAX_PDF_BYTES = 4 * 1024 * 1024
function sourceURL(value) {
  if (typeof value !== 'string' || value.length > 2048) return null
  try {
    const url = new URL(value)
    return url.origin === 'https://github.com' && !url.username && !url.password && !url.search && !url.hash && /^\/KelAess111\/MyWeb\/releases\/download\/[^/]+\/[^/]+\.pdf$/i.test(url.pathname) ? url : null
  } catch { return null }
}
function redirectURL(value, base) {
  const url = new URL(value,base)
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) throw new Error('redirect')
  if (url.hostname !== 'release-assets.githubusercontent.com' && !sourceURL(url.href)) throw new Error('redirect')
  return url
}
export function createPdfProxy(fetchPDF = globalThis.fetch, clock = Date.now) {
  let active = 0, count = 0, windowStart = clock()
  return async function handler(req,res) {
    const fail = (status,message) => res.status(status).json({error:message})
    if (req.method !== 'GET') { res.setHeader('Allow','GET'); return fail(405,'Method not allowed') }
    let url = sourceURL(req.query?.url)
    if (!url) return fail(403,'Unsupported PDF source')
    if (clock()-windowStart >= 60000) { count=0; windowStart=clock() }
    if (active >= 2 || count >= 40) { res.setHeader('Retry-After','60'); return fail(429,'Please retry later') }
    active++; count++
    const controller = new AbortController()
    const timer = setTimeout(()=>controller.abort(),8000)
    const disconnect = ()=>controller.abort()
    res.on?.('close',disconnect)
    let reader
    try {
      let response
      for(let redirects=0; ; redirects++) {
        response = await fetchPDF(url.href,{redirect:'manual',signal:controller.signal,headers:{'User-Agent':'Kel-Portfolio-PDF','Accept':'application/pdf, application/octet-stream'}})
        if (![301,302,303,307,308].includes(response.status)) break
        await response.body?.cancel()
        if (redirects >= 3 || !response.headers.get('location')) throw new Error('redirect')
        url = redirectURL(response.headers.get('location'),url)
      }
      if (response.status !== 200 || !response.body) throw new Error('upstream')
      const type = (response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()
      if (!['application/pdf','application/octet-stream'].includes(type)) throw new Error('type')
      if (Number(response.headers.get('content-length')) > MAX_PDF_BYTES) return fail(413,'PDF exceeds preview limit; use the original file')
      reader = response.body.getReader()
      const chunks=[]; let size=0
      while (true) {
        const {done,value}=await reader.read()
        if(done)break
        size+=value.byteLength
        if(size>MAX_PDF_BYTES)return fail(413,'PDF exceeds preview limit; use the original file')
        chunks.push(Buffer.from(value))
      }
      const buffer=Buffer.concat(chunks)
      if (!buffer.subarray(0,1024).includes(Buffer.from('%PDF-'))) throw new Error('type')
      res.setHeader('Content-Type','application/pdf')
      res.setHeader('X-Content-Type-Options','nosniff')
      res.setHeader('Cache-Control','public, max-age=600, s-maxage=3600')
      return res.send(buffer)
    } catch {
      if (!res.destroyed && !res.headersSent) return fail(controller.signal.aborted ? 504 : 502,'PDF preview unavailable; use the original file')
    } finally {
      clearTimeout(timer); controller.abort(); res.off?.('close',disconnect)
      await reader?.cancel().catch(()=>{})
      active--
    }
  }
}
export default createPdfProxy()
