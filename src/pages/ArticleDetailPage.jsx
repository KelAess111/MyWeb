import { Link, useParams } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { findArticleBySlug } from '../data/articleData'
import readingOutline from '../utils/readingOutline'

// 懒加载 PDF 查看器
const PDFViewer = lazy(() => import('../components/PDFViewer'))

function ArticleDetailPage() {
  const { slug } = useParams()
  const article = findArticleBySlug(slug)

  if (!article) {
    return (
      <main className="article-detail-page">
        <section className="section article-not-found">
          <h1>文章未找到</h1>
          <p>该文章不存在或已被移除。</p>
          <Link to="/share" className="btn secondary">返回文章列表</Link>
        </section>
      </main>
    )
  }

  return (
    <main className={`article-detail-page reading-page${article.isPdf ? ' reading-page--pdf' : ''}`}>
      <article className="article-detail-container">
        <header className="article-detail-header">
          <Link to="/share" className="article-back-link">← 返回列表</Link>
          <p className="reading-meta">{article.isPdf ? 'PDF / 文档阅览' : `${article.isMarkdown ? 'MARKDOWN' : 'TXT'} / 约 ${Math.max(1, Math.ceil(article.content.length / 450))} 分钟阅读`}</p>
          <h1 className="article-detail-title">{article.title.replace(/^#+\s*/, '')}</h1>
        </header>

        <div className="article-detail-body">
          {article.isPdf ? (
            <Suspense fallback={
              <div className="pdf-loading">
                <div className="loading-spinner"></div>
                <p>正在加载 PDF 查看器...</p>
              </div>
            }>
              <PDFViewer key={article.pdfUrl} url={article.pdfUrl} fileName={article.fileName} />
            </Suspense>
          ) : article.isMarkdown ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, readingOutline]}
            >
              {article.content}
            </ReactMarkdown>
          ) : (
            article.content.split(/\n{2,}/).map((paragraph, index) => (
              <p key={`paragraph-${index}`}>{paragraph}</p>
            ))
          )}
        </div>
      </article>
      <footer className="reading-footer"><span>读到这里，谢谢你的停留。</span><Link to="/share">继续探索资料 →</Link></footer>
    </main>
  )
}

export default ArticleDetailPage
