import { useState } from 'react'
import { Link } from 'react-router-dom'
import { articles } from '../data/articleData'

const formats = ['全部', 'PDF', 'Markdown', 'TXT']
const getFormat = (article) => article.isPdf ? 'PDF' : article.isMarkdown ? 'Markdown' : 'TXT'
const getExcerpt = (article) => {
  if (article.isPdf) return '翻阅完整文档，也可以打开原文件，留待日后细读。'
  const text = article.content.replace(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#*`>|~\\]/g, '').replace(/\s+/g, ' ').trim()
  return text ? text.slice(0, 130) + (text.length > 130 ? '…' : '') : '一份简短的文字收藏，打开看看。'
}

export default function LibraryPage() {
  const [query, setQuery] = useState('')
  const [format, setFormat] = useState('全部')
  const visibleArticles = articles.filter((article) =>
    (format === '全部' || getFormat(article) === format) &&
    `${article.title} ${article.content}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  )
  return (
    <main className="share-page library-page">
      <section className="section share-section">
        <header className="library-heading">
          <div><span className="section-kicker">THE READING ROOM / 资料分享</span><h1>让有用的知识，<br /><span>在这里相遇。</span></h1><p>整理学习笔记，收藏创作灵感。挑一份感兴趣的资料，慢慢读。</p></div>
          <div className="library-count"><strong>{String(articles.length).padStart(2, '0')}</strong><span>份资料 · 持续积累</span></div>
        </header>
        <div className="library-toolbar">
          <div className="library-filters" role="group" aria-label="按文件格式筛选">{formats.map((item) => <button type="button" key={item} aria-pressed={format === item} onClick={() => setFormat(item)}>{item}</button>)}</div>
          <label className="library-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="搜索资料" placeholder="搜索标题或正文…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        </div>
        <p className="library-result-count" role="status">{query || format !== '全部' ? `找到 ${visibleArticles.length} 份资料` : '全部收藏'}<span>点击卡片，即可开始阅读</span></p>
        {visibleArticles.length ? <div className="article-grid">{visibleArticles.map((article, index) => (
          <Link key={article.path} className="article-card" to={`/share/${article.slug}`} style={{ '--article-index': Math.min(index, 5) }}>
            <div className="library-card-top"><span className={`library-format ${article.isPdf ? 'is-pdf' : ''}`}>{getFormat(article)}</span><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span></div>
            <div className="article-card-content"><h2 className="article-card-title">{article.title.replace(/^#+\s*/, '')}</h2><p className="article-card-excerpt">{getExcerpt(article)}</p></div>
            <div className="library-card-bottom"><span>{article.isPdf ? '文档阅览' : `约 ${Math.max(1, Math.ceil(article.content.length / 450))} 分钟阅读`}</span><span className="article-card-hint">开始阅读 <span aria-hidden="true">↗</span></span></div>
          </Link>
        ))}</div> : <div className="article-empty-state"><strong>{articles.length ? '还没有找到匹配的资料' : '资料正在整理中'}</strong><p>换个关键词，或者看看其他格式的资料。</p>{articles.length > 0 && <button className="btn secondary" onClick={() => { setQuery(''); setFormat('全部') }}>查看全部资料</button>}</div>}
        <footer className="library-footer">关于学习，也关于创作。<span>愿这些收藏，对你也有一点帮助。</span></footer>
      </section>
    </main>
  )
}
