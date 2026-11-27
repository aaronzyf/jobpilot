import type { ApplicationStatus, InterviewStatus } from '../domain/types'
import type { AppSnapshot, LoadResult, ViewQuery } from '../domain/view'

/**
 * 跨进程的唯一契约。
 *
 * 三张表把「通道名 → 参数 → 返回」钉在一起：
 * - Invoke：请求-响应，渲染层 await主讲进程回传；
 * - Send：单向通知，不需要回包；
 * - Event：主进程主动推给渲染窗口（如 SQL 日志增量）。
 *
 * 主进程注册、preload 桥、渲染层调用都从同一份类型取值，
 * 改一个通道的三处签名时，任何一处漏改都会在 tsc 阶段报错。
 */

/** 请求-响应通道 */
export interface InvokeContract {
  'app:info': {
    req: void
    res: AppInfo
  }
  'db:snapshot': {
    req: void
    res: AppSnapshot
  }
  'db:load': {
    req: ViewQuery
    res: LoadResult
  }
  'db:mark-conversation-read': {
    req: { query: ViewQuery; id: string }
    res: LoadResult
  }
  'db:mark-all-read': {
    req: ViewQuery
    res: LoadResult
  }
  'db:send-message': {
    req: { query: ViewQuery; conversationId: string; text: string }
    res: LoadResult
  }
  'db:set-interview-status': {
    req: { query: ViewQuery; id: string; status: InterviewStatus }
    res: LoadResult
  }
  'db:set-job-saved': {
    req: { query: ViewQuery; jobId: string; saved: boolean }
    res: LoadResult
  }
  'db:set-application-status': {
    req: { query: ViewQuery; id: string; status: ApplicationStatus }
    res: LoadResult
  }
  'db:set-active-candidate': {
    req: { query: ViewQuery; id: string }
    res: LoadResult
  }
  'db:reset': {
    req: ViewQuery
    res: LoadResult
  }
  'sql-log:list': {
    req: void
    res: SqlLogEntry[]
  }
  'sql-log:status': {
    req: void
    res: SqlLogStatus
  }
  'sql-log:clear': {
    req: void
    res: SqlLogEntry[]
  }
  'sql-log:set-enabled': {
    req: boolean
    res: boolean
  }
}

/** 单向通知通道 */
export interface SendContract {
  'theme:set-mode': ThemeMode
  'sql-log:open': void
}

/** 主 → 渲染事件通道 */
export interface EventContract {
  'sql-log:entry': { entry: SqlLogEntry; count: number }
  'sql-log:cleared': void
}

export type InvokeChannel = keyof InvokeContract
export type SendChannel = keyof SendContract
export type EventChannel = keyof EventContract

export type InvokeReq<K extends InvokeChannel> = InvokeContract[K]['req']
export type InvokeRes<K extends InvokeChannel> = InvokeContract[K]['res']
export type SendPayload<K extends SendChannel> = SendContract[K]
export type EventPayload<K extends EventChannel> = EventContract[K]

/** 无参数通道在调用时可以省略第二个参数 */
export type InvokeArgs<K extends InvokeChannel> = InvokeReq<K> extends void
  ? [payload?: undefined]
  : [payload: InvokeReq<K>]

export type SendArgs<K extends SendChannel> = SendPayload<K> extends void
  ? [payload?: undefined]
  : [payload: SendPayload<K>]

export type AppInfo = {
  version: string
  platform: string
  electron: string
  dataDir: string
}

export type ThemeMode = 'system' | 'light' | 'dark'

/** SQL 日志条目。参数在主进程已转成字符串，可安全跨 IPC */
export type SqlLogEntry = {
  seq: number
  at: number
  sql: string
  params: string[]
}

export type SqlLogStatus = {
  enabled: boolean
  count: number
}
