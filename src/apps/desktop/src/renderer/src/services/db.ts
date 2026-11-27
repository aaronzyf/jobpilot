import type {
  AppSnapshot,
  ApplicationStatus,
  InterviewStatus,
  LoadResult,
  ViewQuery
} from '@core'

/**
 * 渲染层数据服务。
 *
 * 这是 UI 侧唯一碰 IPC 的地方：store 只认这里的方法，不直接调 window.jobpilot.db。
 * 以后要加缓存、请求去重或换成别的传输方式，改这一层即可，页面与状态层不用动。
 */
export const dbService = {
  /** 一次性全量快照，仅脚本 / 兼容旧调用使用 */
  snapshot: (): Promise<AppSnapshot> => window.jobpilot.db.snapshot(),

  /** 按页面与筛选条件读取：返回侧栏 + 当前页数据 */
  load: (query: ViewQuery): Promise<LoadResult> => window.jobpilot.db.load(query),

  markConversationRead: (query: ViewQuery, id: string): Promise<LoadResult> =>
    window.jobpilot.db.markConversationRead(query, id),

  markAllRead: (query: ViewQuery): Promise<LoadResult> =>
    window.jobpilot.db.markAllRead(query),

  sendMessage: (query: ViewQuery, conversationId: string, text: string): Promise<LoadResult> =>
    window.jobpilot.db.sendMessage(query, conversationId, text),

  setInterviewStatus: (
    query: ViewQuery,
    id: string,
    status: InterviewStatus
  ): Promise<LoadResult> => window.jobpilot.db.setInterviewStatus(query, id, status),

  setJobSaved: (query: ViewQuery, jobId: string, saved: boolean): Promise<LoadResult> =>
    window.jobpilot.db.setJobSaved(query, jobId, saved),

  setApplicationStatus: (
    query: ViewQuery,
    id: string,
    status: ApplicationStatus
  ): Promise<LoadResult> => window.jobpilot.db.setApplicationStatus(query, id, status),

  setActiveCandidate: (query: ViewQuery, id: string): Promise<LoadResult> =>
    window.jobpilot.db.setActiveCandidate(query, id),

  reset: (query: ViewQuery): Promise<LoadResult> => window.jobpilot.db.reset(query)
}
