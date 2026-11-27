import { app, ipcMain } from 'electron'
import { join } from 'node:path'
import type { InterviewStatus } from '@core'
import { openDatabase, type DatabaseHandle } from './index'
import {
  appendOutgoingMessage,
  markAllConversationsRead,
  markConversationRead,
  readSnapshot,
  resetDatabase,
  setActiveCandidate,
  setApplicationStatus,
  setInterviewStatus,
  setJobSaved
} from './queries'
import { seedIfEmpty } from './seed'

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
  console.log(
    `[db] ${file}${seeded ? '（已写入示例数据）' : ''}`
  )
  return opened
}

export function closeDatabase(): void {
  handle?.sqlite.close()
  handle = null
}

/**
 * 所有 DB 访问都在主进程：渲染层不接触 SQL，也不持有连接。
 * 写操作一律「先落库、再回传新的快照」，避免界面状态和库里对不上。
 */
export function registerDbIpc(): void {
  ipcMain.handle('db:snapshot', () => readSnapshot(requireHandle()))

  ipcMain.handle('db:mark-conversation-read', (_e, id: unknown) => {
    if (typeof id !== 'string') return null
    const h = requireHandle()
    markConversationRead(h, id)
    return readSnapshot(h)
  })

  ipcMain.handle('db:mark-all-read', () => {
    const h = requireHandle()
    markAllConversationsRead(h)
    return readSnapshot(h)
  })

  ipcMain.handle('db:send-message', (_e, conversationId: unknown, text: unknown) => {
    if (typeof conversationId !== 'string' || typeof text !== 'string' || !text.trim()) return null
    const h = requireHandle()
    appendOutgoingMessage(h, conversationId, text.trim())
    return readSnapshot(h)
  })

  ipcMain.handle('db:set-interview-status', (_e, id: unknown, status: unknown) => {
    if (typeof id !== 'string') return null
    const allowed: InterviewStatus[] = [
      'invited',
      'accepted',
      'rescheduled',
      'declined',
      'done',
      'cancelled'
    ]
    if (!allowed.includes(status as InterviewStatus)) return null
    const h = requireHandle()
    setInterviewStatus(h, id, status as InterviewStatus)
    return readSnapshot(h)
  })

  ipcMain.handle('db:set-job-saved', (_e, jobId: unknown, saved: unknown) => {
    if (typeof jobId !== 'string' || typeof saved !== 'boolean') return null
    const h = requireHandle()
    setJobSaved(h, jobId, saved)
    return readSnapshot(h)
  })

  ipcMain.handle('db:set-application-status', (_e, id: unknown, status: unknown) => {
    if (typeof id !== 'string' || typeof status !== 'string') return null
    const h = requireHandle()
    setApplicationStatus(h, id, status as Parameters<typeof setApplicationStatus>[2])
    return readSnapshot(h)
  })

  ipcMain.handle('db:set-active-candidate', (_e, id: unknown) => {
    if (typeof id !== 'string') return null
    const h = requireHandle()
    setActiveCandidate(h, id)
    return readSnapshot(h)
  })

  ipcMain.handle('db:reset', () => {
    const h = requireHandle()
    resetDatabase(h)
    seedIfEmpty(h)
    return readSnapshot(h)
  })
}
