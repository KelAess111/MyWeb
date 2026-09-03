import { useEffect, useRef, useState } from 'react'
import { Gallery, Item } from 'react-photoswipe-gallery'
import 'photoswipe/dist/photoswipe.css'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { publicGalleryData } from '../data/publicGalleryData'
import { useImageLoadState } from '../hooks/useImageLoadState'

function readImageSize(src) {
  return new Promise((resolve, reject) => {
    const loader = new Image()
    const cleanup = () => {
      loader.onload = null
      loader.onerror = null
    }

    loader.onload = () => {
      if (loader.naturalWidth && loader.naturalHeight) {
        cleanup()
        resolve({ width: loader.naturalWidth, height: loader.naturalHeight })
      } else {
        cleanup()
        reject(new Error('Image has no readable dimensions'))
      }
    }
    loader.onerror = () => {
      cleanup()
      reject(new Error('Image failed to load'))
    }
    loader.src = src
  })
}

function GalleryCover({ entry }) {
  const { status, handleError, handleLoad } = useImageLoadState(entry.cover)

  return (
    <div className={`public-gallery-album-cover public-gallery-album-cover--${status}`}>
      {entry.cover ? (
        <img
          src={entry.cover}
          alt={`${entry.year} 图册封面`}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          draggable="false"
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : null}
      {status === 'loading' ? <span className="public-gallery-image-status" aria-live="polite">封面加载中…</span> : null}
      {status === 'error' || status === 'empty' ? <span className="public-gallery-image-status">封面暂不可用</span> : null}
    </div>
  )
}

function GalleryTileImage({ image, onImageLoad, onImageError }) {
  const { status, handleError, handleLoad } = useImageLoadState(image.src)

  const handleLoadImage = (event) => {
    handleLoad(event)
    onImageLoad(event)
  }

  const handleErrorImage = (event) => {
    handleError(event)
    onImageError()
  }

  return (
    <>
      <img
        src={image.src}
        alt={image.alt}
        onLoad={handleLoadImage}
        onError={handleErrorImage}
        loading="lazy"
        decoding="async"
        draggable="false"
      />
      {status === 'loading' ? <span className="public-gallery-image-status" aria-live="polite">图片加载中…</span> : null}
      {status === 'error' || status === 'empty' ? <span className="public-gallery-image-status">图片暂不可用</span> : null}
    </>
  )
}

function PublicGalleryAlbumPage() {
  const { year } = useParams()
  const navigate = useNavigate()
  const lastOpenAtRef = useRef(0)
  const openAttemptRef = useRef(0)
  const failedImagesRef = useRef(new Set())
  const [imageSizes, setImageSizes] = useState({})
  const [failedImages, setFailedImages] = useState(() => new Set())
  const entry = publicGalleryData.find((item) => item.year === year)

  useEffect(() => {
    failedImagesRef.current = failedImages
  }, [failedImages])

  useEffect(() => () => {
    openAttemptRef.current += 1
  }, [year])

  const saveImageSize = (image, size) => {
    setImageSizes((current) => {
      const previous = current[image.src]
      if (previous?.width === size.width && previous?.height === size.height) {
        return current
      }

      return {
        ...current,
        [image.src]: size,
      }
    })
  }

  const handleImageLoad = (image) => (event) => {
    const { naturalWidth, naturalHeight } = event.currentTarget
    if (!naturalWidth || !naturalHeight) {
      return
    }

    saveImageSize(image, { width: naturalWidth, height: naturalHeight })
  }

  const markImageFailed = (src) => {
    openAttemptRef.current += 1
    failedImagesRef.current = new Set([...failedImagesRef.current, src])
    setFailedImages(failedImagesRef.current)
  }

  const handleOpen = (image, open) => async (event) => {
    event.preventDefault()

    const now = typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now()
    if (now - lastOpenAtRef.current < 220 || failedImagesRef.current.has(image.src)) {
      return
    }

    lastOpenAtRef.current = now
    const attempt = openAttemptRef.current + 1
    openAttemptRef.current = attempt

    if (!imageSizes[image.src]) {
      try {
        const size = await readImageSize(image.src)
        if (openAttemptRef.current !== attempt || failedImagesRef.current.has(image.src)) {
          return
        }
        saveImageSize(image, size)
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            if (openAttemptRef.current === attempt && !failedImagesRef.current.has(image.src)) open(event)
          })
        })
        return
      } catch {
        markImageFailed(image.src)
        return
      }
    }

    open(event)
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/works/painting')
  }

  if (!entry) {
    return (
      <main className="public-gallery-page public-gallery-album-page">
        <section className="public-gallery-shell" aria-labelledby="public-gallery-album-title">
          <header className="public-gallery-heading">
            <div>
              <span className="section-kicker">Works / 审美积累</span>
              <h1 id="public-gallery-album-title">图册未找到</h1>
              <p>这个年份暂时没有对应的图册入口，先返回时间轴查看其他年份。</p>
            </div>
            <Link to="/works/painting" className="public-gallery-back-link">
              <span aria-hidden="true">←</span> 返回时间轴
            </Link>
          </header>
          <div className="public-gallery-empty-state">
            <strong>没有匹配到 {year ?? '未知年份'}</strong>
            <p>该图册可能还没有创建，或者链接已经失效。</p>
          </div>
        </section>
      </main>
    )
  }

  const hasImages = entry.images.length > 0

  return (
    <main className="public-gallery-page public-gallery-album-page">
      <section className="public-gallery-shell" aria-labelledby="public-gallery-album-title">
        <header className="public-gallery-heading">
          <div>
            <span className="section-kicker">Works / 审美积累</span>
            <h1 id="public-gallery-album-title">{entry.title}</h1>
            <p>{entry.summary}</p>
          </div>
          <div className="public-gallery-album-actions">
            <button type="button" className="public-gallery-back-link" onClick={handleBack}>
              <span aria-hidden="true">←</span> 返回上一页
            </button>
            <Link to="/works/painting" className="public-gallery-back-link">
              <span aria-hidden="true">←</span> 返回时间轴
            </Link>
          </div>
        </header>

        <GalleryCover entry={entry} />

        <div className="public-gallery-album-heading">
          <span className="public-gallery-period">Album / {entry.year}</span>
          <h2>{entry.title}</h2>
          <p className="public-gallery-note">{entry.note}</p>
        </div>

        {hasImages ? (
          <Gallery options={{ imageClickAction: 'zoom', doubleTapAction: 'zoom' }}>
            <div className="public-gallery-album-grid" aria-label={`${entry.year} 图册图片列表`}>
              {entry.images.map((image, index) => {
                const size = imageSizes[image.src]
                return (
                  <Item
                    key={image.src}
                    original={image.src}
                    thumbnail={image.src}
                    width={size?.width ?? 1200}
                    height={size?.height ?? 1600}
                    alt={image.alt}
                  >
                    {({ ref, open }) => (
                      <button
                        type="button"
                        ref={ref}
                        onClick={handleOpen(image, open)}
                        onDoubleClick={(event) => event.preventDefault()}
                        className={`public-gallery-album-tile ${failedImages.has(image.src) ? 'is-error' : ''}`}
                        aria-label={`查看图片 ${index + 1}: ${image.alt}`}
                        aria-disabled={failedImages.has(image.src)}
                        disabled={failedImages.has(image.src)}
                      >
                        <GalleryTileImage image={image} onImageLoad={handleImageLoad(image)} onImageError={() => markImageFailed(image.src)} />
                      </button>
                    )}
                  </Item>
                )
              })}
            </div>
          </Gallery>
        ) : (
          <div className="public-gallery-empty-state">
            <strong>{entry.year} 还没有正文图片</strong>
            <p>当前只保留了封面和时间节点，后续补图后这里会自动展开。</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default PublicGalleryAlbumPage
