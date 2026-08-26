import { useEffect, useMemo, useRef, useState } from 'react'

const HOTSPOT_ROTATION_INTERVAL = 10000
const HOTSPOT_ORDER = ['1', '2', '3', '4']
const HOTSPOT_COLLATOR = typeof Intl !== 'undefined'
  ? new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' })
  : null

const hotspotAssetModules = import.meta.glob('../assets/hot/*/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

function compareNatural(left, right) {
  if (HOTSPOT_COLLATOR) {
    return HOTSPOT_COLLATOR.compare(left, right)
  }

  return left.localeCompare(right)
}

function getBaseName(path) {
  const fileName = path.split('/').pop() ?? ''
  return fileName.replace(/\.[^.]+$/, '')
}

function getFolderId(path) {
  const match = path.match(/\/hot\/(\d+)\//)
  return match?.[1] ?? null
}

function getFolderAssets(folderId) {
  return Object.entries(hotspotAssetModules)
    .filter(([path]) => getFolderId(path) === folderId)
    .map(([path, src]) => ({
      path,
      src,
      name: getBaseName(path),
    }))
    .filter((asset) => asset.name && asset.name !== 'surface')
    .sort((left, right) => compareNatural(left.name, right.name))
}

const HOTSPOT_CONFIGS = {
  1: {
    title: '美图分享板块完工',
    summary: '第一块热点位先放慢速淡入，留给最醒目的分享内容。',
    kicker: '热点 01',
    textBackClass: 'hotspot-carousel-copy--compact',
    delayMs: 0,
  },
  2: {
    title: '热点图集持续更新',
    summary: '第二块继续用淡入轮播，节奏和上一块错开。',
    kicker: '热点 02',
    textBackClass: 'hotspot-carousel-copy--compact',
    delayMs: 2400,
  },
  3: {
    title: '横向滑动预览',
    summary: '第三块采用横向滑动，白色底块留得更高一些。',
    kicker: '热点 03',
    textBackClass: 'hotspot-carousel-copy--wide',
    delayMs: 4800,
  },
  4: {
    title: '纵向滑动预览',
    summary: '第四块采用纵向滑动，保持中等高度的白色底块。',
    kicker: '热点 04',
    textBackClass: 'hotspot-carousel-copy--mid',
    delayMs: 7200,
  },
}

function HotspotCarousel({ folderId, variant = 'fade' }) {
  const config = HOTSPOT_CONFIGS[folderId] ?? HOTSPOT_CONFIGS[1]
  const images = useMemo(() => getFolderAssets(folderId), [folderId])
  const [activeIndex, setActiveIndex] = useState(0)
  const [transitioningFrom, setTransitioningFrom] = useState(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const activeIndexRef = useRef(0)
  const timerRef = useRef(null)
  const transitionTimerRef = useRef(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(mediaQuery.matches)

    updateMotion()
    mediaQuery.addEventListener?.('change', updateMotion)

    return () => {
      mediaQuery.removeEventListener?.('change', updateMotion)
    }
  }, [])

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (reducedMotion || images.length <= 1) {
      return undefined
    }

    const startTimer = window.setTimeout(() => {
      timerRef.current = window.setInterval(() => {
        setActiveIndex((current) => {
          const nextIndex = (current + 1) % images.length
          setTransitioningFrom(current)
          if (transitionTimerRef.current) {
            window.clearTimeout(transitionTimerRef.current)
          }
          transitionTimerRef.current = window.setTimeout(() => {
            setTransitioningFrom(null)
            transitionTimerRef.current = null
          }, 1250)
          return nextIndex
        })
      }, HOTSPOT_ROTATION_INTERVAL)
    }, config.delayMs)

    return () => {
      window.clearTimeout(startTimer)
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
      }
    }
  }, [config.delayMs, images.length, reducedMotion])

  useEffect(() => () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
    }
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (activeIndex >= images.length) {
      setActiveIndex(0)
    }
  }, [activeIndex, images.length])

  const totalLabel = images.length ? `${String(images.length).padStart(2, '0')} 张` : '暂无图片'
  const visibleImages = images.length ? images : [{ src: '', name: 'placeholder', path: '' }]

  return (
    <div
      className={`hotspot-carousel hotspot-carousel--${variant} ${reducedMotion ? 'is-reduced-motion' : ''} ${images.length ? 'has-images' : 'is-empty'}`}
      role="group"
      aria-roledescription="carousel"
      aria-label={`${config.title}，${totalLabel}`}
    >
      <div className="hotspot-carousel-media">
        {visibleImages.map((image, index) => {
          const isActive = index === activeIndex || (!images.length && index === 0)
          return (
            <img
              key={`${folderId}-${image.path || image.name || index}`}
              className={`hotspot-carousel-image ${isActive ? 'is-active' : ''} ${index === transitioningFrom ? 'is-exiting' : ''}`}
              src={image.src}
              alt={images.length ? `${config.title} ${index + 1}` : ''}
              aria-hidden={images.length ? 'false' : 'true'}
              draggable="false"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          )
        })}
        <div className="hotspot-carousel-overlay" aria-hidden="true" />
      </div>

      <div className={`hotspot-carousel-copy ${config.textBackClass}`}>
        <p className="hotspot-carousel-kicker">{config.kicker}</p>
        <h3>{config.title}</h3>
        <p>{config.summary}</p>
        <p className="hotspot-carousel-count">{images.length ? `来自文件夹 ${folderId} · ${images.length} 张` : `文件夹 ${folderId} 暂时还没有图片`}</p>
      </div>
    </div>
  )
}

export { HOTSPOT_ORDER }
export default HotspotCarousel
