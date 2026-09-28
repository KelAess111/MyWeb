import { useState, useEffect } from 'react'
import useEditMode from '../hooks/useEditMode'

function GamePlanSection() {
  const [gamePlans, setGamePlans] = useState([])
  const canEdit = useEditMode()
  const [notice, setNotice] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    conceptImage: '',
    description: '',
    recruiting: '', status: 'planning', progress: ''
  })

  // 从 localStorage 加载数据
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}content/game-plans.json`, { signal: controller.signal, cache: 'no-store' })
      .then(response => { if (!response.ok) throw new Error(); return response.json() })
      .then(plans => { if (!Array.isArray(plans)) throw new Error(); setGamePlans(plans) })
      .catch(error => { if (error.name !== 'AbortError') setNotice('游戏规划暂时无法加载，请刷新重试。') })
    return () => controller.abort()
  }, [])

  // 保存到 localStorage
  const saveToStorage = async (plans) => {
    if (!canEdit || isSaving) return false
    setIsSaving(true)
    try {
      const response = await fetch('/api/local-game-plans', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plans) })
      if (!response.ok) throw new Error()
      setGamePlans(plans)
      setNotice('已保存到本地网站文件，下次发布时会一起展示。')
      return true
    } catch {
      setNotice('保存失败，请确认正在本地开发预览中编辑，然后重试。')
      return false
    } finally { setIsSaving(false) }
  }

  const importLegacyPlans = async () => {
    try {
      const stored = JSON.parse(localStorage.getItem('gamePlans') || '[]')
      if (!Array.isArray(stored) || !stored.length) { setNotice('这个浏览器中没有旧的游戏规划。'); return }
      const existingIds = new Set(gamePlans.map(plan => String(plan.id)))
      await saveToStorage([...gamePlans, ...stored.filter(plan => plan && plan.name && !existingIds.has(String(plan.id)))])
    } catch { setNotice('旧数据无法读取，原数据没有被修改。') }
  }

  const handleAdd = () => {
    setIsEditing(true)
    setEditingId(null)
    setFormData({
      name: '',
      conceptImage: '',
      description: '',
      recruiting: '', status: 'planning', progress: ''
    })
  }

  const handleEdit = (plan) => {
    setIsEditing(true)
    setEditingId(plan.id)
    setFormData(plan)
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个游戏规划吗？')) return

    const updated = gamePlans.filter(p => p.id !== id)
    await saveToStorage(updated)
  }

  const handleSubmit = async (e) => {
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

    if (!await saveToStorage(updated)) return
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
                    <img src={plan.conceptImage} alt={plan.name} loading="lazy" />
                  </div>
                )}
                <div className="game-plan-body">
                  <h3 className="game-plan-title">{plan.name}</h3>
                  <span className="plan-status">{{ planning: '企划中', development: '开发中', completed: '已完成' }[plan.status] || '企划中'}</span>
                  {plan.progress && <p className="plan-progress"><strong>最近进展</strong>{plan.progress}</p>}
                  {plan.description && (
                    <p className="game-plan-description">{plan.description}</p>
                  )}
                  {plan.recruiting && (
                    <div className="game-plan-recruiting">
                      <span className="recruiting-label">招募中：</span>
                      <p>{plan.recruiting}</p>
                    </div>
                  )}
                  {canEdit && (
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
                        disabled={isSaving}
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

        {notice && <p role="status">{notice}</p>}
        {canEdit && <button className="btn secondary" disabled={isSaving} onClick={importLegacyPlans}>导入此浏览器的旧规划</button>}
        {canEdit && !isEditing && (
          <button className="btn primary game-plan-add-btn" onClick={handleAdd}>
            + 添加游戏规划
          </button>
        )}

        {canEdit && isEditing && (
          <div className="game-plan-form-overlay">
            <form className="game-plan-form card" onSubmit={handleSubmit}>
              <h3>{editingId ? '编辑游戏规划' : '添加游戏规划'}</h3>
              <div className="form-field"><label htmlFor="plan-status">项目状态</label><select id="plan-status" value={formData.status || 'planning'} onChange={e => setFormData({ ...formData, status: e.target.value })}><option value="planning">企划中</option><option value="development">开发中</option><option value="completed">已完成</option></select></div>
              <div className="form-field"><label htmlFor="plan-progress">最近进展</label><textarea id="plan-progress" rows={2} value={formData.progress || ''} onChange={e => setFormData({ ...formData, progress: e.target.value })} placeholder="记录刚刚完成的小进展…" /></div>

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
                <button type="submit" className="btn primary" disabled={isSaving}>
                  {isSaving ? '保存中…' : editingId ? '保存修改' : '添加'}
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
