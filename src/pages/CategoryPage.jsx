import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import AnnotationTerm from '../components/AnnotationTerm'
import { findWorkCategory, workCategories } from '../data/workCategories'

const annotationContent = {
  fragment: {
    label: '设定碎片',
    title: '设定碎片',
    category: 'lore',
    content: '指那些暂时还没形成完整世界观文档、但已经值得单独保留的角色背景、事件细节或象征物。',
  },
  process: {
    label: '开发记录',
    title: '开发记录',
    category: 'process',
    content: '它不只是日志，也包括失败尝试、思路转向、删改原因和阶段性总结。',
  },
  world: {
    label: '世界观草稿',
    title: '世界观草稿',
    category: 'world',
    content: '这是还没有彻底定稿的背景结构，允许前后期不断修正与补充。',
  },
}

function CategoryPage() {
  const { categoryId } = useParams()
  const category = findWorkCategory(categoryId)
  const [openAnnotationId, setOpenAnnotationId] = useState(null)

  useEffect(() => {
    setOpenAnnotationId(null)
  }, [categoryId])

  useEffect(() => {
    if (!openAnnotationId) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenAnnotationId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openAnnotationId])

  const annotationIds = useMemo(() => ({
    fragment: `${categoryId}-fragment`,
    process: `${categoryId}-process`,
    world: `${categoryId}-world`,
  }), [categoryId])

  if (!category) {
    return <Navigate to="/" replace />
  }

  return (
    <main>
      <section className={`section category-page accent-${category.accent}`}>
        <div className="section-heading category-page-heading">
          <span className="section-kicker">Works / {category.navLabel}</span>
          <h1 className="category-page-title">{category.title}</h1>
          <p>{category.intro}</p>
        </div>

        <div className="category-page-actions">
          <Link to="/#works" className="btn secondary">
            返回作品总览
          </Link>
        </div>

        <div className="work-category-panel">
          <p>
            这里会逐步收纳真正的项目、阶段记录与创作说明。像
            <AnnotationTerm
              id={annotationIds.fragment}
              isOpen={openAnnotationId === annotationIds.fragment}
              onOpen={() => setOpenAnnotationId(annotationIds.fragment)}
              onClose={() => setOpenAnnotationId(null)}
              {...annotationContent.fragment}
            />
            、
            <AnnotationTerm
              id={annotationIds.process}
              isOpen={openAnnotationId === annotationIds.process}
              onOpen={() => setOpenAnnotationId(annotationIds.process)}
              onClose={() => setOpenAnnotationId(null)}
              {...annotationContent.process}
            />
            与
            <AnnotationTerm
              id={annotationIds.world}
              isOpen={openAnnotationId === annotationIds.world}
              onOpen={() => setOpenAnnotationId(annotationIds.world)}
              onClose={() => setOpenAnnotationId(null)}
              {...annotationContent.world}
            />
            都会在这里出现，并被持续扩写。
          </p>

          <div className="category-placeholder-grid">
            <article className="category-placeholder-card">
              <h3>当前阶段</h3>
              <p>{category.summary}</p>
            </article>
            <article className="category-placeholder-card">
              <h3>后续可加入</h3>
              <p>项目卡片、注释模块、截图、片段、时间线与更具体的创作笔记。</p>
            </article>
          </div>
        </div>

        <div className="category-page-footer-nav">
          {workCategories.filter((item) => item.id !== category.id).map((item) => (
            <Link key={item.id} to={item.path} className={`card card-link accent-${item.accent}`}>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <span className="card-link-hint">查看这个分区 →</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

export default CategoryPage
