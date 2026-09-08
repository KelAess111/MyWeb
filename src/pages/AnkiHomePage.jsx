import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getUserCards } from '../services/ankiService'

function AnkiHomePage() {
  const [stats, setStats] = useState({
    japanese: 0,
    english: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [japaneseCards, englishCards] = await Promise.all([
        getUserCards('japanese'),
        getUserCards('english'),
      ])

      setStats({
        japanese: japaneseCards.length,
        english: englishCards.length,
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="anki-home-page">
      <div className="anki-home-container">
        <header className="anki-home-header">
          <h1 className="anki-home-title">Anki 学习</h1>
          <p className="anki-home-subtitle">选择词库开始练习</p>
        </header>

        {isLoading ? (
          <div className="anki-home-loading">加载中...</div>
        ) : (
          <div className="anki-home-grid">
            <Link to="/utilities/anki/practice/japanese" className="anki-language-card">
              <div className="anki-language-icon">🇯🇵</div>
              <h2 className="anki-language-title">日语词库</h2>
              <p className="anki-language-count">{stats.japanese} 张卡片</p>
              <div className="anki-language-action">开始练习</div>
            </Link>

            <Link to="/utilities/anki/practice/english" className="anki-language-card">
              <div className="anki-language-icon">🇬🇧</div>
              <h2 className="anki-language-title">英语词库</h2>
              <p className="anki-language-count">{stats.english} 张卡片</p>
              <div className="anki-language-action">开始练习</div>
            </Link>
          </div>
        )}

        <div className="anki-home-actions">
          <Link to="/utilities/anki/manage" className="anki-home-btn anki-home-btn--secondary">
            📝 管理词库
          </Link>
          <Link to="/utilities/anki/wrong-cards" className="anki-home-btn anki-home-btn--secondary">
            📕 错题本
          </Link>
        </div>

        <Link to="/utilities" className="anki-home-back">
          ← 返回功能区
        </Link>
      </div>
    </main>
  )
}

export default AnkiHomePage
