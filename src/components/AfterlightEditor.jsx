import { useMemo, useRef, useState } from 'react'
import {
  deleteJournalAttachment,
  uploadJournalAttachment,
} from '../services/afterlightEntries'
import { emptyAnnotation, emptyEntry } from '../utils/journalDrafts'


function normalizeAttachment(attachment, index = 0) {
  return {
    id: attachment?.id ?? `attachment-${index}`,
    kind: attachment?.kind ?? 'image',
    storagePath: attachment?.storagePath ?? '',
    thumbPath: attachment?.thumbPath ?? null,
    posterPath: attachment?.posterPath ?? null,
    originalName: attachment?.originalName ?? '',
    mimeType: attachment?.mimeType ?? '',
    sizeBytes: Number(attachment?.sizeBytes) || 0,
    width: Number(attachment?.width) || null,
    height: Number(attachment?.height) || null,
    durationSeconds: Number(attachment?.durationSeconds) || null,
    alt: attachment?.alt ?? '',
    caption: attachment?.caption ?? '',
    sortOrder: Number.isFinite(Number(attachment?.sortOrder)) ? Number(attachment.sortOrder) : index,
    createdAt: attachment?.createdAt ?? new Date().toISOString(),
    displayUrl: attachment?.displayUrl ?? null,
    thumbUrl: attachment?.thumbUrl ?? null,
    posterUrl: attachment?.posterUrl ?? null,
  }
}

function normalizeEntry(entry) {
  return {
    title: entry?.title ?? '',
    entryDate: entry?.entryDate ?? '',
    body: entry?.body ?? '',
    published: Boolean(entry?.published),
    annotations:
      Array.isArray(entry?.annotations) && entry.annotations.length
        ? entry.annotations.map((annotation, index) => ({
            id: annotation.id ?? `annotation-${index}`,
            term: annotation.term ?? '',
            occurrence: Number(annotation.occurrence) > 0 ? Number(annotation.occurrence) : 1,
            content: annotation.content ?? '',
          }))
        : [emptyAnnotation()],
    attachments: Array.isArray(entry?.attachments) ? entry.attachments.map(normalizeAttachment) : [],
  }
}

function formatFileSize(sizeBytes) {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return '未知大小'
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`
}

function UploadQueue({ items = [] }) {
  if (!items.length) {
    return null
  }

  return (
    <div className="afterlight-upload-queue">
      {items.map((item) => (
        <div key={item.localId} className={`afterlight-upload-card is-${item.status}`}>
          {item.previewUrl ? (
            item.kind === 'video' ? <video src={item.previewUrl} className="afterlight-upload-preview" muted playsInline /> : <img src={item.previewUrl} alt={item.fileName} className="afterlight-upload-preview" />
          ) : null}
          <div className="afterlight-upload-copy">
            <strong>{item.fileName}</strong>
            <span>
              {item.status === 'error'
                ? item.errorMessage || '上传失败'
                : item.status === 'processing'
                  ? '处理中…'
                  : item.status === 'uploading'
                    ? `上传中 ${item.progress ?? 0}%`
                    : item.status === 'queued'
                      ? '等待上传…'
                      : '已完成'}
            </span>
            {item.status === 'uploading' ? (
              <div className="afterlight-upload-progress" aria-hidden="true">
                <span style={{ width: `${item.progress ?? 0}%` }} />
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

function AttachmentList({ attachments, onChange, onDeleteAttachment, disabled }) {
  if (!attachments.length) {
    return <p className="afterlight-attachment-empty">还没有上传附件。可以先保存日志，再继续加图片或视频。</p>
  }

  return (
    <div className="afterlight-attachment-editor-list">
      {attachments.map((attachment, index) => {
        const previewUrl = attachment.kind === 'video' ? attachment.posterUrl ?? attachment.thumbUrl ?? attachment.displayUrl : attachment.thumbUrl ?? attachment.displayUrl

        return (
          <div key={attachment.id} className="afterlight-attachment-editor-card">
            <div className="afterlight-attachment-editor-preview-shell">
              {previewUrl ? (
                attachment.kind === 'video' ? <video src={previewUrl} className="afterlight-attachment-editor-preview" muted playsInline /> : <img src={previewUrl} alt={attachment.alt || attachment.originalName} className="afterlight-attachment-editor-preview" />
              ) : (
                <div className="afterlight-attachment-fallback">暂无预览</div>
              )}
              {attachment.kind === 'video' ? <span className="afterlight-attachment-chip">视频</span> : <span className="afterlight-attachment-chip">图片</span>}
            </div>

            <div className="afterlight-attachment-editor-copy">
              <p className="afterlight-attachment-name">{attachment.originalName || `附件 ${index + 1}`}</p>
              <p className="afterlight-attachment-meta">{formatFileSize(attachment.sizeBytes)}</p>

              <label className="afterlight-field">
                <span>替代文本</span>
                <input
                  type="text"
                  value={attachment.alt}
                  onChange={(event) => onChange(attachment.id, { alt: event.target.value })}
                  placeholder="这张图 / 这个视频大概是什么"
                  disabled={disabled}
                />
              </label>

              <label className="afterlight-field">
                <span>说明文字（可选）</span>
                <textarea
                  rows={2}
                  value={attachment.caption}
                  onChange={(event) => onChange(attachment.id, { caption: event.target.value })}
                  placeholder="给这个附件加一点补充说明"
                  disabled={disabled}
                />
              </label>

              <div className="afterlight-attachment-actions">
                <button type="button" className="btn secondary danger" onClick={() => onDeleteAttachment(attachment)} disabled={disabled}>
                  删除附件
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AfterlightEditor({
  entry,
  entryId = null,
  onChange,
  onSubmit,
  onDelete,
  onCancel,
  submitLabel,
  isSaving = false,
  canDelete = false,
}) {
  const draft = useMemo(() => (entry ? normalizeEntry(entry) : emptyEntry), [entry])
  const uploadInputRef = useRef(null)
  const [pendingUploads, setPendingUploads] = useState([])
  const [attachmentError, setAttachmentError] = useState('')

  const updateDraftWith = (updater) => {
    onChange((currentEntry) => updater(normalizeEntry(currentEntry)))
  }

  const updateDraft = (patch) => {
    updateDraftWith((currentDraft) => ({
      ...currentDraft,
      ...patch,
    }))
  }

  const updateAnnotation = (annotationId, patch) => {
    updateDraftWith((currentDraft) => ({
      ...currentDraft,
      annotations: currentDraft.annotations.map((annotation) =>
        annotation.id === annotationId
          ? {
              ...annotation,
              ...patch,
            }
          : annotation,
      ),
    }))
  }

  const updateAttachment = (attachmentId, patch) => {
    updateDraftWith((currentDraft) => ({
      ...currentDraft,
      attachments: currentDraft.attachments.map((attachment, index) =>
        attachment.id === attachmentId
          ? {
              ...attachment,
              ...patch,
              sortOrder: index,
            }
          : attachment,
      ),
    }))
  }

  const handleAddAnnotation = () => {
    updateDraftWith((currentDraft) => ({
      ...currentDraft,
      annotations: [...currentDraft.annotations, emptyAnnotation()],
    }))
  }

  const handleRemoveAnnotation = (annotationId) => {
    updateDraftWith((currentDraft) => {
      const nextAnnotations = currentDraft.annotations.filter((annotation) => annotation.id !== annotationId)

      return {
        ...currentDraft,
        annotations: nextAnnotations.length ? nextAnnotations : [emptyAnnotation()],
      }
    })
  }

  const handleAttachmentSelection = async (event) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (!files.length) {
      return
    }

    if (!entryId) {
      setAttachmentError('请先保存这条日志，拿到日志 ID 后才能继续上传图片或视频。')
      return
    }

    setAttachmentError('')

    const queued = files.map((file) => ({
      localId: crypto.randomUUID(),
      fileName: file.name,
      kind: file.type.startsWith('video/') ? 'video' : 'image',
      status: 'queued',
      progress: 0,
      errorMessage: null,
      previewUrl: URL.createObjectURL(file),
    }))

    setPendingUploads((current) => [...current, ...queued])

    for (const [index, file] of files.entries()) {
      const queueItem = queued[index]
      setPendingUploads((current) => current.map((item) => (item.localId === queueItem.localId ? { ...item, status: 'uploading', progress: 5 } : item)))

      try {
        const uploadedAttachment = await uploadJournalAttachment(entryId, file, (progress) => {
          setPendingUploads((current) => current.map((item) => (item.localId === queueItem.localId ? { ...item, status: 'uploading', progress: Math.max(progress, item.progress ?? 0) } : item)))
        })

        setPendingUploads((current) => current.map((item) => (item.localId === queueItem.localId ? { ...item, status: 'processing', progress: 100 } : item)))

        updateDraftWith((currentDraft) => ({
          ...currentDraft,
          attachments: [
            ...currentDraft.attachments,
            {
              ...uploadedAttachment,
              sortOrder: currentDraft.attachments.length,
            },
          ],
        }))

        setPendingUploads((current) => current.filter((item) => item.localId !== queueItem.localId))
      } catch {
        setPendingUploads((current) => current.map((item) => (item.localId === queueItem.localId ? { ...item, status: 'error', progress: 0, errorMessage: '上传失败，请检查 bucket、RLS 和登录状态。' } : item)))
      }
    }
  }

  const handleDeleteAttachment = async (attachment) => {
    setAttachmentError('')

    try {
      await deleteJournalAttachment(attachment)
      updateDraftWith((currentDraft) => ({
        ...currentDraft,
        attachments: currentDraft.attachments
          .filter((item) => item.id !== attachment.id)
          .map((item, index) => ({
            ...item,
            sortOrder: index,
          })),
      }))
    } catch {
      setAttachmentError('删除附件失败。请确认当前作者会话仍然有效。')
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit({
      ...draft,
      title: draft.title.trim(),
      body: draft.body.trim(),
      annotations: draft.annotations
        .map((annotation) => ({
          ...annotation,
          term: annotation.term.trim(),
          content: annotation.content.trim(),
          occurrence: Number(annotation.occurrence) > 0 ? Number(annotation.occurrence) : 1,
        }))
        .filter((annotation) => annotation.term && annotation.content),
      attachments: draft.attachments.map((attachment, index) => ({
        ...attachment,
        alt: attachment.alt.trim(),
        caption: attachment.caption.trim(),
        sortOrder: index,
      })),
    })
  }

  return (
    <form className="afterlight-editor" onSubmit={handleSubmit}>
      <div className="afterlight-editor-grid">
        <label className="afterlight-field">
          <span>标题（可选）</span>
          <input type="text" value={draft.title} onChange={(event) => updateDraft({ title: event.target.value })} placeholder="例如：某天晚上之后" />
        </label>

        <label className="afterlight-field">
          <span>日期</span>
          <input type="date" value={draft.entryDate} onChange={(event) => updateDraft({ entryDate: event.target.value })} required />
        </label>
      </div>

      <label className="afterlight-field">
        <span>日志正文</span>
        <textarea
          value={draft.body}
          onChange={(event) => updateDraft({ body: event.target.value })}
          placeholder="把事情本身写下来。需要吐槽的词，稍后在下面添加注释即可。"
          rows={8}
          required
        />
      </label>

      <div className="afterlight-field afterlight-annotation-fieldset">
        <div className="afterlight-annotation-header">
          <div>
            <span>吐槽 / 旁注</span>
            <p>填写正文里要变成可点击注释的词，以及对应吐槽内容。</p>
          </div>
          <button type="button" className="btn secondary" onClick={handleAddAnnotation}>
            新增注释
          </button>
        </div>

        <div className="afterlight-annotation-list">
          {draft.annotations.map((annotation, index) => (
            <div key={annotation.id} className="afterlight-annotation-card">
              <div className="afterlight-editor-grid">
                <label className="afterlight-field">
                  <span>词 / 短语</span>
                  <input
                    type="text"
                    value={annotation.term}
                    onChange={(event) => updateAnnotation(annotation.id, { term: event.target.value })}
                    placeholder="正文里会被替换成注释按钮的词"
                  />
                </label>

                <label className="afterlight-field">
                  <span>第几次出现</span>
                  <input
                    type="number"
                    min="1"
                    value={annotation.occurrence}
                    onChange={(event) => updateAnnotation(annotation.id, { occurrence: event.target.value })}
                  />
                </label>
              </div>

              <label className="afterlight-field">
                <span>吐槽内容</span>
                <textarea
                  value={annotation.content}
                  onChange={(event) => updateAnnotation(annotation.id, { content: event.target.value })}
                  rows={3}
                  placeholder={`给注释 #${index + 1} 填一点更私人、更想吐槽的内容`}
                />
              </label>

              <div className="afterlight-annotation-actions">
                <button type="button" className="btn secondary" onClick={() => handleRemoveAnnotation(annotation.id)}>
                  删除这条注释
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="afterlight-field afterlight-annotation-fieldset">
        <div className="afterlight-annotation-header">
          <div>
            <span>媒体附件</span>
            <p>支持图片和视频。新建日志要先保存一次拿到日志 ID；上传、删除或修改附件后，也要再保存一次日志，附件变更才会真正写回这篇记录。</p>
          </div>
          <label className="btn secondary afterlight-upload-trigger">
            选择图片 / 视频
            <input ref={uploadInputRef} type="file" accept="image/*,video/*" multiple onChange={handleAttachmentSelection} hidden />
          </label>
        </div>

        {attachmentError ? <p className="afterlight-status-message is-error">{attachmentError}</p> : null}
        <UploadQueue items={pendingUploads} />
        <AttachmentList attachments={draft.attachments} onChange={updateAttachment} onDeleteAttachment={handleDeleteAttachment} disabled={isSaving} />
      </div>

      <label className="afterlight-publish-toggle">
        <input
          type="checkbox"
          checked={draft.published}
          onChange={(event) => updateDraft({ published: event.target.checked })}
        />
        <span>保存后立即公开给访客</span>
      </label>

      <div className="category-page-actions afterlight-editor-actions">
        <button type="submit" className="btn secondary" disabled={isSaving}>
          {isSaving ? '保存中…' : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" className="btn secondary" onClick={onCancel} disabled={isSaving}>
            取消编辑
          </button>
        ) : null}
        {canDelete ? (
          <button type="button" className="btn secondary danger" onClick={onDelete} disabled={isSaving}>
            删除这篇日志
          </button>
        ) : null}
      </div>
    </form>
  )
}

export default AfterlightEditor
