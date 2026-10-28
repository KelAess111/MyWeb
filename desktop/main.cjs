const { app, BrowserWindow, ipcMain, dialog, utilityProcess, session, shell } = require('electron')
const { readFile, writeFile, access } = require('node:fs/promises')
const { join } = require('node:path')
const { pathToFileURL } = require('node:url')
const publisher = require('./publisher.cjs')
const { installExternalNavigation } = require('./external-navigation.cjs')
let window, worker, root, base, mode = 'preview', sitePath = '/profile', busy = false
const shellURL = pathToFileURL(join(__dirname, 'index.html')).href
const log = value => window?.webContents.send('studio:log', String(value))
function workerRun(operation) {
  return new Promise((resolve, reject) => {
    const process = utilityProcess.fork(join(__dirname,'server.mjs'), [root, operation], { stdio: 'pipe', serviceName: `Kel Studio ${operation}` })
    if (operation !== 'build') worker = process
    process.stdout?.on('data', data => log(data.toString()))
    process.stderr?.on('data', data => log(data.toString()))
    process.on('message', message => message.error ? reject(new Error(message.error)) : resolve(message))
    process.on('exit', code => { if (code) reject(new Error(`本地服务退出 (${code})`)) })
  })
}
async function openProject(path) {
  await access(join(path,'src/App.jsx'))
  await access(join(path,'node_modules/vite/dist/node/index.js')).catch(() => { throw new Error('这个项目尚未安装依赖，请在项目文件夹安装依赖后重试') })
  worker?.kill()
  root = path
  const result = await workerRun('serve')
  base = result.url
  mode = 'preview'
  await writeFile(join(app.getPath('userData'),'project.json'),JSON.stringify({ root }))
  return info()
}
function info() {
  if (!base) return { root, error: '请先选择网站项目文件夹' }
  const url = new URL(sitePath, base)
  url.searchParams.delete('editMode'); url.searchParams.delete('preview'); url.searchParams.delete('edit')
  url.searchParams.set(mode === 'edit' ? 'editMode' : 'preview', mode === 'edit' ? 'local' : 'true')
  return { root, mode, url: url.href }
}
function handle(name, fn) {
  ipcMain.handle(`studio:${name}`, async (event,...args) => {
    if (event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame || event.senderFrame.url !== shellURL) throw new Error('无效的应用请求')
    if (busy && name !== 'info') throw new Error('正在发布，请稍候')
    try { return { ok: true, data: await fn(...args) } } catch (error) { return { ok: false, error: error.message } }
  })
}
app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((_webContents,_permission,callback) => callback(false))
  window = new BrowserWindow({ width: 1440, height: 960, minWidth: 960, minHeight: 640, title: 'Kel Portfolio Studio', autoHideMenuBar: true, webPreferences: { preload: join(__dirname,'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, webviewTag: false } })
  installExternalNavigation(window.webContents, {
    getBase: () => base, shellURL,
    openExternal: url => shell.openExternal(url),
    onError: error => { log(error.message); dialog.showMessageBox(window, { type: 'error', title: '无法打开链接', message: '系统浏览器未能打开链接，请检查默认浏览器设置后重试。' }).catch(() => {}) },
  })
  window.webContents.on('did-frame-navigate', (_event,url,_code,_text,isMainFrame) => {
    if (!isMainFrame && base && url.startsWith(`${base}/`)) { const path = new URL(url); sitePath = path.pathname + path.search + path.hash }
  })
  window.webContents.on('did-navigate-in-page', (_event,url,isMainFrame) => {
    if (!isMainFrame && base && url.startsWith(`${base}/`)) { const path = new URL(url); sitePath = path.pathname + path.search + path.hash }
  })
  handle('info', () => info())
  handle('choose', async () => { const result = await dialog.showOpenDialog(window,{ title:'选择 my-portfolio 项目文件夹',properties:['openDirectory'] }); return result.canceled ? info() : openProject(result.filePaths[0]) })
  handle('mode', value => { if (!['edit','preview'].includes(value)) throw new Error('模式无效'); mode = value; return info() })
  handle('inspect', () => publisher.inspect(root))
  handle('publish', async (version,files) => { busy = true; try { return await publisher.publish(root,version,files,log, () => workerRun('build')) } finally { busy = false } })
  try {
    let config = { root: 'E:\\Kel-MyselfWeb\\my-portfolio' }
    try { config = JSON.parse(await readFile(join(app.getPath('userData'),'project.json'),'utf8')) } catch {}
    await openProject(config.root)
  } catch (error) { log(error.message) }
  await window.loadFile(join(__dirname,'index.html'))
})
app.on('before-quit', () => worker?.kill())
app.on('window-all-closed', () => app.quit())
if (!app.requestSingleInstanceLock()) app.quit()
app.on('second-instance', () => { window?.show(); window?.focus() })
