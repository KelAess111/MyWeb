// 同时读取 .txt、.md 和 .pdf 文件
const txtModules = import.meta.glob('../assets/article/*.txt', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const mdModules = import.meta.glob('../assets/article/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const pdfModules = import.meta.glob('../assets/article/*.pdf', {
  eager: true,
  query: '?url',
  import: 'default',
})

// 外部 PDF 文件（从 GitHub Releases）
const externalPdfArticles = {
  'ディメンション凸ラバース!!_設定資料集': {
    url: 'https://github.com/KelAess111/MyWeb/releases/download/v1.0.0/_.pdf',
    title: 'ディメンション凸ラバース!!_設定資料集',
  },
}

const articleModules = { ...txtModules, ...mdModules, ...pdfModules }

const articleCollator = new Intl.Collator('zh-Hans-CN', {
  numeric: true,
  sensitivity: 'base',
})

function getFileName(path) {
  return path.split('/').pop() ?? ''
}

function getTitle(path) {
  return getFileName(path).replace(/\.(txt|md|pdf)$/, '').trim()
}

// 判断文件格式
function isMarkdownFile(path) {
  return path.endsWith('.md')
}

function isPdfFile(path) {
  return path.endsWith('.pdf')
}

function getSlug(title, index) {
  const normalized = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || `article-${index + 1}`
}

function parseArticleContent(rawContent, isPdf) {
  // PDF 文件返回 URL，不需要解析内容
  if (isPdf) {
    return { title: '', content: '', pdfUrl: rawContent }
  }

  const lines = String(rawContent ?? '').split('\n')
  const title = lines[0]?.trim() || ''
  const content = lines.slice(1).join('\n').trim()

  return { title, content }
}

// 处理本地文件
const localArticles = Object.entries(articleModules).map(([path, rawContent]) => {
  const fileName = getTitle(path)
  const isPdf = isPdfFile(path)
  const parsed = parseArticleContent(rawContent, isPdf)
  const isMarkdown = isMarkdownFile(path)

  return {
    path,
    fileName,
    title: parsed.title || fileName,
    content: parsed.content,
    rawContent: isPdf ? null : rawContent,
    pdfUrl: parsed.pdfUrl,
    isMarkdown,
    isPdf,
  }
})

// 处理外部 PDF 文件
const externalArticles = Object.entries(externalPdfArticles).map(([key, data]) => ({
  path: `external://${key}`,
  fileName: data.title,
  title: data.title,
  content: '',
  rawContent: null,
  pdfUrl: data.url,
  isMarkdown: false,
  isPdf: true,
}))

export const articles = [...localArticles, ...externalArticles]
  .filter((item) => item.title)
  .sort((left, right) => articleCollator.compare(left.title, right.title))
  .map((item, index) => ({
    ...item,
    id: `article-${index + 1}`,
    slug: getSlug(item.fileName, index),
    excerpt: item.isPdf ? 'PDF 文档' : (item.content.slice(0, 180).trim() + (item.content.length > 180 ? '…' : '')),
  }))

export function findArticleBySlug(slug) {
  return articles.find((article) => article.slug === slug)
}
