import { useEffect } from 'react'
import { CandidateEditorDialog } from '@/components/candidates/CandidateEditorDialog'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { Sidebar } from '@/components/layout/Sidebar'
import { Toasts } from '@/components/layout/Toasts'
import { Topbar } from '@/components/layout/Topbar'
import { I18nProvider } from '@/i18n'
import { navItems } from '@/lib/nav'
import { AppProvider, useApp } from '@/lib/store'
import { ThemeProvider } from '@/lib/theme'
import { Applications } from '@/pages/Applications'
import { Candidates } from '@/pages/Candidates'
import { Dashboard } from '@/pages/Dashboard'
import { Interviews } from '@/pages/Interviews'
import { Jobs } from '@/pages/Jobs'
import { Messages } from '@/pages/Messages'
import { Settings } from '@/pages/Settings'

/** 侧栏齿轮按钮触发的配置弹窗，与当前页面无关 */
function CandidateConfigDialog() {
  const { focusCandidateId, clearFocusCandidate, candidates } = useApp()
  const candidate = candidates.find((c) => c.id === focusCandidateId)
  if (!candidate) return null
  return (
    <CandidateEditorDialog
      key={candidate.id}
      candidate={candidate}
      open
      onClose={clearFocusCandidate}
    />
  )
}

function Shell() {
  const { page, go, paletteOpen, setPaletteOpen } = useApp()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(!paletteOpen)
        return
      }
      if (mod && /^[1-7]$/.test(e.key)) {
        e.preventDefault()
        const item = navItems[Number(e.key) - 1]
        if (item) go(item.key)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, paletteOpen, setPaletteOpen])

  const Page = {
    dashboard: Dashboard,
    jobs: Jobs,
    applications: Applications,
    messages: Messages,
    interviews: Interviews,
    candidates: Candidates,
    settings: Settings
  }[page]

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="min-h-0 flex-1 overflow-hidden">
          <div key={page} className="anim-fade h-full min-h-0">
            <Page />
          </div>
        </main>
      </div>
      <CommandPalette />
      <Toasts />
      <CandidateConfigDialog />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppProvider>
          <Shell />
        </AppProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
