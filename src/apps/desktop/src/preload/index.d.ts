import type {
  AppSnapshot,
  ApplicationStatus,
  InterviewStatus,
  LoadResult,
  ViewQuery
} from '@core'

export interface AppInfo {
  version: string
  platform: string
  electron: string
  dataDir: string
}

/** 数据接口。每次读写都带当前视图条件，回传「侧栏 + 当前页」，不再只在启动时拉一次 */
export interface DbApi {
  snapshot(): Promise<AppSnapshot>
  load(query: ViewQuery): Promise<LoadResult>
  markConversationRead(query: ViewQuery, id: string): Promise<LoadResult>
  markAllRead(query: ViewQuery): Promise<LoadResult>
  sendMessage(query: ViewQuery, conversationId: string, text: string): Promise<LoadResult>
  setInterviewStatus(query: ViewQuery, id: string, status: InterviewStatus): Promise<LoadResult>
  setJobSaved(query: ViewQuery, jobId: string, saved: boolean): Promise<LoadResult>
  setApplicationStatus(
    query: ViewQuery,
    id: string,
    status: ApplicationStatus
  ): Promise<LoadResult>
  setActiveCandidate(query: ViewQuery, id: string): Promise<LoadResult>
  /** 清空并重新灌入示例数据 */
  reset(query: ViewQuery): Promise<LoadResult>
}

/** SQL 日志条目。参数在主进程已转成字符串，可安全跨 IPC */
export interface SqlLogEntry {
  seq: number
  at: number
  sql: string
  params: string[]
}

export interface SqlLogApi {
  /** 打开（或聚焦）日志窗口 */
  open(): void
  list(): Promise<SqlLogEntry[]>
  status(): Promise<{ enabled: boolean; count: number }>
  clear(): Promise<SqlLogEntry[]>
  setEnabled(enabled: boolean): Promise<boolean>
  /** 返回取消订阅函数，组件卸载时必须调用 */
  onEntry(cb: (payload: { entry: SqlLogEntry; count: number }) => void): () => void
  onCleared(cb: () => void): () => void
}

export interface JobpilotApi {
  platform: string
  getAppInfo(): Promise<AppInfo>
  setThemeMode(mode: 'system' | 'light' | 'dark'): void
  db: DbApi
  sqlLog: SqlLogApi
}

declare global {
  interface Window {
    jobpilot: JobpilotApi
  }
}
