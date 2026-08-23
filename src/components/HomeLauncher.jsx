import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const launcherItems = [
  {
    id: 'interests',
    label: '个人兴趣',
    eyebrow: 'Interests',
    description: '浏览游戏、绘画、音乐等兴趣分区。',
    path: '/interests',
  },
  {
    id: 'profile',
    label: '关于我',
    eyebrow: 'Profile',
    description: '查看个人介绍与联系方式。',
    path: '/profile#intro',
  },
  {
    id: 'blog',
    label: '博客日志',
    eyebrow: 'Blog',
    description: '阅读公开写作与记录。',
    path: '/journal',
  },
  {
    id: 'portfolio',
    label: '个人作品集',
    eyebrow: 'Portfolio',
    description: '进入未来的独立作品展示入口。',
    path: '/portfolio',
  },
  {
    id: 'share',
    label: '分享',
    eyebrow: 'Share',
    description: '分享这个网站或复制当前页面链接。',
    path: '/share',
  },
]

function HomeLauncher({ isVisible = true }) {
  const navigate = useNavigate()
  const [activeIndex, setActiveIndex] = useState(0)

  const visibleItems = useMemo(() => {
    const itemCount = launcherItems.length
    const maxDistance = Math.floor(itemCount / 2)

    return launcherItems.map((item, index) => {
      const clockwiseDistance = (index - activeIndex + itemCount) % itemCount
      const distance = clockwiseDistance > maxDistance
        ? clockwiseDistance - itemCount
        : clockwiseDistance
      const slot = distance === 0
        ? 'center'
        : distance < 0
          ? `upper-${Math.abs(distance)}`
          : `lower-${distance}`

      return {
        ...item,
        slot,
        hidden: Math.abs(distance) > maxDistance,
        index,
      }
    })
  }, [activeIndex])

  const rotateLauncher = (direction) => {
    setActiveIndex((current) => (current + direction + launcherItems.length) % launcherItems.length)
  }

  const handleWheel = (event) => {
    if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) {
      return
    }

    if (event.cancelable && event.currentTarget.contains(event.target)) {
      event.preventDefault()
    }

    rotateLauncher(event.deltaY > 0 ? 1 : -1)
  }

  const handleItemDoubleClick = (path) => {
    navigate(path)
  }

  const handleItemKeyDown = (event, index, path) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (index === activeIndex) {
        navigate(path)
        return
      }

      setActiveIndex(index)
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault()
      rotateLauncher(-1)
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault()
      rotateLauncher(1)
    }
  }

  return (
    <section className={`home-launcher ${isVisible ? 'home-launcher--visible' : 'home-launcher--hidden'}`} aria-label="首页功能跳转">
      <div className="home-launcher-stage" onWheel={handleWheel} tabIndex={0} aria-live="polite">
        <div className="home-launcher-arc" aria-hidden="true" />
        <div className="home-launcher-band" aria-hidden="true">
          {visibleItems.map((item) => (
            <span
              key={`${item.id}-band`}
              className={`home-launcher-band-slot home-launcher-band-slot--${item.slot}${item.hidden ? ' is-hidden' : ''}`}
            />
          ))}
        </div>

        <div className="home-launcher-items">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.index === activeIndex
                ? 'home-launcher-item home-launcher-item--center is-active'
                : `home-launcher-item home-launcher-item--${item.slot}`}
              aria-pressed={item.index === activeIndex}
              onClick={() => setActiveIndex(item.index)}
              onDoubleClick={() => handleItemDoubleClick(item.path)}
              onKeyDown={(event) => handleItemKeyDown(event, item.index, item.path)}
            >
              {item.index === activeIndex && <span className="home-launcher-item-eyebrow">当前选择 · {item.eyebrow}</span>}
              {item.index !== activeIndex && <span className="home-launcher-item-eyebrow">{item.eyebrow}</span>}
              <span className="home-launcher-item-label">{item.label}</span>
              <span className="home-launcher-item-desc">{item.description}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HomeLauncher


