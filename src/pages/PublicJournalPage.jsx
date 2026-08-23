import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AnnotatedText from '../components/AnnotatedText'
import AfterlightAttachmentGrid from '../components/AfterlightAttachmentGrid'
import { listPublishedJournalEntries } from '../services/afterlightEntries'
import { isSupabaseConfigured } from '../lib/supabase'

function formatEntryDate(entryDate) {
  if (!entryDate) return '未填写日期'
  return new Date(`${entryDate}T00:00:00`).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function PublicJournalPage() {
  const [entries, setEntries] = useState([])
  const [status, setStatus] = useState(isSupabaseConfigured ? 'loading' : 'missing-config')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined
    let isCurrent = true
    listPublishedJournalEntries()
      .then((nextEntries) => {
        if (isCurrent) { setEntries(nextEntries); setStatus('ready') }
      })
      .catch(() => {
        if (isCurrent) { setErrorMessage('公开日志暂时无法读取，请稍后再试。'); setStatus('error') }
      })
    return () => { isCurrent = false }
  }, [])

  return (
    <main className="public-journal-page">
      <section className="section public-journal-shell">
        <div className="section-heading">
          <span className="section-kicker">Blog / Journal</span>
          <h1>博客日志</h1>
          <p>这里记录公开的创作片段、过程和阶段性想法。</p>
        </div>
        <div className="public-journal-actions">
          <Link className="btn secondary" to="/">返回首页</Link>
          <Link className="btn secondary" to="/works/writing">进入写作空间</Link>
        </div>
        {status === 'loading' ? <p className="afterlight-status-message">公开日志加载中…</p> : null}
        {status === 'missing-config' ? <p className="afterlight-status-message">公开日志服务尚未配置。</p> : null}
        {status === 'error' ? <p className="afterlight-status-message is-error" role="alert">{errorMessage}</p> : null}
        {status === 'ready' && !entries.length ? <p className="afterlight-status-message">暂时还没有公开日志。</p> : null}
        {entries.length ? (
          <div className="afterlight-entry-list public-journal-entry-list">
            {entries.map((entry) => (
              <article className="card afterlight-entry-card" key={entry.id}>
                <div className="afterlight-entry-meta">
                  <span className="afterlight-entry-date">{formatEntryDate(entry.entryDate)}</span>
                  <span className="afterlight-entry-badge is-published">已公开</span>
                </div>
                <div className="afterlight-entry-copy">
                  <h2>{entry.title || '未命名日志'}</h2>
                  <AnnotatedText body={entry.body} annotations={entry.annotations} idPrefix={`public-journal-${entry.id}`} />
                  <AfterlightAttachmentGrid attachments={entry.attachments} />
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default PublicJournalPage
