import { AFTERLIGHT_SIGNED_URL_EXPIRES_IN, AFTERLIGHT_STORAGE_BUCKETS, isSupabaseConfigured, supabase } from '../lib/supabase'

const TABLE_NAME = 'afterlight_entries'
const IMAGE_BUCKET = AFTERLIGHT_STORAGE_BUCKETS.images
const VIDEO_BUCKET = AFTERLIGHT_STORAGE_BUCKETS.videos
const SIGNED_URL_EXPIRES_IN = AFTERLIGHT_SIGNED_URL_EXPIRES_IN

function ensureSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('missing-supabase-config')
  }

  return supabase
}

function inferAttachmentKind(mimeType = '') {
  if (mimeType.startsWith('video/')) {
    return 'video'
  }

  return 'image'
}

function normalizeAttachment(attachment, index = 0) {
  const kind = attachment?.kind ?? inferAttachmentKind(attachment?.mimeType)

  return {
    id: attachment?.id ?? `attachment-${index}`,
    kind,
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
    id: entry.id,
    title: entry.title ?? '',
    entryDate: entry.entry_date,
    body: entry.body ?? '',
    annotations: Array.isArray(entry.annotations) ? entry.annotations : [],
    attachments: Array.isArray(entry.attachments) ? entry.attachments.map(normalizeAttachment) : [],
    published: Boolean(entry.published),
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
    authorId: entry.author_id ?? null,
  }
}

function toDatabasePayload(entry, authorId) {
  return {
    title: entry.title?.trim() || null,
    entry_date: entry.entryDate,
    body: entry.body.trim(),
    annotations: Array.isArray(entry.annotations) ? entry.annotations : [],
    attachments: Array.isArray(entry.attachments)
      ? entry.attachments.map((attachment, index) => ({
          id: attachment.id,
          kind: attachment.kind,
          storagePath: attachment.storagePath,
          thumbPath: attachment.thumbPath ?? null,
          posterPath: attachment.posterPath ?? null,
          originalName: attachment.originalName ?? '',
          mimeType: attachment.mimeType ?? '',
          sizeBytes: attachment.sizeBytes ?? 0,
          width: attachment.width ?? null,
          height: attachment.height ?? null,
          durationSeconds: attachment.durationSeconds ?? null,
          alt: attachment.alt ?? '',
          caption: attachment.caption ?? '',
          sortOrder: Number.isFinite(Number(attachment.sortOrder)) ? Number(attachment.sortOrder) : index,
          createdAt: attachment.createdAt ?? new Date().toISOString(),
        }))
      : [],
    published: Boolean(entry.published),
    ...(authorId ? { author_id: authorId } : {}),
  }
}

async function createSignedUrl(bucket, path) {
  const client = ensureSupabase()

  if (!path) {
    return null
  }

  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, SIGNED_URL_EXPIRES_IN)

  if (error) {
    throw error
  }

  return data?.signedUrl ?? null
}

async function resolveAttachmentUrls(attachment) {
  const normalized = normalizeAttachment(attachment)
  const bucket = normalized.kind === 'video' ? VIDEO_BUCKET : IMAGE_BUCKET

  const [displayUrl, thumbUrl, posterUrl] = await Promise.all([
    normalized.storagePath ? createSignedUrl(bucket, normalized.storagePath) : Promise.resolve(null),
    normalized.thumbPath ? createSignedUrl(bucket, normalized.thumbPath) : Promise.resolve(null),
    normalized.posterPath ? createSignedUrl(bucket, normalized.posterPath) : Promise.resolve(null),
  ])

  return {
    ...normalized,
    displayUrl,
    thumbUrl,
    posterUrl,
  }
}

async function resolveEntryUrls(entry) {
  const normalized = normalizeEntry(entry)
  const attachments = await Promise.all((normalized.attachments ?? []).map(resolveAttachmentUrls))

  return {
    ...normalized,
    attachments,
  }
}

async function listEntries(queryBuilder) {
  const { data, error } = await queryBuilder

  if (error) {
    throw error
  }

  return Promise.all((data ?? []).map(resolveEntryUrls))
}

export async function listPublishedJournalEntries() {
  const client = ensureSupabase()
  return listEntries(
    client
      .from(TABLE_NAME)
      .select('*')
      .eq('published', true)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false }),
  )
}

export async function listEditableJournalEntries() {
  const client = ensureSupabase()
  return listEntries(
    client
      .from(TABLE_NAME)
      .select('*')
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false }),
  )
}

export async function createJournalEntry(entry) {
  const client = ensureSupabase()
  const authorId = await getRequiredAuthorId(client)
  const payload = toDatabasePayload(entry, authorId)
  const { data, error } = await client.from(TABLE_NAME).insert(payload).select().single()

  if (error) {
    throw error
  }

  return resolveEntryUrls(data)
}

export async function updateJournalEntry(id, entry) {
  const client = ensureSupabase()
  const authorId = await getRequiredAuthorId(client)
  const payload = toDatabasePayload(entry, authorId)
  const { data, error } = await client.from(TABLE_NAME).update(payload).eq('id', id).select().single()

  if (error) {
    throw error
  }

  return resolveEntryUrls(data)
}

export async function deleteJournalEntry(id) {
  const client = ensureSupabase()
  const { error } = await client.from(TABLE_NAME).delete().eq('id', id)

  if (error) {
    throw error
  }
}

export async function getCurrentAuthorSession() {
  const client = ensureSupabase()
  const { data, error } = await client.auth.getSession()

  if (error) {
    throw error
  }

  return data.session
}

async function getRequiredAuthorId(client) {
  const { data, error } = await client.auth.getUser()

  if (error) {
    throw error
  }

  const authorId = data.user?.id

  if (!authorId) {
    throw new Error('missing-author-session')
  }

  return authorId
}

function fileExtensionFromName(name = '', fallbackMimeType = '') {
  const extension = name.split('.').pop()?.toLowerCase()

  if (extension && extension !== name.toLowerCase()) {
    return extension
  }

  if (fallbackMimeType === 'image/jpeg') {
    return 'jpg'
  }

  if (fallbackMimeType === 'image/png') {
    return 'png'
  }

  if (fallbackMimeType === 'image/webp') {
    return 'webp'
  }

  if (fallbackMimeType === 'video/mp4') {
    return 'mp4'
  }

  return 'bin'
}

function createImagePreview(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = reject
    image.src = url
  })
}

function createVideoPreview(url) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'

    const cleanup = () => {
      video.pause()
      video.removeAttribute('src')
      video.load()
    }

    video.onloadedmetadata = async () => {
      try {
        const captureTime = Math.min(0.2, Math.max(video.duration / 3, 0.05))
        video.currentTime = Number.isFinite(captureTime) ? captureTime : 0
      } catch (error) {
        cleanup()
        reject(error)
      }
    }

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const context = canvas.getContext('2d')
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          cleanup()
          if (!blob) {
            reject(new Error('poster-generation-failed'))
            return
          }

          resolve({
            width: video.videoWidth,
            height: video.videoHeight,
            durationSeconds: Number.isFinite(video.duration) ? video.duration : null,
            posterBlob: blob,
          })
        }, 'image/jpeg', 0.92)
      } catch (error) {
        cleanup()
        reject(error)
      }
    }

    video.onerror = () => {
      cleanup()
      reject(new Error('video-metadata-failed'))
    }

    video.src = url
  })
}

function createThumbnailBlob(file, kind) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)

    const finish = (result) => {
      URL.revokeObjectURL(objectUrl)
      resolve(result)
    }

    const fail = (error) => {
      URL.revokeObjectURL(objectUrl)
      reject(error)
    }

    if (kind === 'image') {
      createImagePreview(objectUrl)
        .then(({ width, height }) => finish({ width, height, durationSeconds: null, posterBlob: null }))
        .catch(fail)
      return
    }

    createVideoPreview(objectUrl)
      .then(finish)
      .catch(fail)
  })
}

async function uploadFileToBucket(bucket, path, file, mimeType, onProgress) {
  const client = ensureSupabase()
  const uploadResult = client.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: mimeType,
    ...(onProgress ? { duplex: 'half' } : {}),
  })

  if (onProgress && uploadResult?.progress) {
    uploadResult.progress((event) => {
      const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 0
      onProgress(progress)
    })
  }

  const { error } = await uploadResult

  if (error) {
    throw error
  }
}

export function getJournalAttachmentBucket(kind) {
  return kind === 'video' ? VIDEO_BUCKET : IMAGE_BUCKET
}

export function getJournalAttachmentPath(attachment) {
  const normalized = normalizeAttachment(attachment)
  return normalized.storagePath
}

export async function uploadJournalAttachment(entryId, file, onProgress) {
  const client = ensureSupabase()
  await getRequiredAuthorId(client)

  if (!entryId) {
    throw new Error('missing-entry-id')
  }

  const attachmentId = crypto.randomUUID()
  const kind = inferAttachmentKind(file.type)
  const bucket = kind === 'video' ? VIDEO_BUCKET : IMAGE_BUCKET
  const fileExtension = fileExtensionFromName(file.name, file.type)
  const basePath = `afterlight/${entryId}/${kind}s/${attachmentId}`
  const storagePath = `${basePath}.${fileExtension}`

  const preview = await createThumbnailBlob(file, kind)
  await uploadFileToBucket(bucket, storagePath, file, file.type || 'application/octet-stream', onProgress)

  let posterPath = null
  let thumbPath = null

  if (kind === 'video' && preview.posterBlob) {
    posterPath = `afterlight/${entryId}/videos/posters/${attachmentId}.jpg`
    thumbPath = `afterlight/${entryId}/videos/thumbs/${attachmentId}.jpg`
    await uploadFileToBucket(bucket, posterPath, preview.posterBlob, 'image/jpeg')
    await uploadFileToBucket(bucket, thumbPath, preview.posterBlob, 'image/jpeg')
  }

  const resolvedAttachment = await resolveAttachmentUrls({
    id: attachmentId,
    kind,
    storagePath,
    thumbPath,
    posterPath,
    originalName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    width: preview.width,
    height: preview.height,
    durationSeconds: preview.durationSeconds,
    alt: file.name.replace(/\.[^/.]+$/, ''),
    caption: '',
    sortOrder: 0,
    createdAt: new Date().toISOString(),
  })

  return resolvedAttachment
}

export async function deleteJournalAttachment(attachment) {
  const client = ensureSupabase()
  await getRequiredAuthorId(client)

  const normalized = normalizeAttachment(attachment)
  const bucket = normalized.kind === 'video' ? VIDEO_BUCKET : IMAGE_BUCKET
  const paths = [normalized.storagePath, normalized.thumbPath, normalized.posterPath].filter(Boolean)

  if (!paths.length) {
    return
  }

  const { error } = await client.storage.from(bucket).remove(paths)

  if (error) {
    throw error
  }
}

export async function signInAuthor(email) {
  const client = ensureSupabase()
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.href,
    },
  })

  if (error) {
    throw error
  }
}

export async function signOutAuthor() {
  const client = ensureSupabase()
  const { error } = await client.auth.signOut()

  if (error) {
    throw error
  }
}

export function subscribeToAuthorSession(callback) {
  if (!isSupabaseConfigured || !supabase) {
    return () => {}
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })

  return () => subscription.unsubscribe()
}
