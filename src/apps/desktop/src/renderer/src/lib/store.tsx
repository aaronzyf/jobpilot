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
  InterviewStatus,
  JobView,
  CandidateView
} from '@core'
import { useI18n } from '@/i18n'
import type { NavKey } from '@/lib/nav'

type ToastTone = 'default' | 'success' | 'warning' | 'danger'

interface Toast {
  id: number
  text: string
  tone: ToastTone
}

/**
 * 首屏渲染前的空快照。
 *
 * 有这一份，页面组件就不必到处写 `data?.jobs ?? []`：
 * 加载中拿到的是空数组，渲染出空列表，数据到了再整体替换。
 */
const EMPTY: AppSnapshot = {
  candidates: [],
  jobs: [],
  applications: [],
  sources: [],
  conversations: [],
  interviews: [],
  savedViews: [],
  llmUsage: [],
  metrics: { trend: [], commTrend: [], hourly: [] },
  activeCandidateId: '',
  revision: 0
}

interface AppState {
  /** 首屏数据是否就位 */
  ready: boolean
  /** 加载失败时的原始错误信息，直接显示在占位屏上 */
  error: string | null

  page: NavKey
  go: (page: NavKey, jobId?: string, convId?: string) => void
  focusJobId: string | null
  clearFocusJob: () => void
  /** 跨页跳转时指定要打开的会话，由沟通页消费 */
  focusConvId: string | null

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

  candidateId: string
  candidate: CandidateView
  setCandidateId: (id: string) => void

  /** 未读数已归零的会话。由数据派生，供页面统一判断 */
  readIds: string[]
  markRead: (ids: string[]) => void
  markAllRead: () => void
  /** 邀约当前状态。直接照库里的值，写操作落库后自动更新 */
  interviewStatus: Record<string, InterviewStatus>
  setInterviewStatus: (id: string, status: InterviewStatus) => void
  /** 已收藏的岗位 id */
  savedIds: string[]
  toggleSaved: (jobId: string) => void
  sendMessage: (conversationId: string, text: string) => void
  setApplicationStatus: (id: string, status: ApplicationStatus) => void
  /** 清空并重新灌示例数据 */
  resetData: () => void

  paletteOpen: boolean
  setPaletteOpen: (open: boolean) => void
  toasts: Toast[]
  toast: (text: string, tone?: ToastTone) => void
}

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const [data, setData] = useState<AppSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<NavKey>('dashboard')
  const [candidateId, setCandidateIdState] = useState('')
  const [focusJobId, setFocusJobId] = useState<string | null>(null)
  const [focusConvId, setFocusConvId] = useState<string | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const seq = useRef(0)

  // ------------------------------------------------------------ 读
  useEffect(() => {
    let alive = true
    window.jobpilot.db
      .snapshot()
      .then((snap) => {
        if (!alive) return
        setData(snap)
        setCandidateIdState((prev) => prev || snap.activeCandidateId)
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      alive = false
    }
  }, [])

  /**
   * 写操作的统一入口：主进程返回写完之后的新快照，直接整份替换。
   * 不做乐观拼接——状态只有一份来源，界面不会出现「显示已读、库里还没读」。
   */
  const apply = useCallback(async (run: () => Promise<AppSnapshot | null>) => {
    try {
      const next = await run()
      if (next) setData(next)
    } catch (e) {
      console.error('[db]', e)
    }
  }, [])

  const snapshot = data ?? EMPTY

  const go = useCallback((next: NavKey, jobId?: string, convId?: string) => {
    setPage(next)
    setFocusJobId(jobId ?? null)
    setFocusConvId(convId ?? null)
  }, [])

  const clearFocusJob = useCallback(() => setFocusJobId(null), [])

  const setCandidateId = useCallback(
    (id: string) => {
      setCandidateIdState(id)
      void apply(() => window.jobpilot.db.setActiveCandidate(id))
    },
    [apply]
  )

  const markRead = useCallback(
    (ids: string[]) => {
      // 串行发：并发写同一批消息时，后返回的快照可能覆盖前一次的已读结果
      void ids.reduce<Promise<void>>(
        (chain, id) => chain.then(() => apply(() => window.jobpilot.db.markConversationRead(id))),
        Promise.resolve()
      )
    },
    [apply]
  )

  const markAllRead = useCallback(() => {
    void apply(() => window.jobpilot.db.markAllRead())
  }, [apply])

  const setInterviewStatus = useCallback(
    (id: string, status: InterviewStatus) => {
      void apply(() => window.jobpilot.db.setInterviewStatus(id, status))
    },
    [apply]
  )

  const toggleSaved = useCallback(
    (jobId: string) => {
      const saved = snapshot.jobs.find((j) => j.id === jobId)?.saved ?? false
      void apply(() => window.jobpilot.db.setJobSaved(jobId, !saved))
    },
    [apply, snapshot.jobs]
  )

  const sendMessage = useCallback(
    (conversationId: string, text: string) => {
      void apply(() => window.jobpilot.db.sendMessage(conversationId, text))
    },
    [apply]
  )

  const setApplicationStatus = useCallback(
    (id: string, status: ApplicationStatus) => {
      void apply(() => window.jobpilot.db.setApplicationStatus(id, status))
    },
    [apply]
  )

  const resetData = useCallback(() => {
    void apply(() => window.jobpilot.db.reset())
  }, [apply])

  const toast = useCallback((text: string, tone: ToastTone = 'default') => {
    const id = ++seq.current
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2400)
  }, [])

  // 库里没有 active_candidate_id 时（比如刚灌完种子），落到第一位
  const effectiveCandidateId =
    snapshot.candidates.find((c) => c.id === candidateId)?.id ??
    snapshot.activeCandidateId ??
    snapshot.candidates[0]?.id ??
    ''

  const candidate =
    snapshot.candidates.find((c) => c.id === effectiveCandidateId) ?? snapshot.candidates[0]

  const readIds = useMemo(
    () => snapshot.conversations.filter((c) => c.unread === 0).map((c) => c.id),
    [snapshot.conversations]
  )

  const interviewStatus = useMemo(
    () =>
      Object.fromEntries(snapshot.interviews.map((i) => [i.id, i.status])) as Record<
        string,
        InterviewStatus
      >,
    [snapshot.interviews]
  )

  const savedIds = useMemo(
    () => snapshot.jobs.filter((j) => j.saved).map((j) => j.id),
    [snapshot.jobs]
  )

  const value = useMemo<AppState | null>(() => {
    if (!candidate) return null
    return {
      ready: data !== null,
      error,
      page,
      go,
      focusJobId,
      clearFocusJob,
      focusConvId,
      jobs: snapshot.jobs,
      candidates: snapshot.candidates,
      applications: snapshot.applications,
      sources: snapshot.sources,
      conversations: snapshot.conversations,
      interviews: snapshot.interviews,
      savedViews: snapshot.savedViews,
      llmUsage: snapshot.llmUsage,
      metrics: snapshot.metrics,
      candidateId: effectiveCandidateId,
      candidate,
      setCandidateId,
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
      paletteOpen,
      setPaletteOpen,
      toasts,
      toast
    }
  }, [
    data,
    error,
    page,
    go,
    focusJobId,
    clearFocusJob,
    focusConvId,
    snapshot,
    effectiveCandidateId,
    candidate,
    setCandidateId,
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
