import { and, eq, isNull, sql } from 'drizzle-orm'
import type { DatabaseHandle } from '../index'
import { schema } from '../index'

/**
 * settings 仓储：键值配置与两个常驻计数。
 *
 * 只碰 SQL，不认识读模型；调用方（service 层）决定这些数字拼进哪一份快照。
 */
export function getSetting<T>(handle: DatabaseHandle, key: string): T | null {
  const row = handle.db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.key, key))
    .get()
  return row ? (row.value as T) : null
}

export function setSetting(handle: DatabaseHandle, key: string, value: unknown): void {
  handle.db
    .insert(schema.settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value, updatedAt: new Date() }
    })
    .run()
}

/** 数据版本号：每次写操作自增，渲染层用它识别外部改动 */
export function bumpRevision(handle: DatabaseHandle): void {
  const cur = getSetting<number>(handle, 'revision') ?? 0
  setSetting(handle, 'revision', cur + 1)
}

/** 全库未读消息数——不随当前页筛选变化 */
export function countUnreadMessages(handle: DatabaseHandle): number {
  const row = handle.db
    .select({ n: sql<number>`count(*)` })
    .from(schema.messages)
    .where(and(eq(schema.messages.dir, 'in'), isNull(schema.messages.readAt)))
    .get()
  return row?.n ?? 0
}

/** 全库待确认面试数 */
export function countPendingInterviews(handle: DatabaseHandle): number {
  const row = handle.db
    .select({ n: sql<number>`count(*)` })
    .from(schema.interviews)
    .where(eq(schema.interviews.status, 'invited'))
    .get()
  return row?.n ?? 0
}
