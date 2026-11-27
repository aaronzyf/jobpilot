import type { WebContents } from 'electron'
import { emit } from '../ipc'

/**
 * SQL 日志的采集端。
 *
 * 放在主进程而不是渲染层：所有 SQL 都由 Drizzle 在这里执行，渲染层只拿结果。
 * 缓冲保留最近 500 条，没有窗口时也一直在收——这样打开日志窗口就能看到此前的查询。
 */
export type SqlLogEntry = {
  seq: number
  at: number
  sql: string
  params: string[]
}

const LIMIT = 500

let entries: SqlLogEntry[] = []
let seq = 0
let enabled = true
const subscribers = new Set<WebContents>()

function serializeParams(params: unknown[]): string[] {
  return params.map((p) => {
    if (typeof p === 'string') return p
    if (p instanceof Date) return p.toISOString()
    if (p === null || p === undefined) return String(p)
    try {
      return JSON.stringify(p)
    } catch {
      return String(p)
    }
  })
}

/** Drizzle 的 logger 回调：SQL 压成单行，换行交给窗口里的 CSS */
export function recordQuery(sql: string, params: unknown[]): void {
  if (!enabled) return
  seq += 1
  const entry: SqlLogEntry = {
    seq,
    at: Date.now(),
    sql: sql.replace(/\s+/g, ' ').trim(),
    params: serializeParams(params)
  }
  entries.push(entry)
  if (entries.length > LIMIT) entries.splice(0, entries.length - LIMIT)

  for (const wc of subscribers) {
    emit(wc, 'sql-log:entry', { entry, count: entries.length })
  }
}

export function listEntries(): SqlLogEntry[] {
  return entries
}

export function clearEntries(): void {
  entries = []
  for (const wc of subscribers) {
    emit(wc, 'sql-log:cleared')
  }
}

export function isEnabled(): boolean {
  return enabled
}

export function setEnabled(value: boolean): void {
  enabled = value
}

/** 窗口关闭时必须退订，否则会往已销毁的 webContents 发消息 */
export function subscribe(wc: WebContents): () => void {
  subscribers.add(wc)
  const unsubscribe = () => subscribers.delete(wc)
  wc.once('destroyed', unsubscribe)
  return unsubscribe
}
