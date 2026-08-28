const articleModules = import.meta.glob('../assets/article/*.txt', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const articleCollator = new Intl.Collator('zh-Hans-CN', {
  numeric: true,
  sensitivity: 'base',
})

function getFileName(path) {
  return path.split('/').pop() ?? ''
}

function getTitle(path) {
  return getFileName(path).replace(/\.txt$/, '').trim()
}

function getSlug(title, index) {
  const normalized = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || `article-${index + 1}`
}

function parseArticleContent(rawContent) {
  const lines = String(rawContent ?? '').split('\n')
  const title = lines[0]?.trim() || ''
  const content = lines.slice(1).join('\n').trim()

  return { title, content }
}

export const articles = Object.entries(articleModules)
  .map(([path, rawContent]) => {
    const fileName = getTitle(path)
    const parsed = parseArticleContent(rawContent)

    return {
      path,
      fileName,
      title: parsed.title || fileName,
      content: parsed.content,
      rawContent,
    }
  })
  .filter((item) => item.title)
  .sort((left, right) => articleCollator.compare(left.title, right.title))
  .map((item, index) => ({
    ...item,
    id: `article-${index + 1}`,
    slug: getSlug(item.fileName, index),
    excerpt: item.content.slice(0, 180).trim() + (item.content.length > 180 ? '…' : ''),
  }))

export function findArticleBySlug(slug) {
  return articles.find((article) => article.slug === slug)
}
