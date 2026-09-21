export default async function handler(req, res) {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url } = req.query

  // 验证 URL 参数
  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' })
  }

  // 只允许从 GitHub Release 代理
  if (!url.startsWith('https://github.com/')) {
    return res.status(403).json({ error: 'Only GitHub URLs are allowed' })
  }

  try {
    // 从 GitHub 获取 PDF
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status}`)
    }

    // 获取 PDF 数据
    const pdfBuffer = await response.arrayBuffer()

    // 设置响应头
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    // 返回 PDF 数据
    res.send(Buffer.from(pdfBuffer))
  } catch (error) {
    console.error('PDF proxy error:', error)
    res.status(500).json({ error: 'Failed to fetch PDF' })
  }
}
