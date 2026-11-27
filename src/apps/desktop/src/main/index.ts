import { app, BrowserWindow, nativeTheme, shell } from 'electron'
import { join } from 'node:path'
import type { AppInfo } from '@core'
import { closeDatabase, initDatabase, registerDbIpc } from './db/service'
import { clearEntries, isEnabled, listEntries, setEnabled, subscribe } from './db/sqlLog'
import { registerInvoke, registerSend } from './ipc'

const isMac = process.platform === 'darwin'

// 影响 userData 路径，必须在 ready 之前定下来，否则数据库会落到包名目录里
app.setName('jobpilot')

/** 截图脚本用：离屏渲染、不弹窗，否则无头环境里抓不到画面 */
const captureMode = process.env.JOBPILOT_CAPTURE === '1'

type ThemeMode = 'system' | 'light' | 'dark'

/** 窗口底色须与渲染层的 --bg 对齐，否则窗口拉伸时会露出不匹配的边 */
const CHROME = {
  dark: { bg: '#0b0b0c', symbol: '#8b8b93' },
  light: { bg: '#f5f5f7', symbol: '#5b5b69' }
} as const

const isThemeMode = (v: unknown): v is ThemeMode =>
  v === 'system' || v === 'light' || v === 'dark'

/** 按当前生效的明暗刷新窗口底色与（Windows）标题栏按钮配色 */
function paintChrome(win: BrowserWindow): void {
  if (win.isDestroyed()) return
  const tone = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  const { bg, symbol } = CHROME[tone]
  win.setBackgroundColor(bg)
  if (!isMac) {
    // 自绘标题栏的窗口按钮不吃 CSS，只能从主进程改
    win.setTitleBarOverlay({ color: bg, symbolColor: symbol, height: 44 })
  }
}

function createWindow(): void {
  const tone = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'

  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1040,
    minHeight: 660,
    show: false,
    backgroundColor: CHROME[tone].bg,
    // macOS 内嵌红绿灯，Windows 用自绘标题栏，两端都保留桌面观感
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    ...(isMac
      ? { trafficLightPosition: { x: 16, y: 15 } }
      : {
          titleBarOverlay: {
            color: CHROME[tone].bg,
            symbolColor: CHROME[tone].symbol,
            height: 44
          }
        }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      offscreen: captureMode
    }
  })

  win.on('ready-to-show', () => {
    if (!captureMode) win.show()
  })

  // 外链一律交给系统浏览器，不在应用内开新窗口
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

let sqlLogWin: BrowserWindow | null = null

/** SQL 日志窗口单例：已开着就聚焦，避免开一堆重复窗口 */
function createSqlLogWindow(): void {
  // 开发期调试工具，安装后的版本不开这个窗口
  if (app.isPackaged) return
  if (sqlLogWin && !sqlLogWin.isDestroyed()) {
    sqlLogWin.focus()
    return
  }
  const tone = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  const win = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 640,
    minHeight: 420,
    title: 'SQL 日志',
    show: false,
    backgroundColor: CHROME[tone].bg,
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    ...(isMac
      ? { trafficLightPosition: { x: 16, y: 15 } }
      : {
          titleBarOverlay: {
            color: CHROME[tone].bg,
            symbolColor: CHROME[tone].symbol,
            height: 44
          }
        }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })
  sqlLogWin = win
  const unsubscribe = subscribe(win.webContents)
  win.once('closed', () => {
    unsubscribe()
    sqlLogWin = null
  })
  win.on('ready-to-show', () => win.show())

  if (process.env.ELECTRON_RENDERER_URL) {
    const base = process.env.ELECTRON_RENDERER_URL.replace(/\/$/, '')
    void win.loadURL(`${base}/sqllog.html`)
  } else {
    void win.loadFile(join(__dirname, '../renderer/sqllog.html'))
  }
}

/** 所有 IPC 通道都在这里注册，渲染层只认 main/ipc 暴露的契约 */
function registerIpc(): void {
  registerDbIpc()

  registerSend('sql-log:open', () => createSqlLogWindow())
  registerInvoke('sql-log:list', () => listEntries())
  registerInvoke('sql-log:status', () => ({ enabled: isEnabled(), count: listEntries().length }))
  registerInvoke('sql-log:clear', () => {
    clearEntries()
    return listEntries()
  })
  registerInvoke('sql-log:set-enabled', (_e, value) => {
    if (typeof value === 'boolean') setEnabled(value)
    return isEnabled()
  })

  registerInvoke('app:info', (): AppInfo => ({
    version: app.getVersion(),
    platform: process.platform,
    electron: process.versions.electron,
    dataDir: app.getPath('userData')
  }))

  /**
   * 渲染层把「用户选择」而不是「解析结果」送过来：
   * mode=system 时交给 Electron 跟随系统，prefers-color-scheme 才会继续反映 OS 变化。
   */
  registerSend('theme:set-mode', (event, mode) => {
    if (!isThemeMode(mode)) return
    nativeTheme.themeSource = mode
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) paintChrome(win)
  })
}

// 跟随系统时，OS 切换明暗要同步窗口底色
nativeTheme.on('updated', () => {
  for (const win of BrowserWindow.getAllWindows()) paintChrome(win)
})

void app.whenReady().then(() => {
  // 数据库先就绪：窗口一打开就要渲染数据，晚于 createWindow 会闪一帧空列表
  initDatabase()
  registerIpc()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (!isMac) app.quit()
})

app.on('will-quit', () => {
  closeDatabase()
})
