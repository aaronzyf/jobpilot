import type { AppSnapshot, ApplicationStatus, InterviewStatus } from '@core'

export interface AppInfo {
  version: string
  platform: string
  electron: string
  dataDir: string
}

/** 数据接口。写操作统一返回写完之后的快照，渲染层据此整份替换本地状态 */
export interface DbApi {
  snapshot(): Promise<AppSnapshot>
  markConversationRead(id: string): Promise<AppSnapshot>
  markAllRead(): Promise<AppSnapshot>
  sendMessage(conversationId: string, text: string): Promise<AppSnapshot>
  setInterviewStatus(id: string, status: InterviewStatus): Promise<AppSnapshot>
  setJobSaved(jobId: string, saved: boolean): Promise<AppSnapshot>
  setApplicationStatus(id: string, status: ApplicationStatus): Promise<AppSnapshot>
  setActiveCandidate(id: string): Promise<AppSnapshot>
  /** 清空并重新灌入示例数据 */
  reset(): Promise<AppSnapshot>
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
