import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getUserCards,
  createCard,
  updateCard,
  deleteCard,
  searchCards,
} from '../services/ankiService'

// 检查是否为预览模式
function isPreviewMode() {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    return window.sessionStorage.getItem('previewMode') === 'true'
  } catch {
    return false
  }
}

function AnkiManagePage() {
  const [language, setLanguage] = useState('japanese')
  const [cards, setCards] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  const [formData, setFormData] = useState({
    originalText: '',
    pronunciation: '',
    partOfSpeech: '',
    translation: '',
    specialNote: '',
  })
  const [isPreview] = useState(() => isPreviewMode())

  useEffect(() => {
    loadCards()
  }, [language])

  const loadCards = async () => {
    setIsLoading(true)
    try {
      const data = await getUserCards(language)
      setCards(data)
    } catch (error) {
      console.error('加载卡片失败:', error)
      alert('加载卡片失败：' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadCards()
      return
    }

    try {
      const results = await searchCards(language, searchTerm)
      setCards(results)
    } catch (error) {
      console.error('搜索失败:', error)
      alert('搜索失败：' + error.message)
    }
  }

  const openEditor = (card = null) => {
    if (card) {
      setEditingCard(card)
      setFormData({
        originalText: card.original_text || '',
        pronunciation: card.pronunciation || '',
        partOfSpeech: card.part_of_speech || '',
        translation: card.translation || '',
        specialNote: card.special_note || '',
      })
    } else {
      setEditingCard(null)
      setFormData({
        originalText: '',
        pronunciation: '',
        partOfSpeech: '',
        translation: '',
        specialNote: '',
      })
    }
    setShowEditor(true)
  }

  const closeEditor = () => {
    setShowEditor(false)
    setEditingCard(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.originalText.trim() || !formData.translation.trim()) {
      alert('原文和中文意思不能为空')
      return
    }

    try {
      if (editingCard) {
        await updateCard(editingCard.id, {
          originalText: formData.originalText,
          pronunciation: formData.pronunciation,
          partOfSpeech: formData.partOfSpeech,
          translation: formData.translation,
          specialNote: formData.specialNote,
        })
        alert('更新成功')
      } else {
        await createCard({
          language,
          originalText: formData.originalText,
          pronunciation: formData.pronunciation,
          partOfSpeech: formData.partOfSpeech,
          translation: formData.translation,
          specialNote: formData.specialNote,
        })
        alert('添加成功')
      }
      closeEditor()
      loadCards()
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败：' + error.message)
    }
  }

  const handleDelete = async (cardId) => {
    if (!window.confirm('确定要删除这张卡片吗？')) {
      return
    }

    try {
      await deleteCard(cardId)
      alert('删除成功')
      loadCards()
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败：' + error.message)
    }
  }

  return (
    <main className="anki-manage-page">
      <div className="anki-manage-container">
        <header className="anki-manage-header">
          <h1 className="anki-manage-title">词库管理</h1>
          <Link to="/utilities/anki" className="anki-manage-back">
            ← 返回
          </Link>
        </header>

        <div className="anki-manage-controls">
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

          <div className="anki-search-bar">
            <input
              type="text"
              className="anki-search-input"
              placeholder="搜索卡片..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              type="button"
              className="anki-search-btn"
              onClick={handleSearch}
            >
              搜索
            </button>
          </div>

          {!isPreview && (
            <button
              type="button"
              className="anki-add-btn"
              onClick={() => openEditor()}
            >
              + 添加卡片
            </button>
          )}
        </div>

        {isPreview && (
          <div className="anki-preview-notice">
            <span className="anki-preview-icon">👁️</span>
            预览模式：仅可查看，无法编辑
          </div>
        )}

        {isLoading ? (
          <div className="anki-manage-loading">加载中...</div>
        ) : cards.length === 0 ? (
          <div className="anki-manage-empty">
            <p>暂无卡片</p>
            {!isPreview && (
              <button
                type="button"
                className="anki-add-btn"
                onClick={() => openEditor()}
              >
                添加第一张卡片
              </button>
            )}
          </div>
        ) : (
          <div className="anki-cards-list">
            {cards.map((card) => (
              <div key={card.id} className="anki-card-item">
                <div className="anki-card-content">
                  <div className="anki-card-original">{card.original_text}</div>
                  {card.pronunciation && (
                    <div className="anki-card-pronunciation">[{card.pronunciation}]</div>
                  )}
                  {card.part_of_speech && (
                    <div className="anki-card-pos">{card.part_of_speech}</div>
                  )}
                  <div className="anki-card-translation">{card.translation}</div>
                  {card.special_note && (
                    <div className="anki-card-note">💡 {card.special_note}</div>
                  )}
                </div>
                {!isPreview && (
                  <div className="anki-card-actions">
                    <button
                      type="button"
                      className="anki-card-action-btn anki-card-action-btn--edit"
                      onClick={() => openEditor(card)}
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      className="anki-card-action-btn anki-card-action-btn--delete"
                      onClick={() => handleDelete(card.id)}
                    >
                      删除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showEditor && (
          <div className="anki-editor-overlay" onClick={closeEditor}>
            <div className="anki-editor-modal" onClick={(e) => e.stopPropagation()}>
              <h2 className="anki-editor-title">
                {editingCard ? '编辑卡片' : '添加卡片'}
              </h2>
              <form className="anki-editor-form" onSubmit={handleSubmit}>
                <div className="anki-form-group">
                  <label className="anki-form-label">
                    原文词组 <span className="anki-form-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="anki-form-input"
                    value={formData.originalText}
                    onChange={(e) =>
                      setFormData({ ...formData, originalText: e.target.value })
                    }
                    required
                  />
                </div>

                {language === 'japanese' && (
                  <div className="anki-form-group">
                    <label className="anki-form-label">罗马音</label>
                    <input
                      type="text"
                      className="anki-form-input"
                      value={formData.pronunciation}
                      onChange={(e) =>
                        setFormData({ ...formData, pronunciation: e.target.value })
                      }
                    />
                  </div>
                )}

                {language === 'english' && (
                  <div className="anki-form-group">
                    <label className="anki-form-label">词性</label>
                    <input
                      type="text"
                      className="anki-form-input"
                      placeholder="如：n. v. adj."
                      value={formData.partOfSpeech}
                      onChange={(e) =>
                        setFormData({ ...formData, partOfSpeech: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className="anki-form-group">
                  <label className="anki-form-label">
                    中文意思 <span className="anki-form-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="anki-form-input"
                    value={formData.translation}
                    onChange={(e) =>
                      setFormData({ ...formData, translation: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="anki-form-group">
                  <label className="anki-form-label">特别注释</label>
                  <textarea
                    className="anki-form-textarea"
                    value={formData.specialNote}
                    onChange={(e) =>
                      setFormData({ ...formData, specialNote: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="anki-editor-actions">
                  <button type="submit" className="anki-editor-btn anki-editor-btn--primary">
                    {editingCard ? '更新' : '添加'}
                  </button>
                  <button
                    type="button"
                    className="anki-editor-btn anki-editor-btn--secondary"
                    onClick={closeEditor}
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default AnkiManagePage
