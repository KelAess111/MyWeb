import { readFile, writeFile, rename } from 'node:fs/promises'

// Development-only editor: saves public content alongside the website.
export default function localGamePlans() {
  return {
    name: 'local-game-plans',
    configureServer(server) {
      const target = new URL('../public/content/game-plans.json', import.meta.url)
      let writing = false
      server.middlewares.use('/api/local-game-plans', async (req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        const fail = (status, message) => { res.statusCode = status; res.end(JSON.stringify({ error: message })) }
        const address = req.socket.remoteAddress
        if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address)) return fail(403, '仅支持本机编辑')
        if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return fail(403, '来源不匹配')
        if (req.method !== 'PUT' || !req.headers['content-type']?.startsWith('application/json')) return fail(405, '不支持的请求')
        if (writing) return fail(409, '正在保存，请稍后重试')
        writing = true
        try {
          let body = ''
          for await (const chunk of req) {
            body += chunk.toString()
            if (Buffer.byteLength(body) > 512000) { fail(413, '内容过大'); return }
          }
          const plans = JSON.parse(body)
          if (!Array.isArray(plans) || plans.length > 100 || plans.some((plan) => !plan || !['string', 'number'].includes(typeof plan.id) || typeof plan.name !== 'string' || !plan.name.trim() || ['description', 'recruiting', 'conceptImage', 'status', 'progress'].some(key => plan[key] != null && typeof plan[key] !== 'string'))) return fail(400, '规划格式不正确')
          // Keep the previous public version recoverable.
          await writeFile(new URL('../../game-plans.backup.local', target), await readFile(target))
          const temporary = new URL('./game-plans.tmp.json', target)
          await writeFile(temporary, JSON.stringify(plans, null, 2) + '\n')
          await rename(temporary, target)
          res.end(JSON.stringify({ ok: true }))
        } catch {
          fail(500, '保存失败，请重试；原有浏览器数据仍然保留')
        } finally { writing = false }
      })
    },
  }
}
