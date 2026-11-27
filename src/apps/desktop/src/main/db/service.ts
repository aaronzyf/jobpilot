import { app, ipcMain } from 'electron'
import { join } from 'node:path'
import type { ApplicationStatus, InterviewStatus, ViewKey, ViewQuery } from '@core'
import { openDatabase, type DatabaseHandle } from './index'
import { seedIfEmpty } from './seed'
import * as service from './services'

let handle: DatabaseHandle | null = null

function requireHandle(): DatabaseHandle {
  if (!handle) throw new Error('数据库尚未初始化')
  return handle
}

export function initDatabase(): DatabaseHandle {
  const file = join(app.getPath('userData'), 'jobpilot.db')
  const opened = openDatabase(file)
  const seeded = seedIfEmpty(opened)
  handle = opened
  console.log(`[db] ${file}${seeded ? '（已写入示例数据）' : ''}`)
  return opened
}

export function closeDatabase(): void {
  handle?.sqlite.close()
  handle = null
}

const PAGES: ViewKey[] = [
  'dashboard',
  'jobs',
  'applications',
  'messages',
  'interviews',
  'candidates',
  'settings'
]

const INTERVIEW_STATUSES: InterviewStatus[] = [
  'invited',
  'accepted',
  'rescheduled',
  'declined',
  'done',
  'cancelled'
]

const APPLICATION_STATUSES: ApplicationStatus[] = [
  'draft',
  'pending_confirm',
  'queued',
  'sent',
  'failed',
  'replied',
  'rejected'
]

/** IPC 传来的都是 unknown：这里只做形状校验，不碰业务与 SQL */
function queryOf(value: unknown): ViewQuery {
  if (!value || typeof value !== 'object') return { page: 'dashboard' }
  const q = value as Partial<ViewQuery>
  return {
    ...q,
    page: q.page && PAGES.includes(q.page) ? q.page : 'dashboard'
  }
}

/**
 * IPC 边界层：校验参数 → 调业务用例 → 返回结果。
 * 所有数据规则都在 services/ 里，本文件不写 SQL、不拼读模型、不发第二条 IPC。
 */
export function registerDbIpc(): void {
  ipcMain.handle('db:snapshot', () => service.readSnapshot(requireHandle()))

  ipcMain.handle('db:load', (_e, query: unknown) =>
    service.readAfterWrite(requireHandle(), queryOf(query))
  )

  ipcMain.handle('db:mark-conversation-read', (_e, query: unknown, id: unknown) => {
    if (typeof id !== 'string') return null
    return service.markRead(requireHandle(), queryOf(query), id)
  })

  ipcMain.handle('db:mark-all-read', (_e, query: unknown) =>
    service.markAllRead(requireHandle(), queryOf(query))
  )

  ipcMain.handle('db:send-message', (_e, query: unknown, conversationId: unknown, text: unknown) => {
    if (typeof conversationId !== 'string' || typeof text !== 'string' || !text.trim()) return null
    return service.sendMessage(requireHandle(), queryOf(query), conversationId, text.trim())
  })

  ipcMain.handle('db:set-interview-status', (_e, query: unknown, id: unknown, status: unknown) => {
    if (typeof id !== 'string' || !INTERVIEW_STATUSES.includes(status as InterviewStatus)) return null
    return service.setInterview(requireHandle(), queryOf(query), id, status as InterviewStatus)
  })

  ipcMain.handle('db:set-job-saved', (_e, query: unknown, jobId: unknown, saved: unknown) => {
    if (typeof jobId !== 'string' || typeof saved !== 'boolean') return null
    return service.setSaved(requireHandle(), queryOf(query), jobId, saved)
  })

  ipcMain.handle('db:set-application-status', (_e, query: unknown, id: unknown, status: unknown) => {
    if (typeof id !== 'string' || typeof status !== 'string') return null
    if (!APPLICATION_STATUSES.includes(status as ApplicationStatus)) return null
    return service.setApplication(requireHandle(), queryOf(query), id, status as ApplicationStatus)
  })

  ipcMain.handle('db:set-active-candidate', (_e, query: unknown, id: unknown) => {
    if (typeof id !== 'string') return null
    return service.setActiveCandidate(requireHandle(), queryOf(query), id)
  })

  ipcMain.handle('db:reset', (_e, query: unknown) =>
    service.resetData(requireHandle(), queryOf(query))
  )
}
