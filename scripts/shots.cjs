/*
 * 截图脚本：直接拉起打包后的应用主进程，复用它的窗口做离屏截图。
 *
 * 与之前「自己建一个 offscreen 窗口连 dev server」不同：数据现在来自主进程的
 * SQLite，只有走真实应用才能拿到 window.jobpilot.db，所以这里 require 主进程入口。
 * 前提是先 build：pnpm --filter @jobpilot/desktop build
 *
 * 用法（必须用 Electron 跑；本机 shell 自带 ELECTRON_RUN_AS_NODE=1，要先 unset）：
 *   env -u ELECTRON_RUN_AS_NODE ./node_modules/.bin/electron scripts/shots.cjs [宽度] [高度]
 */
const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const OUT_DIR = path.resolve(__dirname, '../screenshots')
const width = Number(process.argv[2] || 1440)
const height = Number(process.argv[3] || 900)

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// 必须在 require 主进程之前设：主进程据此决定是否离屏
process.env.JOBPILOT_CAPTURE = '1'
app.disableHardwareAcceleration()
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-software-rasterizer')

require('../src/apps/desktop/out/main/index.js')

const js = (win, code) => win.webContents.executeJavaScript(code)

/** Ctrl+1..7 切页，快捷键监听挂在 window 上，合成事件即可触发 */
const nav = (win, n) =>
  js(
    win,
    `window.dispatchEvent(new KeyboardEvent('keydown',{key:'${n}',ctrlKey:true,bubbles:true}));'ok'`
  )

/** 文案相关的定位一律走稳定钩子：主题按钮带 data-theme-switch */
const clickMail = `(()=>{const b=[...document.querySelectorAll('tbody button')].find(el=>el.querySelector('.lucide-mail'));if(!b)return 'no-mail';b.click();return 'ok'})()`
const clickThemeSwitch = `(()=>{const b=document.querySelector('[data-theme-switch]');if(!b)return 'no-switch';b.click();return 'ok'})()`

async function setPrefs(win, lang, theme) {
  await js(
    win,
    `localStorage.setItem('jobpilot.lang','${lang}');localStorage.setItem('jobpilot.theme','${theme}');'ok'`
  )
  const loaded = new Promise((res) => win.webContents.once('did-finish-load', res))
  win.webContents.reload()
  await loaded
  await wait(1100)
}

async function capture(win, file) {
  const img = await win.webContents.capturePage()
  fs.writeFileSync(path.join(OUT_DIR, file), img.toPNG())
  const { width: w, height: h } = img.getSize()
  console.log(`✓ ${file}  ${w}×${h}`)
}

/** prefix 决定文件名前缀，如 zh / en / zh-light */
async function runSet(win, { lang, theme, prefix, extras, appearance, themeMenu }) {
  await setPrefs(win, lang, theme)

  await nav(win, '1')
  await wait(800)
  await capture(win, `${prefix}-01-dashboard.png`)

  if (themeMenu) {
    const r = await js(win, clickThemeSwitch)
    console.log('  theme menu:', r)
    await wait(500)
    await capture(win, `${prefix}-02-theme-menu.png`)
    await js(win, clickThemeSwitch)
    await wait(300)
  }

  await nav(win, '2')
  await wait(800)
  await capture(win, `${prefix}-03-jobs.png`)

  if (extras) {
    // 点开第一条岗位，抓详情面板
    const r = await js(
      win,
      `(()=>{const tr=document.querySelector('tbody tr');if(!tr)return 'no-row';tr.click();return 'ok'})()`
    )
    console.log('  detail:', r)
    await wait(800)
    await capture(win, `${prefix}-04-jobs-detail.png`)
  }

  await nav(win, '3')
  await wait(800)
  await capture(win, `${prefix}-05-applications.png`)

  if (extras) {
    const r = await js(win, clickMail)
    console.log('  mail:', r)
    await wait(900)
    await capture(win, `${prefix}-06-mail-preview.png`)
    await js(win, `document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));'ok'`)
    await wait(300)
  }

  await nav(win, '4')
  await wait(900)
  await capture(win, `${prefix}-07-messages.png`)

  await nav(win, '5')
  await wait(900)
  await capture(win, `${prefix}-08-interviews.png`)

  await nav(win, '6')
  await wait(800)
  await capture(win, `${prefix}-09-candidates.png`)

  // 侧栏底部的候选切换器：验证朝上展开
  const switcher = await js(
    win,
    `(()=>{const b=[...document.querySelectorAll('aside button')].find(el=>el.querySelector('.lucide-chevrons-up-down'));if(!b)return 'no-trigger';b.click();return 'ok'})()`
  )
  console.log('  switcher:', switcher)
  await wait(500)
  await capture(win, `${prefix}-10-candidate-switcher.png`)
  await js(
    win,
    `(()=>{const b=[...document.querySelectorAll('aside button')].find(el=>el.querySelector('.lucide-chevrons-up-down'));b&&b.click();return 'ok'})()`
  )
  await wait(300)

  await nav(win, '7')
  await wait(800)
  await capture(win, `${prefix}-11-settings.png`)

  // 数据与存储：核对真实库路径、实时数据量、重置示例数据入口
  const dataNav = await js(
    win,
    `(()=>{const b=document.querySelector('[data-section="data"]');if(!b)return 'no-data-nav';b.click();return 'ok'})()`
  )
  console.log('  data section:', dataNav)
  await wait(600)
  await capture(win, `${prefix}-12-settings-data.png`)

  if (appearance) {
    // 设置页左栏的「外观」入口，按 data-section 定位，中英文通用
    const r = await js(
      win,
      `(()=>{const b=document.querySelector('[data-section="appearance"]');if(!b)return 'no-nav';b.click();return 'ok'})()`
    )
    console.log('  appearance:', r)
    await wait(700)
    await capture(win, `${prefix}-13-settings-appearance.png`)
  }
}

app.whenReady().then(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  await wait(2600)

  const win = BrowserWindow.getAllWindows()[0]
  if (!win) {
    console.error('主进程没有创建窗口')
    app.exit(1)
    return
  }

  win.setContentSize(width, height)
  await wait(600)
  console.log(`viewport ${width}x${height}`)

  // 中文·深色：完整一套，含详情面板与邮件预览
  await runSet(win, { lang: 'zh', theme: 'dark', prefix: 'zh', extras: true, themeMenu: true })
  // 中文·浅色：主页面 + 外观设置，用于对照两套主题
  await runSet(win, { lang: 'zh', theme: 'light', prefix: 'zh-light', appearance: true, themeMenu: true })
  // 英文·深色：校验英文排版
  await runSet(win, { lang: 'en', theme: 'dark', prefix: 'en' })

  console.log('done → ' + OUT_DIR)
  app.exit(0)
})
