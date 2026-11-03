import handler from '../api/pdf-proxy.js'

export default function localPdfProxy() {
  return {
    name:'local-pdf-proxy',
    configureServer(server) {
      server.middlewares.use('/api/pdf-proxy',async (req,res)=>{
        const values = new URL(req.url,'http://localhost').searchParams.getAll('url')
        req.query = {url:values.length === 1 ? values[0] : null}
        res.status = code => {res.statusCode=code; return res}
        res.json = body => {res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(body)); return res}
        res.send = body => {res.end(body); return res}
        await handler(req,res)
      })
    },
  }
}
