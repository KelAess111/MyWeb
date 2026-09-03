import { useEffect, useState } from 'react'
import { getAllQuestions, updateQuestion, deleteQuestion } from '../services/qaService'
import { supabase } from '../lib/supabase'

function QAAdminPage() {
  const [questions, setQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editAnswer, setEditAnswer] = useState('')
  const [editStatus, setEditStatus] = useState('answered')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadQuestions()
    }
  }, [isAuthenticated])

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user?.email === '2597631359@qq.com') {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
  }

  const loadQuestions = async () => {
    setIsLoading(true)
    const data = await getAllQuestions()
    setQuestions(data)
    setIsLoading(false)
  }

  const handleEdit = (question) => {
    setEditingId(question.id)
    setEditAnswer(question.answer || '')
    setEditStatus(question.status)
  }

  const handleSave = async (id) => {
    try {
      await updateQuestion(id, {
        answer: editAnswer,
        status: editStatus,
      })

      await loadQuestions()
      setEditingId(null)
      setEditAnswer('')
    } catch (error) {
      alert('保存失败：' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个问题吗？')) {
      return
    }

    try {
      await deleteQuestion(id)
      await loadQuestions()
    } catch (error) {
      alert('删除失败：' + error.message)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditAnswer('')
  }

  const filteredQuestions = questions.filter((q) => {
    if (filterStatus === 'all') return true
    return q.status === filterStatus
  })

  const pendingCount = questions.filter((q) => q.status === 'pending').length
  const answeredCount = questions.filter((q) => q.status === 'answered').length

  if (!isAuthenticated) {
    return (
      <main className="qa-admin-page">
        <div className="qa-admin-auth-notice card">
          <h2>需要管理员权限</h2>
          <p>请先登录以访问 Q&A 管理界面。</p>
        </div>
      </main>
    )
  }

  return (
    <main className="qa-admin-page">
      <section className="section">
        <div className="qa-admin-header">
          <h1>Q&A 管理</h1>
          <div className="qa-admin-stats">
            <span className="qa-stat qa-stat-pending">待回答: {pendingCount}</span>
            <span className="qa-stat qa-stat-answered">已回答: {answeredCount}</span>
            <span className="qa-stat">总计: {questions.length}</span>
          </div>
        </div>

        <div className="qa-admin-filters">
          <button
            type="button"
            className={`qa-filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            全部
          </button>
          <button
            type="button"
            className={`qa-filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            待回答
          </button>
          <button
            type="button"
            className={`qa-filter-btn ${filterStatus === 'answered' ? 'active' : ''}`}
            onClick={() => setFilterStatus('answered')}
          >
            已回答
          </button>
          <button
            type="button"
            className={`qa-filter-btn ${filterStatus === 'hidden' ? 'active' : ''}`}
            onClick={() => setFilterStatus('hidden')}
          >
            已隐藏
          </button>
        </div>

        {isLoading ? (
          <div className="qa-loading">加载中...</div>
        ) : filteredQuestions.length > 0 ? (
          <div className="qa-admin-list">
            {filteredQuestions.map((question) => (
              <article key={question.id} className="qa-admin-item card">
                <div className="qa-admin-item-header">
                  <div className="qa-admin-item-meta">
                    <span className={`qa-status-badge qa-status-${question.status}`}>
                      {question.status === 'pending' && '待回答'}
                      {question.status === 'answered' && '已回答'}
                      {question.status === 'hidden' && '已隐藏'}
                    </span>
                    <span className="qa-admin-date">
                      {new Date(question.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  {editingId !== question.id && (
                    <div className="qa-admin-actions">
                      <button
                        type="button"
                        className="qa-admin-btn qa-admin-btn-edit"
                        onClick={() => handleEdit(question)}
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        className="qa-admin-btn qa-admin-btn-delete"
                        onClick={() => handleDelete(question.id)}
                      >
                        删除
                      </button>
                    </div>
                  )}
                </div>

                <div className="qa-admin-question">
                  <strong>问题：</strong>
                  <p>{question.question}</p>
                  {question.author_name && (
                    <span className="qa-admin-author">来自 {question.author_name}</span>
                  )}
                </div>

                {editingId === question.id ? (
                  <div className="qa-admin-edit-form">
                    <div className="qa-form-field">
                      <label>回答内容</label>
                      <textarea
                        value={editAnswer}
                        onChange={(e) => setEditAnswer(e.target.value)}
                        rows={6}
                        placeholder="输入回答..."
                      />
                    </div>

                    <div className="qa-form-field">
                      <label>状态</label>
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                        <option value="pending">待回答</option>
                        <option value="answered">已回答</option>
                        <option value="hidden">隐藏</option>
                      </select>
                    </div>

                    <div className="qa-admin-edit-actions">
                      <button
                        type="button"
                        className="btn primary"
                        onClick={() => handleSave(question.id)}
                      >
                        保存
                      </button>
                      <button type="button" className="btn secondary" onClick={handleCancel}>
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  question.answer && (
                    <div className="qa-admin-answer">
                      <strong>回答：</strong>
                      <p>{question.answer}</p>
                    </div>
                  )
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="qa-empty card">
            <p>暂无{filterStatus !== 'all' ? '相关' : ''}问题</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default QAAdminPage
