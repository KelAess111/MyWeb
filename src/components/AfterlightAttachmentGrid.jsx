import { Gallery, Item } from 'react-photoswipe-gallery'
import 'photoswipe/dist/photoswipe.css'

function formatDuration(durationSeconds) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return null
  }

  const totalSeconds = Math.round(durationSeconds)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function getVisibleAttachments(attachments = []) {
  return attachments.slice(0, 9)
}

function getGridClassName(length) {
  if (length <= 1) {
    return 'is-single'
  }

  if (length === 2) {
    return 'is-double'
  }

  if (length === 4) {
    return 'is-quad'
  }

  return 'is-grid'
}

function AttachmentTile({ attachment, index, hiddenCount }) {
  const previewUrl = attachment.kind === 'video' ? attachment.posterUrl ?? attachment.thumbUrl ?? attachment.displayUrl : attachment.thumbUrl ?? attachment.displayUrl
  const fullUrl = attachment.displayUrl ?? previewUrl
  const durationLabel = formatDuration(attachment.durationSeconds)
  const title = attachment.caption || attachment.alt || attachment.originalName || `附件 ${index + 1}`

  return (
    <Item
      original={fullUrl}
      thumbnail={previewUrl}
      width={attachment.width ?? 1600}
      height={attachment.height ?? 900}
      alt={attachment.alt || title}
      content={
        attachment.kind === 'video' ? (
          <div className="afterlight-lightbox-video-shell">
            <video controls playsInline poster={attachment.posterUrl ?? attachment.thumbUrl ?? undefined} className="afterlight-lightbox-video">
              <source src={attachment.displayUrl ?? fullUrl} type={attachment.mimeType || 'video/mp4'} />
            </video>
            {attachment.caption ? <p className="afterlight-lightbox-caption">{attachment.caption}</p> : null}
          </div>
        ) : undefined
      }
    >
      {({ ref, open }) => (
        <button
          type="button"
          className={`afterlight-attachment-tile ${attachment.kind === 'video' ? 'is-video' : 'is-image'}`}
          ref={ref}
          onClick={open}
          aria-label={`查看${attachment.kind === 'video' ? '视频' : '图片'}：${title}`}
        >
          {previewUrl ? (
            <img src={previewUrl} alt={attachment.alt || title} className="afterlight-attachment-media" loading="lazy" />
          ) : (
            <span className="afterlight-attachment-fallback">附件预览暂不可用</span>
          )}
          {attachment.kind === 'video' ? (
            <span className="afterlight-video-overlay" aria-hidden="true">
              <span className="afterlight-video-play">▶</span>
              {durationLabel ? <span className="afterlight-video-duration">{durationLabel}</span> : null}
            </span>
          ) : null}
          {hiddenCount > 0 ? <span className="afterlight-attachment-more">+{hiddenCount}</span> : null}
        </button>
      )}
    </Item>
  )
}

function AfterlightAttachmentGrid({ attachments = [] }) {
  if (!attachments.length) {
    return null
  }

  const visibleAttachments = getVisibleAttachments(attachments)
  const hiddenCount = Math.max(0, attachments.length - visibleAttachments.length)

  return (
    <Gallery>
      <div className={`afterlight-attachment-grid ${getGridClassName(visibleAttachments.length)}`}>
        {visibleAttachments.map((attachment, index) => (
          <AttachmentTile
            key={attachment.id}
            attachment={attachment}
            index={index}
            hiddenCount={index === visibleAttachments.length - 1 ? hiddenCount : 0}
          />
        ))}
      </div>
    </Gallery>
  )
}

export default AfterlightAttachmentGrid
