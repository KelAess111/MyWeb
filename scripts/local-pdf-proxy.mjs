import { Readable } from 'node:stream'

export default function localPdfProxy() {
  return {
    name: 'local-pdf-proxy',
    configureServer(server) {
      server.middlewares.use('/api/pdf-proxy', async (req, res) => {
        if (req.method !== 'GET') { res.statusCode = 405; res.end(); return }
        try {
          const url = new URL(new URL(req.url, 'http://localhost').searchParams.get('url'))
          if (url.origin !== 'https://github.com' || !/^\/[^/]+\/[^/]+\/releases\/download\//.test(url.pathname)) {
            res.statusCode = 403; res.end('Unsupported PDF source'); return
          }
          const controller = new AbortController()
          res.on('close', () => controller.abort())
          const response = await fetch(url, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]), headers: req.headers.range ? { Range: req.headers.range } : {} })
          if (!response.ok || !response.body) { res.statusCode = 502; res.end('PDF unavailable'); return }
          res.statusCode = response.status
          res.setHeader('Content-Type', 'application/pdf')
          for (const header of ['content-length', 'content-range', 'accept-ranges']) {
            if (response.headers.has(header)) res.setHeader(header, response.headers.get(header))
          }
          Readable.fromWeb(response.body).on('error', () => res.destroy()).pipe(res)
        } catch {
          if (!res.headersSent) res.statusCode = 502
          res.end('PDF unavailable')
        }
      })
    },
  }
}
