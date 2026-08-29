import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { findArticleBySlug } from '../data/articleData'

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
    <main className="article-detail-page">
      <article className="article-detail-container">
        <header className="article-detail-header">
          <Link to="/share" className="article-back-link">← 返回列表</Link>
          <h1 className="article-detail-title">{article.title}</h1>
        </header>

        <div className="article-detail-body">
          {article.isMarkdown ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
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
    </main>
  )
}

export default ArticleDetailPage
