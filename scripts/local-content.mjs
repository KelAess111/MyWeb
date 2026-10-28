import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import { resolve } from 'node:path'

export function allowLocalWrite(req, enabled) {
  if (!enabled) return false
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) return false
  try {
    const host = new URL(`http://${req.headers.host}`)
    if (!['localhost', '127.0.0.1', '[::1]'].includes(host.hostname)) return false
    return req.headers.origin === host.origin && req.headers['x-kel-edit-mode'] === 'local'
  } catch { return false }
}

export const validCards = cards => Array.isArray(cards) && cards.length <= 20000 && cards.every(card =>
  card && typeof card.id === 'string' && ['english', 'japanese'].includes(card.language) &&
  typeof card.original_text === 'string' && card.original_text.trim() && typeof card.translation === 'string' && card.translation.trim() &&
  ['pronunciation', 'kanji_form', 'part_of_speech', 'special_note'].every(key => card[key] == null || typeof card[key] === 'string')
) && new Set(cards.map(card => card.id)).size === cards.length

export default function localContent() {
  return {
    name: 'kel-local-content',
    configureServer(server) {
      let writing = false
      server.middlewares.use('/api/local-anki-cards', async (req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        const fail = (code, error) => { res.statusCode = code; res.end(JSON.stringify({ error })) }
        if (!allowLocalWrite(req, server.config.env.VITE_EDIT_MODE === 'true')) return fail(403, '仅支持本机编辑模式')
        if (req.method !== 'PUT' || !req.headers['content-type']?.startsWith('application/json')) return fail(405, '请求格式不正确')
        if (writing) return fail(409, '正在保存，请稍后重试')
        writing = true
        try {
          let body = ''
          for await (const chunk of req) {
            body += chunk.toString()
            if (Buffer.byteLength(body) > 16000000) return fail(413, '内容过大')
          }
          let cards
          try { cards = JSON.parse(body) } catch { return fail(400, 'JSON 格式不正确') }
          if (!validCards(cards)) return fail(400, '卡片格式不正确或 ID 重复')
          const folder = resolve(server.config.root, 'public/content')
          const file = resolve(folder, 'anki-cards.json')
          await mkdir(folder, { recursive: true })
          try { await writeFile(`${file}.backup.local`, await readFile(file)) } catch (error) { if (error.code !== 'ENOENT') throw error }
          await writeFile(`${file}.tmp.local`, JSON.stringify(cards, null, 2) + '\n')
          await rename(`${file}.tmp.local`, file)
          res.end(JSON.stringify({ ok: true, count: cards.length }))
        } catch { fail(500, '保存失败，原文件已保留') }
        finally { writing = false }
      })
    },
  }
}
