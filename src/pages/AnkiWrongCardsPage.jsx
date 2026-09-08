import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getWrongCards, removeFromWrongCards } from '../services/ankiService'

function AnkiWrongCardsPage() {
  const [language, setLanguage] = useState('japanese')
  const [wrongCards, setWrongCards] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadWrongCards()
  }, [language])

  const loadWrongCards = async () => {
    setIsLoading(true)
    try {
      const data = await getWrongCards(language)
      setWrongCards(data)
    } catch (error) {
      console.error('加载错题本失败:', error)
      alert('加载错题本失败：' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (wrongCardId) => {
    if (!window.confirm('确定要从错题本移除吗？')) {
      return
    }

    try {
      await removeFromWrongCards(wrongCardId)
      alert('移除成功')
      loadWrongCards()
    } catch (error) {
      console.error('移除失败:', error)
      alert('移除失败：' + error.message)
    }
  }

  return (
    <main className="anki-wrong-cards-page">
      <div className="anki-wrong-cards-container">
        <header className="anki-wrong-cards-header">
          <h1 className="anki-wrong-cards-title">📕 错题本</h1>
          <Link to="/utilities/anki" className="anki-wrong-cards-back">
            ← 返回
          </Link>
        </header>

        <div className="anki-language-tabs">
          <button
            type="button"
            className={`anki-language-tab ${language === 'japanese' ? 'is-active' : ''}`}
            onClick={() => setLanguage('japanese')}
          >
            🇯🇵 日语
          </button>
          <button
            type="button"
            className={`anki-language-tab ${language === 'english' ? 'is-active' : ''}`}
            onClick={() => setLanguage('english')}
          >
            🇬🇧 英语
          </button>
        </div>

        {isLoading ? (
          <div className="anki-wrong-cards-loading">加载中...</div>
        ) : wrongCards.length === 0 ? (
          <div className="anki-wrong-cards-empty">
            <p>暂无错题</p>
            <p className="anki-wrong-cards-empty-hint">继续加油！</p>
          </div>
        ) : (
          <>
            <div className="anki-wrong-cards-info">
              共 {wrongCards.length} 道错题（最多保存50道）
            </div>
            <div className="anki-wrong-cards-list">
              {wrongCards.map((item) => {
                const card = item.anki_cards
                if (!card) return null

                return (
                  <div key={item.id} className="anki-wrong-card-item">
                    <div className="anki-wrong-card-content">
                      <div className="anki-wrong-card-original">{card.original_text}</div>
                      {card.pronunciation && (
                        <div className="anki-wrong-card-pronunciation">
                          [{card.pronunciation}]
                        </div>
                      )}
                      {card.part_of_speech && (
                        <div className="anki-wrong-card-pos">{card.part_of_speech}</div>
                      )}
                      <div className="anki-wrong-card-translation">{card.translation}</div>
                      {card.special_note && (
                        <div className="anki-wrong-card-note">💡 {card.special_note}</div>
                      )}
                      <div className="anki-wrong-card-date">
                        加入时间：{new Date(item.added_at).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="anki-wrong-card-remove-btn"
                      onClick={() => handleRemove(item.id)}
                    >
                      移除
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

export default AnkiWrongCardsPage
