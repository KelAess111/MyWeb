import { useState, useEffect } from 'react'

const isEditMode = import.meta.env.VITE_EDIT_MODE === 'true'

function GamePlanSection() {
  const [gamePlans, setGamePlans] = useState([])
  const isPreviewMode = window.sessionStorage.getItem('previewMode') === 'true'
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    conceptImage: '',
    description: '',
    recruiting: ''
  })

  // 从 localStorage 加载数据
  useEffect(() => {
    const stored = localStorage.getItem('gamePlans')
    if (stored) {
      try {
        setGamePlans(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse game plans:', e)
      }
    }
  }, [])

  // 保存到 localStorage
  const saveToStorage = (plans) => {
    localStorage.setItem('gamePlans', JSON.stringify(plans))
  }

  const handleAdd = () => {
    setIsEditing(true)
    setEditingId(null)
    setFormData({
      name: '',
      conceptImage: '',
      description: '',
      recruiting: ''
    })
  }

  const handleEdit = (plan) => {
    setIsEditing(true)
    setEditingId(plan.id)
    setFormData(plan)
  }

  const handleDelete = (id) => {
    if (!confirm('确定要删除这个游戏规划吗？')) return

    const updated = gamePlans.filter(p => p.id !== id)
    setGamePlans(updated)
    saveToStorage(updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('请输入游戏名称')
      return
    }

    let updated
    if (editingId) {
      // 编辑现有
      updated = gamePlans.map(p =>
        p.id === editingId ? { ...formData, id: editingId } : p
      )
    } else {
      // 添加新的
      const newPlan = {
        ...formData,
        id: Date.now(),
        createdAt: new Date().toISOString()
      }
      updated = [...gamePlans, newPlan]
    }

    setGamePlans(updated)
    saveToStorage(updated)
    setIsEditing(false)
    setEditingId(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditingId(null)
  }

  return (
    <section className="section game-plan-section" id="game-plan">
      <div className="section-heading">
        <span className="section-kicker">Game Plan</span>
        <h2>游戏规划</h2>
        <p>正在企划和开发中的游戏项目</p>
      </div>

      <div className="game-plan-content">
        {gamePlans.length > 0 ? (
          <div className="game-plan-grid">
            {gamePlans.map((plan) => (
              <article key={plan.id} className="game-plan-card card">
                {plan.conceptImage && (
                  <div className="game-plan-image">
                    <img src={plan.conceptImage} alt={plan.name} />
                  </div>
                )}
                <div className="game-plan-body">
                  <h3 className="game-plan-title">{plan.name}</h3>
                  {plan.description && (
                    <p className="game-plan-description">{plan.description}</p>
                  )}
                  {plan.recruiting && (
                    <div className="game-plan-recruiting">
                      <span className="recruiting-label">招募中：</span>
                      <p>{plan.recruiting}</p>
                    </div>
                  )}
                  {isEditMode && (
                    <div className="game-plan-actions">
                      <button
                        className="btn-icon"
                        onClick={() => handleEdit(plan)}
                        aria-label="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDelete(plan.id)}
                        aria-label="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="game-plan-empty card">
            <p>暂无游戏规划，敬请期待！</p>
          </div>
        )}

        {isEditMode && !isPreviewMode && !isEditing && (
          <button className="btn primary game-plan-add-btn" onClick={handleAdd}>
            + 添加游戏规划
          </button>
        )}

        {isEditing && (
          <div className="game-plan-form-overlay">
            <form className="game-plan-form card" onSubmit={handleSubmit}>
              <h3>{editingId ? '编辑游戏规划' : '添加游戏规划'}</h3>

              <div className="form-field">
                <label htmlFor="game-name">游戏名称 *</label>
                <input
                  id="game-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="例如：群峦"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="game-image">概念图 URL</label>
                <input
                  id="game-image"
                  type="url"
                  value={formData.conceptImage}
                  onChange={(e) => setFormData({...formData, conceptImage: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              <div className="form-field">
                <label htmlFor="game-desc">游戏简介</label>
                <textarea
                  id="game-desc"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="简要描述游戏的核心玩法、故事背景等..."
                  rows={4}
                />
              </div>

              <div className="form-field">
                <label htmlFor="game-recruiting">招募需求</label>
                <textarea
                  id="game-recruiting"
                  value={formData.recruiting}
                  onChange={(e) => setFormData({...formData, recruiting: e.target.value})}
                  placeholder="需要什么样的队友？程序、美术、音乐..."
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn primary">
                  {editingId ? '保存修改' : '添加'}
                </button>
                <button type="button" className="btn secondary" onClick={handleCancel}>
                  取消
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}

export default GamePlanSection
