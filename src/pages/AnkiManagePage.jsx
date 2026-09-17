import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getUserCards,
  createCard,
  updateCard,
  deleteCard,
  searchCards,
  getDiscardedCards,
  restoreCard,
} from '../services/ankiService'
import { Toast, ConfirmDialog } from '../components/Toast'

// 检查是否为本地编辑模式
function isLocalEditMode() {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    return window.localStorage.getItem('localEditMode') === 'true'
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
  const [viewMode, setViewMode] = useState('active') // 'active' | 'discarded'
  const [formData, setFormData] = useState({
    originalText: '',
    pronunciation: '',
    kanjiForm: '',
    partOfSpeech: '',
    translation: '',
    specialNote: '',
  })
  const [canEdit] = useState(() => isLocalEditMode())
  const [toast, setToast] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)

  useEffect(() => {
    loadCards()
  }, [language, viewMode])

  const loadCards = async () => {
    setIsLoading(true)
    try {
      const data = viewMode === 'active'
        ? await getUserCards(language, false)
        : await getDiscardedCards(language)
      setCards(data)
    } catch (error) {
      console.error('加载卡片失败:', error)
      setToast({ message: '加载卡片失败：' + error.message, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async (cardId) => {
    try {
      await restoreCard(cardId)
      setToast({ message: '恢复成功', type: 'success' })
      loadCards()
    } catch (error) {
      console.error('恢复失败:', error)
      setToast({ message: '恢复失败：' + error.message, type: 'error' })
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
      setToast({ message: '搜索失败：' + error.message, type: 'error' })
    }
  }

  const openEditor = (card = null) => {
    if (card) {
      setEditingCard(card)
      setFormData({
        originalText: card.original_text || '',
        pronunciation: card.pronunciation || '',
        kanjiForm: card.kanji_form || '',
        partOfSpeech: card.part_of_speech || '',
        translation: card.translation || '',
        specialNote: card.special_note || '',
      })
    } else {
      setEditingCard(null)
      setFormData({
        originalText: '',
        pronunciation: '',
        kanjiForm: '',
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
      setToast({ message: '原文和中文意思不能为空', type: 'warning' })
      return
    }

    try {
      if (editingCard) {
        await updateCard(editingCard.id, {
          originalText: formData.originalText,
          pronunciation: formData.pronunciation,
          kanjiForm: formData.kanjiForm,
          partOfSpeech: formData.partOfSpeech,
          translation: formData.translation,
          specialNote: formData.specialNote,
        })
        setToast({ message: '更新成功', type: 'success' })
      } else {
        await createCard({
          language,
          originalText: formData.originalText,
          pronunciation: formData.pronunciation,
          kanjiForm: formData.kanjiForm,
          partOfSpeech: formData.partOfSpeech,
          translation: formData.translation,
          specialNote: formData.specialNote,
        })
        setToast({ message: '添加成功', type: 'success' })
      }
      closeEditor()
      loadCards()
    } catch (error) {
      console.error('保存失败:', error)
      setToast({ message: '保存失败：' + error.message, type: 'error' })
    }
  }

  const handleDelete = async (cardId) => {
    setConfirmDialog({
      message: '确定要删除这张卡片吗？',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await deleteCard(cardId)
          setToast({ message: '删除成功', type: 'success' })
          loadCards()
        } catch (error) {
          console.error('删除失败:', error)
          setToast({ message: '删除失败：' + error.message, type: 'error' })
        }
      },
      onCancel: () => setConfirmDialog(null)
    })
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

          <div className="anki-view-mode-tabs">
            <button
              type="button"
              className={`anki-view-mode-tab ${viewMode === 'active' ? 'is-active' : ''}`}
              onClick={() => setViewMode('active')}
            >
              📚 活跃卡片
            </button>
            <button
              type="button"
              className={`anki-view-mode-tab ${viewMode === 'discarded' ? 'is-active' : ''}`}
              onClick={() => setViewMode('discarded')}
            >
              📦 已弃置
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

          {canEdit && (
            <button
              type="button"
              className="anki-add-btn"
              onClick={() => openEditor()}
            >
              + 添加卡片
            </button>
          )}
        </div>

        {!canEdit && (
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
            {canEdit && (
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
                  {card.kanji_form && (
                    <div className="anki-card-kanji">汉字：{card.kanji_form}</div>
                  )}
                  {card.part_of_speech && (
                    <div className="anki-card-pos">{card.part_of_speech}</div>
                  )}
                  <div className="anki-card-translation">{card.translation}</div>
                  {card.special_note && (
                    <div className="anki-card-note">💡 {card.special_note}</div>
                  )}
                </div>
                <div className="anki-card-actions">
                  {viewMode === 'active' ? (
                    <>
                      {canEdit && (
                        <>
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
                        </>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      className="anki-card-action-btn anki-card-action-btn--restore"
                      onClick={() => handleRestore(card.id)}
                    >
                      恢复
                    </button>
                  )}
                </div>
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
                  <>
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

                    <div className="anki-form-group">
                      <label className="anki-form-label">汉字形式</label>
                      <input
                        type="text"
                        className="anki-form-input"
                        placeholder="如：平仮名（如果有的话）"
                        value={formData.kanjiForm}
                        onChange={(e) =>
                          setFormData({ ...formData, kanjiForm: e.target.value })
                        }
                      />
                    </div>
                  </>
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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </main>
  )
}

export default AnkiManagePage
