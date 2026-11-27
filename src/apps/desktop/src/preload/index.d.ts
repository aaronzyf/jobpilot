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

export interface JobpilotApi {
  platform: string
  getAppInfo(): Promise<AppInfo>
  setThemeMode(mode: 'system' | 'light' | 'dark'): void
  db: DbApi
}

declare global {
  interface Window {
    jobpilot: JobpilotApi
  }
}
