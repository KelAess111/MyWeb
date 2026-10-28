function externalWebURL(value, base) {
  try {
    const url = new URL(value)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.origin === base) return null
    return url.href
  } catch { return null }
}

// Keep the editor in its own window; hand web links to the default browser.
function installExternalNavigation(contents, { getBase, shellURL, openExternal, onError }) {
  const open = value => {
    const url = externalWebURL(value, getBase())
    if (url) Promise.resolve().then(() => openExternal(url)).catch(onError)
  }
  contents.setWindowOpenHandler(({ url }) => {
    open(url)
    return { action: 'deny' }
  })
  contents.on('will-navigate', event => event.preventDefault())
  contents.on('will-frame-navigate', (event, details) => {
    const target = typeof details === 'string' ? details : details?.url || event.url
    try {
      if (target === shellURL || new URL(target).origin === getBase()) return
    } catch { /* Invalid and non-web destinations remain blocked. */ }
    event.preventDefault()
    open(target)
  })
}

module.exports = { externalWebURL, installExternalNavigation }
