import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getUserCards, savePracticeSession, addToWrongCards, discardCard } from '../services/ankiService'
import { Toast } from '../components/Toast'

// 50题缓冲区管理
class BufferQueue {
  constructor(capacity = 50) {
    this.capacity = capacity
    this.queue = []
  }

  add(cardId) {
    if (this.queue.includes(cardId)) return
    this.queue.push(cardId)
    if (this.queue.length > this.capacity) {
      this.queue.shift()
    }
  }

  includes(cardId) {
    return this.queue.includes(cardId)
  }

  clear() {
    this.queue = []
  }
}

function AnkiPracticePage() {
  const { language } = useParams()
  const [cards, setCards] = useState([])
  const [buffer] = useState(new BufferQueue(50))
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [options, setOptions] = useState([])
  const [isStarted, setIsStarted] = useState(false)
  const [stats, setStats] = useState({
    correct: 0,
    wrong: 0,
    combo: 0,
    maxCombo: 0,
  })
  const [feverMode, setFeverMode] = useState('normal') // 'normal', 'fever', 'superfever'
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    loadCards()
  }, [language])

  const loadCards = async () => {
    try {
      const data = await getUserCards(language)
      setCards(data)
    } catch (error) {
      console.error('加载卡片失败:', error)
      setToast({ message: '加载卡片失败：' + error.message, type: 'error' })
    }
  }

  const getAvailableCards = () => {
    // 词库小于100时，不使用缓冲区
    if (cards.length < 100) {
      return cards
    }
    return cards.filter(card => !buffer.includes(card.id))
  }

  const getRandomCard = (excludeId = null) => {
    const availableCards = getAvailableCards()
    if (availableCards.length === 0) return null

    const filtered = excludeId
      ? availableCards.filter(card => card.id !== excludeId)
      : availableCards

    if (filtered.length === 0) return availableCards[0]

    return filtered[Math.floor(Math.random() * filtered.length)]
  }

  const startPractice = () => {
    if (cards.length < 2) {
      setToast({ message: '卡片数量不足，至少需要2张卡片才能开始练习', type: 'warning' })
      return
    }
    buffer.clear()
    setStats({ correct: 0, wrong: 0, combo: 0, maxCombo: 0 })
    setFeverMode('normal')
    setIsStarted(true)
    nextQuestion()
  }

  const nextQuestion = () => {
    const questionCard = getRandomCard()
    if (!questionCard) {
      setToast({ message: '没有可用的卡片了', type: 'warning' })
      return
    }

    const distractorCard = getRandomCard(questionCard.id)
    if (!distractorCard) {
      setToast({ message: '没有足够的卡片生成干扰项', type: 'warning' })
      return
    }

    const shuffledOptions = [questionCard, distractorCard].sort(() => Math.random() - 0.5)

    // 为日语卡片随机选择出题形式（假名或汉字）
    const questionCardWithForm = { ...questionCard }
    if (language === 'japanese' && questionCard.kanji_form) {
      // 如果有汉字形式，50%概率用汉字出题，50%用假名
      const useKanji = Math.random() < 0.5
      if (useKanji) {
        questionCardWithForm.displayText = questionCard.kanji_form
        questionCardWithForm.isKanjiForm = true
      } else {
        questionCardWithForm.displayText = questionCard.original_text
        questionCardWithForm.isKanjiForm = false
      }
    } else {
      // 没有汉字或非日语，使用original_text
      questionCardWithForm.displayText = questionCard.original_text
      questionCardWithForm.isKanjiForm = false
    }

    setCurrentQuestion(questionCardWithForm)
    setOptions(shuffledOptions)
    setShowResult(false)
    setSelectedOption(null)
  }

  const [selectedOption, setSelectedOption] = useState(null)

  const handleAnswer = async (selectedCard) => {
    const correct = selectedCard.id === currentQuestion.id

    setIsCorrect(correct)
    setSelectedOption(selectedCard)
    setShowResult(true)

    let newStats = { ...stats }

    if (correct) {
      newStats.correct++
      newStats.combo++
      newStats.maxCombo = Math.max(newStats.maxCombo, newStats.combo)

      // 答对：题目卡和干扰项都进入缓冲区
      buffer.add(currentQuestion.id)
      const distractor = options.find(opt => opt.id !== currentQuestion.id)
      if (distractor) {
        buffer.add(distractor.id)
      }

      // Fever模式切换
      if (newStats.combo >= 30) {
        setFeverMode('superfever')
      } else if (newStats.combo >= 10) {
        setFeverMode('fever')
      }
    } else {
      newStats.wrong++
      newStats.combo = 0
      setFeverMode('normal')

      // 答错：只有干扰项进入缓冲区，题目卡加入错题本
      const distractor = options.find(opt => opt.id !== currentQuestion.id)
      if (distractor) {
        buffer.add(distractor.id)
      }

      try {
        await addToWrongCards(currentQuestion.id, language)
      } catch (error) {
        console.error('添加到错题本失败:', error)
      }
    }

    setStats(newStats)

    // 答对和答错都显示正确答案，等待用户确认
    // 不再自动跳转
  }

  const handleDiscard = async () => {
    try {
      await discardCard(currentQuestion.id)
      setToast({ message: '卡片已弃置', type: 'success' })
      // 从当前卡片列表中移除
      setCards(cards.filter(card => card.id !== currentQuestion.id))
      nextQuestion()
    } catch (error) {
      console.error('弃置卡片失败:', error)
      setToast({ message: '弃置卡片失败：' + error.message, type: 'error' })
    }
  }

  const stopPractice = async () => {
    try {
      await savePracticeSession({
        language,
        correctCount: stats.correct,
        wrongCount: stats.wrong,
        maxCombo: stats.maxCombo,
      })
      setShowSummary(true)
    } catch (error) {
      console.error('保存练习记录失败:', error)
      setShowSummary(true)
    }
  }

  if (cards.length === 0) {
    return (
      <main className="anki-practice-page">
        <div className="anki-practice-container">
          <div className="anki-practice-empty">
            <h2>暂无卡片</h2>
            <p>请先添加卡片再开始练习</p>
            <Link to="/utilities/anki/manage" className="anki-practice-btn">
              前往管理词库
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={`anki-practice-page anki-practice-page--${feverMode}`}>
      <div className="anki-practice-container">
        {!isStarted ? (
          <div className="anki-practice-start">
            <h1 className="anki-practice-title">
              {language === 'japanese' ? '🇯🇵 日语练习' : '🇬🇧 英语练习'}
            </h1>
            <p className="anki-practice-card-count">共 {cards.length} 张卡片</p>
            <button
              type="button"
              className="anki-practice-btn anki-practice-btn--large"
              onClick={startPractice}
            >
              开始练习
            </button>
            <Link to="/utilities/anki" className="anki-practice-back">
              返回
            </Link>
          </div>
        ) : showSummary ? (
          <div className="anki-practice-summary">
            <h2 className="anki-summary-title">练习结束</h2>
            <div className="anki-summary-stats">
              <div className="anki-summary-stat">
                <div className="anki-summary-stat-label">正确</div>
                <div className="anki-summary-stat-value anki-summary-stat-value--correct">{stats.correct}</div>
              </div>
              <div className="anki-summary-stat">
                <div className="anki-summary-stat-label">错误</div>
                <div className="anki-summary-stat-value anki-summary-stat-value--wrong">{stats.wrong}</div>
              </div>
              <div className="anki-summary-stat">
                <div className="anki-summary-stat-label">最高连击</div>
                <div className="anki-summary-stat-value anki-summary-stat-value--combo">{stats.maxCombo}</div>
              </div>
              <div className="anki-summary-stat">
                <div className="anki-summary-stat-label">正确率</div>
                <div className="anki-summary-stat-value">
                  {stats.correct + stats.wrong > 0
                    ? Math.round((stats.correct / (stats.correct + stats.wrong)) * 100)
                    : 0}%
                </div>
              </div>
            </div>
            <div className="anki-summary-actions">
              <button
                type="button"
                className="anki-practice-btn"
                onClick={() => {
                  setShowSummary(false)
                  setIsStarted(false)
                  setCurrentQuestion(null)
                }}
              >
                返回
              </button>
              <button
                type="button"
                className="anki-practice-btn"
                onClick={() => {
                  setShowSummary(false)
                  startPractice()
                }}
              >
                再来一次
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="anki-practice-stats">
              <div className="anki-stat-item anki-stat-item--correct">
                <span className="anki-stat-label">正确</span>
                <span className="anki-stat-value">{stats.correct}</span>
              </div>
              <div className="anki-stat-item anki-stat-item--wrong">
                <span className="anki-stat-label">错误</span>
                <span className="anki-stat-value">{stats.wrong}</span>
              </div>
              <div className={`anki-stat-item anki-stat-item--combo anki-stat-item--${feverMode}`}>
                <span className="anki-stat-label">
                  {feverMode === 'superfever' ? '🔥 SUPER FEVER!' : feverMode === 'fever' ? '✨ FEVER!' : 'Combo'}
                </span>
                <span className="anki-stat-value">{stats.combo}</span>
              </div>
            </div>

            {currentQuestion && (
              <div className="anki-question-area">
                <div className="anki-question-card">
                  <div className="anki-question-label">请选择正确答案：</div>
                  <div className="anki-question-text">{currentQuestion.displayText || currentQuestion.original_text}</div>
                  {!currentQuestion.isKanjiForm && currentQuestion.pronunciation && (
                    <div className="anki-question-pronunciation">
                      [{currentQuestion.pronunciation}]
                    </div>
                  )}
                </div>

                <div className="anki-options-grid">
                  {options.map((option) => {
                    const isCorrectOption = option.id === currentQuestion.id
                    const isSelectedOption = showResult && selectedOption && option.id === selectedOption.id

                    // 选对了：只有正确答案显示绿色
                    // 选错了：只有错误答案显示红色
                    let optionClass = ''
                    if (showResult) {
                      if (isCorrect && isCorrectOption) {
                        optionClass = 'anki-option-card--correct'
                      } else if (!isCorrect && isSelectedOption) {
                        optionClass = 'anki-option-card--wrong'
                      }
                    }

                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={`anki-option-card ${optionClass}`}
                        onClick={() => !showResult && handleAnswer(option)}
                        disabled={showResult}
                      >
                        <div className="anki-option-translation">{option.translation}</div>
                        {option.part_of_speech && (
                          <div className="anki-option-pos">{option.part_of_speech}</div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {showResult && (
                  <div className={`anki-result-banner anki-result-banner--${isCorrect ? 'correct' : 'wrong'}`}>
                    {isCorrect ? '✓ 正确！' : '✗ 错误'}
                  </div>
                )}

                {showResult && (
                  <div className="anki-correct-answer">
                    <div className="anki-correct-answer-title">{isCorrect ? '答案详情：' : '正确答案：'}</div>
                    <div className="anki-correct-answer-card">
                      <div className="anki-correct-answer-original">{currentQuestion.original_text}</div>
                      {currentQuestion.pronunciation && (
                        <div className="anki-correct-answer-pronunciation">
                          [{currentQuestion.pronunciation}]
                        </div>
                      )}
                      {currentQuestion.kanji_form && (
                        <div className="anki-correct-answer-kanji">
                          汉字：{currentQuestion.kanji_form}
                        </div>
                      )}
                      {currentQuestion.part_of_speech && (
                        <div className="anki-correct-answer-pos">{currentQuestion.part_of_speech}</div>
                      )}
                      <div className="anki-correct-answer-translation">{currentQuestion.translation}</div>
                      {currentQuestion.special_note && (
                        <div className="anki-correct-answer-note">💡 {currentQuestion.special_note}</div>
                      )}
                    </div>
                    <div className="anki-answer-actions">
                      <button
                        type="button"
                        className="anki-practice-btn anki-practice-btn--continue"
                        onClick={() => nextQuestion()}
                      >
                        继续
                      </button>
                      {isCorrect && (
                        <button
                          type="button"
                          className="anki-practice-btn anki-practice-btn--discard"
                          onClick={handleDiscard}
                        >
                          已完全掌握，弃置此卡
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className="anki-practice-stop-btn"
              onClick={stopPractice}
            >
              结束练习
            </button>

            {feverMode === 'fever' && <div className="anki-fever-effect" />}
            {feverMode === 'superfever' && <div className="anki-superfever-effect" />}
          </>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  )
}

export default AnkiPracticePage
