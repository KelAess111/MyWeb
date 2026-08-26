import { useEffect, useRef, useState } from 'react'
import { Gallery, Item } from 'react-photoswipe-gallery'
import 'photoswipe/dist/photoswipe.css'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { publicGalleryData } from '../data/publicGalleryData'

function PublicGalleryAlbumPage() {
  const { year } = useParams()
  const navigate = useNavigate()
  const lastOpenAtRef = useRef(0)
  const [imageSizes, setImageSizes] = useState({})
  const entry = publicGalleryData.find((item) => item.year === year)

  useEffect(() => {
    if (!entry?.images.length) {
      return undefined
    }

    let isMounted = true
    const loaders = entry.images.map((image) => {
      const loader = new Image()
      loader.onload = () => {
        if (isMounted && loader.naturalWidth && loader.naturalHeight) {
          setImageSizes((current) => ({
            ...current,
            [image.src]: {
              width: loader.naturalWidth,
              height: loader.naturalHeight,
            },
          }))
        }
      }
      loader.src = image.src
      return loader
    })

    return () => {
      isMounted = false
      loaders.forEach((loader) => {
        loader.onload = null
      })
    }
  }, [entry])

  const handleImageLoad = (image) => (event) => {
    const { naturalWidth, naturalHeight } = event.currentTarget
    if (!naturalWidth || !naturalHeight) {
      return
    }

    setImageSizes((current) => {
      const previous = current[image.src]
      if (previous?.width === naturalWidth && previous?.height === naturalHeight) {
        return current
      }

      return {
        ...current,
        [image.src]: { width: naturalWidth, height: naturalHeight },
      }
    })
  }

  const handleOpen = (open) => (event) => {
    event.preventDefault()

    const now = typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now()
    if (now - lastOpenAtRef.current < 220) {
      return
    }

    lastOpenAtRef.current = now
    open()
  }

  if (!entry) {
    return (
      <main className="public-gallery-page public-gallery-album-page">
        <section className="public-gallery-shell" aria-labelledby="public-gallery-album-title">
          <header className="public-gallery-heading">
            <div>
              <span className="section-kicker">Works / 美图分享</span>
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
            <span className="section-kicker">Works / 美图分享</span>
            <h1 id="public-gallery-album-title">{entry.title}</h1>
            <p>{entry.summary}</p>
          </div>
          <div className="public-gallery-album-actions">
            <button type="button" className="public-gallery-back-link" onClick={() => navigate(-1)}>
              <span aria-hidden="true">←</span> 返回上一页
            </button>
            <Link to="/works/painting" className="public-gallery-back-link">
              <span aria-hidden="true">←</span> 返回时间轴
            </Link>
          </div>
        </header>

        <div className="public-gallery-album-cover">
          <img src={entry.cover} alt={`${entry.year} 图册封面`} loading="lazy" decoding="async" draggable="false" />
        </div>

        <div className="public-gallery-album-heading">
          <span className="public-gallery-period">Album / {entry.year}</span>
          <h2>{entry.title}</h2>
          <p className="public-gallery-note">{entry.note}</p>
        </div>

        {hasImages ? (
          <Gallery options={{ imageClickAction: 'zoom', doubleTapAction: 'zoom' }}>
            <div className="public-gallery-album-grid" aria-label={`${entry.year} 图册图片列表`}>
              {entry.images.map((image, index) => (
                <Item
                  key={image.src}
                  original={image.src}
                  thumbnail={image.src}
                  width={imageSizes[image.src]?.width}
                  height={imageSizes[image.src]?.height}
                  alt={image.alt}
                >
                  {({ ref, open }) => {
                    const size = imageSizes[image.src]
                    return (
                      <button
                        type="button"
                        ref={ref}
                        onClick={handleOpen(open)}
                        onDoubleClick={(event) => event.preventDefault()}
                        className="public-gallery-album-tile"
                        aria-label={`查看图片 ${index + 1}: ${image.alt}`}
                      >
                        <img
                          src={image.src}
                          alt={image.alt}
                          onLoad={handleImageLoad(image)}
                          loading="lazy"
                          decoding="async"
                          draggable="false"
                        />
                      </button>
                    )
                  }}
                </Item>
              ))}
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
