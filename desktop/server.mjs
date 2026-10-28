import { pathToFileURL } from 'node:url'
import { join } from 'node:path'
const [root, operation] = process.argv.slice(2)
try {
  const vite = await import(pathToFileURL(join(root, 'node_modules/vite/dist/node/index.js')).href)
  if (operation === 'build') {
    await vite.build({ root })
    process.parentPort.postMessage({ built: true })
    process.exit(0)
  } else {
    const server = await vite.createServer({ root, server: { host: '127.0.0.1', port: 5186, strictPort: true }, define: { 'import.meta.env.VITE_EDIT_MODE': JSON.stringify('true') } })
    // This dedicated server belongs to the desktop editor; other local previews stay separate.
    server.config.env.VITE_EDIT_MODE = 'true'
    await server.listen()
    process.parentPort.postMessage({ url: `http://127.0.0.1:${server.httpServer.address().port}` })
    process.parentPort.on('message', async event => { if (event.data === 'close') { await server.close(); process.exit(0) } })
  }
} catch (error) { process.parentPort.postMessage({ error: error.message }); process.exit(1) }
