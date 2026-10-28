// This preserves the existing lightweight room-entry gate without shipping its
// literal key. Confidential data still requires server-side authorization.
export async function verifyAccessKey(value, { accessSalt,accessHash,accessIterations }) {
  const key = await crypto.subtle.importKey('raw',new TextEncoder().encode(value.trim()),'PBKDF2',false,['deriveBits'])
  const bytes = await crypto.subtle.deriveBits({ name:'PBKDF2',salt:Uint8Array.from(accessSalt.match(/../g),byte => parseInt(byte,16)),iterations:accessIterations,hash:'SHA-256' },key,256)
  const hash = [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2,'0')).join('')
  return hash === accessHash
}
