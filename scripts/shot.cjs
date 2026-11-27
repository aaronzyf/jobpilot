/*
 * 单张截图：拉真实应用（含主进程与 SQLite），执行一段脚本后截图到 /tmp。
 * 用于调试单个状态，批量出图用 shots.cjs。
 *
 * 用法：env -u ELECTRON_RUN_AS_NODE ./node_modules/.bin/electron scripts/shot.cjs \
 *         [名字] ["要执行的JS"] [等待ms] [宽] [高] [lang]
 * 前提：先 pnpm --filter @jobpilot/desktop build
 */
const { app, BrowserWindow } = require('electron')
const { writeFileSync } = require('node:fs')

const outName = process.argv[2] || 'shot'
const script = process.argv[3] || ''
const wait = Number(process.argv[4] || 1200)
const width = Number(process.argv[5] || 1440)
const height = Number(process.argv[6] || 900)
const langArg = process.argv[7] || ''

process.env.JOBPILOT_CAPTURE = '1'
app.disableHardwareAcceleration()
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-software-rasterizer')

require('../src/apps/desktop/out/main/index.js')

app.whenReady().then(async () => {
  await new Promise((r) => setTimeout(r, 2600))
  const win = BrowserWindow.getAllWindows()[0]
  if (!win) {
    console.error('主进程没有创建窗口')
    app.exit(1)
    return
  }

  win.setContentSize(width, height)

  // 语言通过 localStorage 持久化，切换后重载一次让 Provider 读到新值
  if (langArg) {
    await win.webContents.executeJavaScript(`localStorage.setItem('jobpilot.lang','${langArg}')`)
    const loaded = new Promise((res) => win.webContents.once('did-finish-load', res))
    win.webContents.reload()
    await loaded
    await new Promise((r) => setTimeout(r, 900))
  }

  if (script) {
    const ret = await win.webContents.executeJavaScript(script)
    if (ret !== undefined) console.log('[script]', typeof ret === 'string' ? ret : JSON.stringify(ret))
    await new Promise((r) => setTimeout(r, wait))
  }

  const img = await win.webContents.capturePage()
  writeFileSync(`/tmp/jobpilot-${outName}.png`, img.toPNG())
  console.log('saved /tmp/jobpilot-' + outName + '.png')
  app.exit(0)
})
