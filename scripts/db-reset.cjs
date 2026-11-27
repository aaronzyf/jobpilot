/*
 * 把本地库清空并重新灌入示例数据。
 *
 * 前提：先 pnpm --filter @jobpilot/desktop build
 * 用法（必须用 Electron 跑，因为要 require 打包后的主进程）：
 *   env -u ELECTRON_RUN_AS_NODE ./node_modules/.bin/electron scripts/db-reset.cjs
 * 更简单的办法是在应用里点「设置 → 数据与存储 → 重置示例数据」。
 */
const { app, BrowserWindow } = require('electron')
app.disableHardwareAcceleration()
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-software-rasterizer')
require('../src/apps/desktop/out/main/index.js')
app.whenReady().then(async () => {
  await new Promise((r) => setTimeout(r, 2200))
  const win = BrowserWindow.getAllWindows()[0]
  const snap = await win.webContents.executeJavaScript('window.jobpilot.db.reset()')
  console.log('reset ok: jobs', snap.jobs.length, '| cv1 unread',
    snap.conversations.find((c) => c.id === 'cv1').unread)
  app.exit(0)
})
