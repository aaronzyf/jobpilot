import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import type {
  AppSnapshot,
  ApplicationStatus,
  CandidateProfilePatch,
  InterviewStatus,
  JobView,
  CandidateView,
  LoadResult,
  MatchRunView,
  SidebarSnapshot,
  ViewQuery,
  ViewSnapshot
} from '@core'
import { useI18n } from '@/i18n'
import type { NavKey } from '@/lib/nav'
import { dbService } from '@/services/db'
import { subscribeMatchRuns } from '@/services/matching'

type ToastTone = 'default' | 'success' | 'warning' | 'danger'

interface Toast {
  id: number
  text: string
  tone: ToastTone
}

const EMPTY_SIDEBAR: SidebarSnapshot = {
  candidates: [],
  sources: [],
  activeCandidateId: '',
  unreadTotal: 0,
  pendingInterviews: 0,
  matchRuns: {},
  revision: 0
}

const EMPTY_VIEW: ViewSnapshot = {
  jobs: [],
  applications: [],
  conversations: [],
  interviews: [],
  savedViews: [],
  llmUsage: [],
  metrics: { trend: [], commTrend: [], hourly: [] }
}

/** 只有页面真正用到的字段留在 AppState，页面不必知道数据分两次回来 */
interface AppState {
  ready: boolean
  error: string | null

  page: NavKey
  go: (page: NavKey, jobId?: string, convId?: string) => void
  focusJobId: string | null
  clearFocusJob: () => void
  focusConvId: string | null
  /** 从侧栏小按钮进入档案配置时，携带目标档案 id */
  focusCandidateId: string | null
  clearFocusCandidate: () => void
  openCandidateConfig: (id: string) => void

  // ---------------------------------------------------------------- 数据
  jobs: JobView[]
  candidates: CandidateView[]
  applications: AppSnapshot['applications']
  sources: AppSnapshot['sources']
  conversations: AppSnapshot['conversations']
  interviews: AppSnapshot['interviews']
  savedViews: AppSnapshot['savedViews']
  llmUsage: AppSnapshot['llmUsage']
  metrics: AppSnapshot['metrics']
  /** 列表页筛选命中的 id；null 表示当前页没有下发筛选，不收窄 */
  filterIds: string[] | null

  /** 侧栏角标直接取全库统计，不受当前页筛选影响 */
  unreadTotal: number
  pendingInterviews: number

  candidateId: string
  candidate: CandidateView
  setCandidateId: (id: string) => void
  /** 后台匹配每轮摘要，按档案 id 索引 */
  matchRuns: SidebarSnapshot['matchRuns']
  setCandidateEnabled: (id: string, enabled: boolean) => void
  /** 保存档案配置：资料、阈值与邮件设置 */
  saveCandidateProfile: (id: string, patch: CandidateProfilePatch) => void

  readIds: string[]
  markRead: (ids: string[]) => void
  markAllRead: () => void
  interviewStatus: Record<string, InterviewStatus>
  setInterviewStatus: (id: string, status: InterviewStatus) => void
  savedIds: string[]
  toggleSaved: (jobId: string) => void
  sendMessage: (conversationId: string, text: string) => void
  setApplicationStatus: (id: string, status: ApplicationStatus) => void
  resetData: () => void

  /** 页面上报自己的筛选条件；变化后自动重新查库 */
  setViewFilter: (patch: Partial<ViewQuery>) => void
  /** 手动重新读取当前页面 */
  refresh: () => void

  paletteOpen: boolean
  setPaletteOpen: (open: boolean) => void
  toasts: Toast[]
  toast: (text: string, tone?: ToastTone) => void
}

const Ctx = createContext<AppState | null>(null)

/** 筛选条件没变就不重复发 IPC，避免输入框每次渲染都触发查询 */
const sameQuery = (a: ViewQuery, b: ViewQuery): boolean =>
  a.page === b.page &&
  a.candidateId === b.candidateId &&
  a.tab === b.tab &&
  a.q === b.q &&
  a.scope === b.scope &&
  JSON.stringify(a.jobs ?? null) === JSON.stringify(b.jobs ?? null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const [sidebar, setSidebar] = useState<SidebarSnapshot | null>(null)
  const [view, setView] = useState<ViewSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<NavKey>('dashboard')
  const [query, setQuery] = useState<ViewQuery>({ page: 'dashboard' })
  /** 同页重复进入或手动刷新时，靠它强制再读一次 */
  const [reloadKey, setReloadKey] = useState(0)
  const [focusJobId, setFocusJobId] = useState<string | null>(null)
  const [focusConvId, setFocusConvId] = useState<string | null>(null)
  const [focusCandidateId, setFocusCandidateId] = useState<string | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [matchRuns, setMatchRuns] = useState<Record<string, MatchRunView>>({})
  const seq = useRef(0)
  const queryRef = useRef(query)
  queryRef.current = query

  /** 后台匹配不受页面读影响：主进程推一轮就更新一轮摘要 */
  useEffect(() => subscribeMatchRuns((runs) => setMatchRuns((prev) => ({ ...prev, ...runs }))), [])

  // ------------------------------------------------------------ 按页读
  useEffect(() => {
    let alive = true
    setError(null)
    dbService
      .load(query)
      .then((result) => {
        if (!alive) return
        setSidebar(result.sidebar)
        setView(result.view)
        setMatchRuns(result.sidebar.matchRuns)
        setQuery((prev) =>
          prev.candidateId ? prev : { ...prev, candidateId: result.sidebar.activeCandidateId }
        )
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      alive = false
    }
  }, [query, reloadKey])

  /** 写操作统一入口：落库后回传「侧栏 + 当前页」，不做乐观拼接 */
  const apply = useCallback(async (run: (q: ViewQuery) => Promise<LoadResult | null>) => {
    try {
      const next = await run(queryRef.current)
      if (next) {
        setSidebar(next.sidebar)
        setView(next.view)
      }
    } catch (e) {
      console.error('[db]', e)
    }
  }, [])

  const snapshotView = view ?? EMPTY_VIEW
  const snapshotSidebar = sidebar ?? EMPTY_SIDEBAR

  const go = useCallback((next: NavKey, jobId?: string, convId?: string) => {
    setPage(next)
    // 进页面就换一套查询条件，切页必然重新读库
    setQuery((prev) => ({
      ...prev,
      page: next,
      tab: undefined,
      q: undefined,
      scope: undefined,
      jobs: undefined
    }))
    // 清掉上一页的筛选命中集，避免它误伤新页面第一帧
    setView((prev) => (prev ? { ...prev, filterIds: undefined } : prev))
    setReloadKey((k) => k + 1)
    setFocusJobId(jobId ?? null)
    setFocusConvId(convId ?? null)
  }, [])

  const clearFocusJob = useCallback(() => setFocusJobId(null), [])
  const clearFocusCandidate = useCallback(() => setFocusCandidateId(null), [])
  // 侧栏齿轮只弹配置框，不切换页面；弹窗由 Shell 统一渲染
  const openCandidateConfig = useCallback((id: string) => setFocusCandidateId(id), [])

  const setViewFilter = useCallback((patch: Partial<ViewQuery>) => {
    setQuery((prev) => {
      const next = { ...prev, ...patch }
      return sameQuery(prev, next) ? prev : next
    })
  }, [])

  const refresh = useCallback(() => setReloadKey((k) => k + 1), [])

  const setCandidateId = useCallback(
    (id: string) => {
      setQuery((prev) => ({ ...prev, candidateId: id }))
      void apply((q) => dbService.setActiveCandidate(q, id))
    },
    [apply]
  )

  const setCandidateEnabled = useCallback(
    (id: string, enabled: boolean) => {
      void apply((q) => dbService.setCandidateEnabled(q, id, enabled))
    },
    [apply]
  )

  const saveCandidateProfile = useCallback(
    (id: string, patch: CandidateProfilePatch) => {
      void apply((q) => dbService.setCandidateProfile(q, id, patch))
    },
    [apply]
  )

  const markRead = useCallback(
    (ids: string[]) => {
      // 串行发：并发写同一批消息时，后返回的快照可能覆盖前一次的已读结果
      void ids.reduce<Promise<void>>(
        (chain, id) =>
          chain.then(() => apply((q) => dbService.markConversationRead(q, id))),
        Promise.resolve()
      )
    },
    [apply]
  )

  const markAllRead = useCallback(() => {
    void apply((q) => dbService.markAllRead(q))
  }, [apply])

  const setInterviewStatus = useCallback(
    (id: string, status: InterviewStatus) => {
      void apply((q) => dbService.setInterviewStatus(q, id, status))
    },
    [apply]
  )

  const toggleSaved = useCallback(
    (jobId: string) => {
      const saved = snapshotView.jobs.find((j) => j.id === jobId)?.saved ?? false
      void apply((q) => dbService.setJobSaved(q, jobId, !saved))
    },
    [apply, snapshotView.jobs]
  )

  const sendMessage = useCallback(
    (conversationId: string, text: string) => {
      void apply((q) => dbService.sendMessage(q, conversationId, text))
    },
    [apply]
  )

  const setApplicationStatus = useCallback(
    (id: string, status: ApplicationStatus) => {
      void apply((q) => dbService.setApplicationStatus(q, id, status))
    },
    [apply]
  )

  const resetData = useCallback(() => {
    void apply((q) => dbService.reset(q))
  }, [apply])

  const toast = useCallback((text: string, tone: ToastTone = 'default') => {
    const id = ++seq.current
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2400)
  }, [])

  const effectiveCandidateId =
    snapshotSidebar.candidates.find((c) => c.id === query.candidateId)?.id ??
    snapshotSidebar.activeCandidateId ??
    snapshotSidebar.candidates[0]?.id ??
    ''

  const candidate =
    snapshotSidebar.candidates.find((c) => c.id === effectiveCandidateId) ??
    snapshotSidebar.candidates[0]

  const readIds = useMemo(
    () => snapshotView.conversations.filter((c) => c.unread === 0).map((c) => c.id),
    [snapshotView.conversations]
  )

  const interviewStatus = useMemo(
    () =>
      Object.fromEntries(snapshotView.interviews.map((i) => [i.id, i.status])) as Record<
        string,
        InterviewStatus
      >,
    [snapshotView.interviews]
  )

  const savedIds = useMemo(
    () => snapshotView.jobs.filter((j) => j.saved).map((j) => j.id),
    [snapshotView.jobs]
  )

  const value = useMemo<AppState | null>(() => {
    if (!candidate) return null
    return {
      ready: sidebar !== null && view !== null,
      error,
      page,
      go,
      focusJobId,
      clearFocusJob,
      focusConvId,
      focusCandidateId,
      clearFocusCandidate,
      openCandidateConfig,
      jobs: snapshotView.jobs,
      candidates: snapshotSidebar.candidates,
      applications: snapshotView.applications,
      sources: snapshotSidebar.sources,
      conversations: snapshotView.conversations,
      interviews: snapshotView.interviews,
      savedViews: snapshotView.savedViews,
      llmUsage: snapshotView.llmUsage,
      metrics: snapshotView.metrics,
      filterIds: snapshotView.filterIds ?? null,
      unreadTotal: snapshotSidebar.unreadTotal,
      pendingInterviews: snapshotSidebar.pendingInterviews,
      candidateId: effectiveCandidateId,
      candidate,
      setCandidateId,
      matchRuns,
      setCandidateEnabled,
      saveCandidateProfile,
      readIds,
      markRead,
      markAllRead,
      interviewStatus,
      setInterviewStatus,
      savedIds,
      toggleSaved,
      sendMessage,
      setApplicationStatus,
      resetData,
      setViewFilter,
      refresh,
      paletteOpen,
      setPaletteOpen,
      toasts,
      toast
    }
  }, [
    sidebar,
    view,
    error,
    matchRuns,
    page,
    go,
    focusJobId,
    clearFocusJob,
    focusConvId,
    focusCandidateId,
    clearFocusCandidate,
    openCandidateConfig,
    snapshotView,
    snapshotSidebar,
    effectiveCandidateId,
    candidate,
    setCandidateId,
    setCandidateEnabled,
    saveCandidateProfile,
    readIds,
    markRead,
    markAllRead,
    interviewStatus,
    setInterviewStatus,
    savedIds,
    toggleSaved,
    sendMessage,
    setApplicationStatus,
    resetData,
    setViewFilter,
    refresh,
    paletteOpen,
    toasts,
    toast
  ])

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <div className="text-[13px] text-fg">{t('common.dbOpenFailed')}</div>
        <div className="max-w-[480px] font-mono text-[11px] leading-relaxed text-fg-subtle">
          {error}
        </div>
      </div>
    )
  }

  if (!value) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-[12px] text-fg-subtle">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          {t('common.dbLoading')}
        </div>
      </div>
    )
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp 必须在 AppProvider 内使用')
  return ctx
}
