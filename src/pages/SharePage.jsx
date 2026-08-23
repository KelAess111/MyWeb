import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

function SharePage() {
  const [status, setStatus] = useState('idle')
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return window.location.href
  }, [])

  const shareData = {
    title: 'Kel 的个人网站',
    text: '来看看这个个人网站。',
    url: shareUrl,
  }

  const handleShare = async () => {
    if (!shareUrl) {
      setStatus('unavailable')
      return
    }

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData)
        setStatus('shared')
      } catch (error) {
        if (error?.name === 'AbortError') {
          setStatus('cancelled')
          return
        }
        setStatus('error')
      }
      return
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setStatus('copied')
      } catch {
        setStatus('error')
      }
      return
    }

    setStatus('unavailable')
  }

  const statusText = {
    shared: '已打开系统分享面板。',
    cancelled: '已取消分享。',
    copied: '链接已复制到剪贴板。',
    error: '分享失败，请稍后重试。',
    unavailable: '当前浏览器不支持分享或复制链接。',
  }[status]

  return (
    <main className="share-page">
      <section className="section share-section">
        <div className="section-heading">
          <span className="section-kicker">Share This Space</span>
          <h1>分享</h1>
          <p>把这个网站或当前页面分享给朋友。分享操作不会收集账号、凭据或保存任何外部数据。</p>
        </div>

        <div className="share-card">
          <p className="share-url" aria-label="当前页面链接">{shareUrl || '当前页面链接不可用'}</p>
          <button type="button" className="btn primary" onClick={handleShare}>分享当前页面</button>
          {statusText && <p className="share-status" role="status">{statusText}</p>}
        </div>

        <nav className="share-links" aria-label="快速分享入口">
          <Link to="/interests" className="card card-link">
            <h2>个人兴趣</h2>
            <p>浏览兴趣分区。</p>
          </Link>
          <Link to="/journal" className="card card-link">
            <h2>博客日志</h2>
            <p>阅读公开日志。</p>
          </Link>
        </nav>
      </section>
    </main>
  )
}

export default SharePage
