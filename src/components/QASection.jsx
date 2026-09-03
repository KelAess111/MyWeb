import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAnsweredQuestions, submitQuestion } from '../services/qaService'

const isEditMode = import.meta.env.VITE_EDIT_MODE === 'true'

function QASection() {
  const [questions, setQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    setIsLoading(true)
    const data = await getAnsweredQuestions()
    setQuestions(data)
    setIsLoading(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!newQuestion.trim()) {
      setSubmitError('请输入问题内容')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      await submitQuestion({
        question: newQuestion,
        author_name: authorName || '匿名',
      })

      setSubmitSuccess(true)
      setNewQuestion('')
      setAuthorName('')

      setTimeout(() => {
        setShowForm(false)
        setSubmitSuccess(false)
      }, 2000)
    } catch (error) {
      setSubmitError(error.message || '提交失败，请稍后再试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="section qa-section" id="qa">
      <div className="section-heading">
        <span className="section-kicker">Q&A</span>
        <h2>问答时间</h2>
        <p>有什么想了解的？欢迎提问，我会在这里回答。</p>
        {isEditMode && (
          <Link to="/qa-admin" className="qa-admin-link">
            管理问答
          </Link>
        )}
      </div>

      <div className="qa-content">
        {isLoading ? (
          <div className="qa-loading">加载中...</div>
        ) : questions.length > 0 ? (
          <div className="qa-list">
            {questions.map((qa) => (
              <article key={qa.id} className="qa-item card">
                <div className="qa-question">
                  <span className="qa-icon">Q</span>
                  <p>{qa.question}</p>
                </div>
                {qa.answer && (
                  <div className="qa-answer">
                    <span className="qa-icon">A</span>
                    <p>{qa.answer}</p>
                  </div>
                )}
                <div className="qa-meta">
                  {qa.author_name && (
                    <span className="qa-author">来自 {qa.author_name}</span>
                  )}
                  {qa.answered_at && (
                    <span className="qa-date">
                      {new Date(qa.answered_at).toLocaleDateString('zh-CN')}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="qa-empty card">
            <p>暂无问答内容，成为第一个提问的人吧！</p>
          </div>
        )}

        <div className="qa-submit-section">
          {!showForm ? (
            <button
              type="button"
              className="btn secondary qa-submit-toggle"
              onClick={() => setShowForm(true)}
            >
              我也有问题
            </button>
          ) : (
            <form className="qa-submit-form card" onSubmit={handleSubmit}>
              <h3>提交问题</h3>

              <div className="qa-form-field">
                <label htmlFor="author-name">称呼（可选）</label>
                <input
                  id="author-name"
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="匿名"
                  maxLength={50}
                  disabled={isSubmitting}
                />
              </div>

              <div className="qa-form-field">
                <label htmlFor="question">问题内容 *</label>
                <textarea
                  id="question"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="输入你想问的问题..."
                  rows={4}
                  maxLength={500}
                  required
                  disabled={isSubmitting}
                />
                <span className="qa-char-count">{newQuestion.length}/500</span>
              </div>

              {submitError && <p className="qa-error">{submitError}</p>}

              {submitSuccess && (
                <p className="qa-success">提交成功！我会尽快回答你的问题。</p>
              )}

              <div className="qa-form-actions">
                <button
                  type="submit"
                  className="btn primary"
                  disabled={isSubmitting || !newQuestion.trim()}
                >
                  {isSubmitting ? '提交中...' : '提交问题'}
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    setShowForm(false)
                    setSubmitError('')
                    setNewQuestion('')
                    setAuthorName('')
                  }}
                  disabled={isSubmitting}
                >
                  取消
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

export default QASection
