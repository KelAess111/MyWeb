import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useImageLoadState } from '../hooks/useImageLoadState'

const HOTSPOT_ROTATION_INTERVAL = 10000
const HOTSPOT_MANUAL_RESUME_DELAY = 6500
const HOTSPOT_TRANSITION_DURATION = 1250
const HOTSPOT_SWIPE_THRESHOLD = 40
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
  return HOTSPOT_COLLATOR ? HOTSPOT_COLLATOR.compare(left, right) : left.localeCompare(right)
}

function getBaseName(path) {
  const fileName = path.split('/').pop() ?? ''
  return fileName.replace(/\.[^.]+$/, '')
}

function getFolderId(path) {
  return path.match(/\/hot\/(\d+)\//)?.[1] ?? null
}

function getFolderAssets(folderId) {
  return Object.entries(hotspotAssetModules)
    .filter(([path]) => getFolderId(path) === folderId)
    .map(([path, src]) => ({ path, src, name: getBaseName(path) }))
    .filter((asset) => asset.name && asset.name !== 'surface')
    .sort((left, right) => compareNatural(left.name, right.name))
}

const HOTSPOT_CONFIGS = {
  1: { title: '美图分享板块完工', summary: '第一块热点位先放慢速淡入，留给最醒目的分享内容。', kicker: '热点 01', textBackClass: 'hotspot-carousel-copy--compact', delayMs: 0 },
  2: { title: '热点图集持续更新', summary: '第二块继续用淡入轮播，节奏和上一块错开。', kicker: '热点 02', textBackClass: 'hotspot-carousel-copy--compact', delayMs: 2400 },
  3: { title: '横向滑动预览', summary: '第三块采用横向滑动，白色底块留得更高一些。', kicker: '热点 03', textBackClass: 'hotspot-carousel-copy--wide', delayMs: 4800 },
  4: { title: '纵向滑动预览', summary: '第四块采用纵向滑动，保持中等高度的白色底块。', kicker: '热点 04', textBackClass: 'hotspot-carousel-copy--mid', delayMs: 7200 },
}

function HotspotImage({ image, index, isActive, isExiting, eager, title }) {
  const { status, handleError, handleLoad } = useImageLoadState(image.src)
  return (
    <>
      <img
        className={`hotspot-carousel-image hotspot-carousel-image--${status}${isActive ? ' is-active' : ''}${isExiting ? ' is-exiting' : ''}`}
        src={image.src}
        alt={`${title} ${index + 1}`}
        aria-hidden={!isActive}
        draggable="false"
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
      />
      {isActive && (status === 'loading' || status === 'error') ? (
        <span className="hotspot-carousel-image-status" role="status">
          {status === 'loading' ? '图片加载中…' : '图片暂不可用'}
        </span>
      ) : null}
    </>
  )
}

function HotspotCarousel({ folderId, variant = 'fade' }) {
  const config = HOTSPOT_CONFIGS[folderId] ?? HOTSPOT_CONFIGS[1]
  const images = useMemo(() => getFolderAssets(folderId), [folderId])
  const [activeIndex, setActiveIndex] = useState(0)
  const [transition, setTransition] = useState(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const activeIndexRef = useRef(0)
  const autoplayTimerRef = useRef(null)
  const manualResumeTimerRef = useRef(null)
  const transitionTimerRef = useRef(null)
  const pointerRef = useRef(null)
  const suppressClickRef = useRef(false)
  const isHoveredRef = useRef(false)
  const navigateRef = useRef(null)
  const startAutoplayRef = useRef(null)

  const clearAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) {
      window.clearTimeout(autoplayTimerRef.current)
      autoplayTimerRef.current = null
    }
  }, [])

  const clearManualResume = useCallback(() => {
    if (manualResumeTimerRef.current) {
      window.clearTimeout(manualResumeTimerRef.current)
      manualResumeTimerRef.current = null
    }
  }, [])

  const startAutoplay = useCallback((delayMs) => {
    clearAutoplay()
    if (reducedMotion || images.length <= 1 || isHoveredRef.current) return
    autoplayTimerRef.current = window.setTimeout(() => {
      autoplayTimerRef.current = null
      if (reducedMotion || isHoveredRef.current) return
      navigateRef.current?.(1)
      startAutoplayRef.current?.(HOTSPOT_ROTATION_INTERVAL)
    }, delayMs)
  }, [clearAutoplay, images.length, reducedMotion])

  useEffect(() => {
    startAutoplayRef.current = startAutoplay
  }, [startAutoplay])

  const resumeAfterManualInput = useCallback(() => {
    clearManualResume()
    clearAutoplay()
    if (reducedMotion || images.length <= 1 || isHoveredRef.current) return
    manualResumeTimerRef.current = window.setTimeout(() => {
      manualResumeTimerRef.current = null
      startAutoplay(HOTSPOT_ROTATION_INTERVAL)
    }, HOTSPOT_MANUAL_RESUME_DELAY)
  }, [clearAutoplay, clearManualResume, images.length, reducedMotion, startAutoplay])

  const clearTransition = useCallback(() => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }
    setTransition(null)
  }, [])

  const navigate = useCallback((direction, { resetAutoplay = false } = {}) => {
    if (images.length <= 1) return
    const fromIndex = activeIndexRef.current
    const nextIndex = (fromIndex + direction + images.length) % images.length
    activeIndexRef.current = nextIndex
    clearTransition()
    if (!reducedMotion) {
      setTransition({ fromIndex, direction: direction > 0 ? 'next' : 'previous' })
      transitionTimerRef.current = window.setTimeout(() => {
        setTransition(null)
        transitionTimerRef.current = null
      }, HOTSPOT_TRANSITION_DURATION)
    }
    setActiveIndex(nextIndex)
    if (resetAutoplay) resumeAfterManualInput()
  }, [clearTransition, images.length, reducedMotion, resumeAfterManualInput])

  useEffect(() => {
    navigateRef.current = navigate
  }, [navigate])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(mediaQuery.matches)
    updateMotion()
    mediaQuery.addEventListener?.('change', updateMotion)
    return () => mediaQuery.removeEventListener?.('change', updateMotion)
  }, [])

  useEffect(() => {
    activeIndexRef.current = 0
    startAutoplay(config.delayMs)
    return () => {
      clearAutoplay()
      clearManualResume()
    }
  }, [clearAutoplay, clearManualResume, config.delayMs, images.length, startAutoplay])

  useEffect(() => () => {
    clearAutoplay()
    clearManualResume()
    clearTransition()
  }, [clearAutoplay, clearManualResume, clearTransition])

  const finishPointer = (event) => {
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId) return
    pointerRef.current = null
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    const distance = variant === 'slide-x' ? event.clientX - pointer.x : event.clientY - pointer.y
    if (Math.abs(distance) < HOTSPOT_SWIPE_THRESHOLD) return
    suppressClickRef.current = true
    navigate(distance < 0 ? 1 : -1, { resetAutoplay: true })
  }

  const handlePointerDown = (event) => {
    if (variant === 'fade' || images.length <= 1 || (event.pointerType === 'mouse' && event.button !== 0)) return
    pointerRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    if (variant === 'fade') navigate(1, { resetAutoplay: true })
  }

  const handleMouseEnter = () => {
    isHoveredRef.current = true
    clearAutoplay()
  }

  const handleMouseLeave = () => {
    isHoveredRef.current = false
    startAutoplay(HOTSPOT_ROTATION_INTERVAL)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      navigate(1, { resetAutoplay: true })
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      navigate(-1, { resetAutoplay: true })
    }
  }

  const totalLabel = images.length ? `${String(images.length).padStart(2, '0')} 张` : '暂无图片'
  return (
    <div
      className={`hotspot-carousel hotspot-carousel--${variant} ${transition ? `hotspot-carousel--${transition.direction}` : ''} ${reducedMotion ? 'is-reduced-motion' : ''} ${images.length ? 'has-images' : 'is-empty'}`}
      role="group"
      aria-roledescription="carousel"
      aria-label={`${config.title}，${totalLabel}`}
      tabIndex={images.length > 1 ? 0 : -1}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
    >
      <div className="hotspot-carousel-media">
        {images.length ? images.map((image, index) => (
          <HotspotImage
            key={`${folderId}-${image.path || image.name || index}`}
            image={image}
            index={index}
            isActive={index === activeIndex}
            isExiting={index === transition?.fromIndex}
            eager={index === 0}
            title={config.title}
          />
        )) : <div className="hotspot-carousel-image-placeholder" role="status">图片暂不可用</div>}
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
