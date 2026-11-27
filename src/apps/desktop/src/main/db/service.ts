import { app } from 'electron'
import { join } from 'node:path'
import type {
  ApplicationStatus,
  CandidateProfilePatch,
  InterviewStatus,
  ViewKey,
  ViewQuery
} from '@core'
import { registerInvoke } from '../ipc'
import { requestMatching } from '../matching/engine'
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
 * 档案配置补丁的校验。IPC 传来的是未知形状：
 * 这里只做类型与范围检查，缺字段就整份拒绝，避免写进半截数据。
 */
function patchOf(value: unknown): CandidateProfilePatch | null {
  if (!value || typeof value !== 'object') return null
  const p = value as Partial<CandidateProfilePatch>
  if (typeof p.name !== 'string' || !p.name.trim()) return null
  if (typeof p.headline !== 'string' || typeof p.location !== 'string') return null
  if (!Array.isArray(p.languages) || p.languages.some((l) => typeof l !== 'string')) return null
  if (typeof p.note !== 'string' || typeof p.email !== 'string') return null
  if (typeof p.dailyCap !== 'number' || !Number.isInteger(p.dailyCap) || p.dailyCap <= 0)
    return null
  const t = p.thresholds
  if (!t || typeof t !== 'object') return null
  const auto = (t as { auto?: unknown }).auto
  const reject = (t as { reject?: unknown }).reject
  if (typeof auto !== 'number' || typeof reject !== 'number') return null
  if (auto < 0 || auto > 100 || reject < 0 || reject > 100) return null
  const smtp = endpointOf(p.smtp)
  const pop3 = endpointOf(p.pop3)
  if (p.smtp != null && !smtp) return null
  if (p.pop3 != null && !pop3) return null
  if (pop3 && typeof (p.pop3 as { enabled?: unknown }).enabled !== 'boolean') return null
  return {
    name: p.name.trim(),
    headline: p.headline,
    location: p.location,
    languages: p.languages,
    note: p.note,
    thresholds: { auto, reject },
    dailyCap: p.dailyCap,
    email: p.email,
    smtp,
    pop3: pop3 ? { ...pop3, enabled: (p.pop3 as { enabled: boolean }).enabled } : null
  }
}

/** 邮件端点：host 为空即视为未配置 */
function endpointOf(value: unknown): { host: string; port: number } | null {
  if (!value || typeof value !== 'object') return null
  const v = value as { host?: unknown; port?: unknown }
  if (typeof v.host !== 'string') return null
  if (typeof v.port !== 'number' || !Number.isInteger(v.port)) return null
  if (v.port < 1 || v.port > 65535) return null
  const host = v.host.trim()
  if (!host) return null
  return { host, port: v.port }
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

  registerInvoke('db:load-resume', (_e, payload) => {
    if (!payload || typeof payload.candidateId !== 'string') return null
    return service.readResume(requireHandle(), payload.candidateId)
  })

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
    const result = service.setCandidateEnabled(h, query, payload.id, payload.enabled)
    requestMatching()
    return result
  })

  registerInvoke('db:set-candidate-profile', (_e, payload) => {
    const h = requireHandle()
    const query = queryOf(payload?.query)
    if (!payload || typeof payload.id !== 'string') return service.readAfterWrite(h, query)
    const patch = patchOf(payload.patch)
    if (!patch) return service.readAfterWrite(h, query)
    return service.setCandidateProfile(h, query, payload.id, patch)
  })

  registerInvoke('db:reset', (_e, payload) => {
    const result = service.resetData(requireHandle(), queryOf(payload))
    requestMatching()
    return result
  })
}
