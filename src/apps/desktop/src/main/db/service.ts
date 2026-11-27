import { app } from 'electron'
import { join } from 'node:path'
import type { ApplicationStatus, InterviewStatus, ViewKey, ViewQuery } from '@core'
import { registerInvoke } from '../ipc'
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

/** IPC 传来的都是未知形状：这里只做校验，不碰业务与 SQL */
function queryOf(value: unknown): ViewQuery {
  if (!value || typeof value !== 'object') return { page: 'dashboard' }
  const q = value as Partial<ViewQuery>
  return {
    ...q,
    page: q.page && PAGES.includes(q.page) ? q.page : 'dashboard'
  }
}

/**
 * 数据通道注册。全部经 main/ipc/registry 的类型化入口，
 * 本文件不再直接出现 ipcMain，也不写 SQL、不拼读模型。
 * 参数不合法时回读当前视图，界面照常刷新，不返回 null。
 */
export function registerDbIpc(): void {
  registerInvoke('db:snapshot', () => service.readSnapshot(requireHandle()))

  registerInvoke('db:load', (_e, payload) =>
    service.readAfterWrite(requireHandle(), queryOf(payload))
  )

  registerInvoke('db:mark-conversation-read', (_e, payload) => {
    const h = requireHandle()
    const query = queryOf(payload?.query)
    if (typeof payload?.id !== 'string') return service.readAfterWrite(h, query)
    return service.markRead(h, query, payload.id)
  })

  registerInvoke('db:mark-all-read', (_e, payload) =>
    service.markAllRead(requireHandle(), queryOf(payload))
  )

  registerInvoke('db:send-message', (_e, payload) => {
    const h = requireHandle()
    const query = queryOf(payload?.query)
    if (!payload || typeof payload.conversationId !== 'string' || typeof payload.text !== 'string')
      return service.readAfterWrite(h, query)
    if (!payload.text.trim()) return service.readAfterWrite(h, query)
    return service.sendMessage(h, query, payload.conversationId, payload.text.trim())
  })

  registerInvoke('db:set-interview-status', (_e, payload) => {
    const h = requireHandle()
    const query = queryOf(payload?.query)
    if (!payload || typeof payload.id !== 'string' || !INTERVIEW_STATUSES.includes(payload.status))
      return service.readAfterWrite(h, query)
    return service.setInterview(h, query, payload.id, payload.status)
  })

  registerInvoke('db:set-job-saved', (_e, payload) => {
    const h = requireHandle()
    const query = queryOf(payload?.query)
    if (!payload || typeof payload.jobId !== 'string' || typeof payload.saved !== 'boolean')
      return service.readAfterWrite(h, query)
    return service.setSaved(h, query, payload.jobId, payload.saved)
  })

  registerInvoke('db:set-application-status', (_e, payload) => {
    const h = requireHandle()
    const query = queryOf(payload?.query)
    if (!payload || typeof payload.id !== 'string' || !APPLICATION_STATUSES.includes(payload.status))
      return service.readAfterWrite(h, query)
    return service.setApplication(h, query, payload.id, payload.status)
  })

  registerInvoke('db:set-active-candidate', (_e, payload) => {
    const h = requireHandle()
    const query = queryOf(payload?.query)
    if (!payload || typeof payload.id !== 'string') return service.readAfterWrite(h, query)
    return service.setActiveCandidate(h, query, payload.id)
  })

  registerInvoke('db:set-candidate-enabled', (_e, payload) => {
    const h = requireHandle()
    const query = queryOf(payload?.query)
    if (!payload || typeof payload.id !== 'string' || typeof payload.enabled !== 'boolean')
      return service.readAfterWrite(h, query)
    return service.setCandidateEnabled(h, query, payload.id, payload.enabled)
  })

  registerInvoke('db:reset', (_e, payload) =>
    service.resetData(requireHandle(), queryOf(payload))
  )
}
