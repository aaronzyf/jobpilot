import { eq } from 'drizzle-orm'
import type { DatabaseHandle } from '../index'
import { schema } from '../index'

export type MatchRunRow = typeof schema.matchRuns.$inferSelect

/** 最近一轮的扫描摘要，每位档案一行。禁用档案的旧记录也会读出来 */
export function listMatchRuns(handle: DatabaseHandle): MatchRunRow[] {
  return handle.db.select().from(schema.matchRuns).all()
}

/** 每轮结束覆盖写入，不积累历史行 */
export function upsertMatchRun(
  handle: DatabaseHandle,
  candidateId: string,
  scanned: number,
  added: number
): void {
  const at = new Date()
  handle.db
    .insert(schema.matchRuns)
    .values({ candidateId, scanned, added, at })
    .onConflictDoUpdate({
      target: schema.matchRuns.candidateId,
      set: { scanned, added, at }
    })
    .run()
}

/** 重置后清掉残留摘要，等下一轮重新写 */
export function clearMatchRuns(handle: DatabaseHandle): void {
  handle.db.delete(schema.matchRuns).run()
}

/** 档案删除/归档后的孤儿摘要（正常由外键级联，这里给重置路径用） */
export function deleteMatchRun(handle: DatabaseHandle, candidateId: string): void {
  handle.db.delete(schema.matchRuns).where(eq(schema.matchRuns.candidateId, candidateId)).run()
}
