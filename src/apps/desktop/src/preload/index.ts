import { contextBridge, ipcRenderer } from 'electron'
import type { AppSnapshot, ApplicationStatus, InterviewStatus } from '@core'

/**
 * 渲染层只能通过这里访问数据。
 * 每个写操作都返回写完之后的新快照：界面不做「猜库里现在是什么」，
 * 也不需要在改动后自己拼一份乐观状态去对齐。
 */
const api = {
  platform: process.platform,
  getAppInfo: () => ipcRenderer.invoke('app:info'),
  /** 主题选择（system / light / dark）交给主进程，窗口底色与原生控件才会一起变 */
  setThemeMode: (mode: 'system' | 'light' | 'dark') => ipcRenderer.send('theme:set-mode', mode),
  db: {
    snapshot: (): Promise<AppSnapshot> => ipcRenderer.invoke('db:snapshot'),
    markConversationRead: (id: string): Promise<AppSnapshot> =>
      ipcRenderer.invoke('db:mark-conversation-read', id),
    markAllRead: (): Promise<AppSnapshot> => ipcRenderer.invoke('db:mark-all-read'),
    sendMessage: (conversationId: string, text: string): Promise<AppSnapshot> =>
      ipcRenderer.invoke('db:send-message', conversationId, text),
    setInterviewStatus: (id: string, status: InterviewStatus): Promise<AppSnapshot> =>
      ipcRenderer.invoke('db:set-interview-status', id, status),
    setJobSaved: (jobId: string, saved: boolean): Promise<AppSnapshot> =>
      ipcRenderer.invoke('db:set-job-saved', jobId, saved),
    setApplicationStatus: (id: string, status: ApplicationStatus): Promise<AppSnapshot> =>
      ipcRenderer.invoke('db:set-application-status', id, status),
    setActiveCandidate: (id: string): Promise<AppSnapshot> =>
      ipcRenderer.invoke('db:set-active-candidate', id),
    reset: (): Promise<AppSnapshot> => ipcRenderer.invoke('db:reset')
  }
}

export type JobpilotApi = typeof api

contextBridge.exposeInMainWorld('jobpilot', api)
