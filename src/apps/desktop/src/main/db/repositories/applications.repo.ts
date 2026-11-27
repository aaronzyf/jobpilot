import { and, eq, sql, type SQL } from 'drizzle-orm'
import type { ApplicationView, ViewQuery } from '@core'
import type { DatabaseHandle } from '../index'
import { schema } from '../index'

export type ApplicationRow = typeof schema.applications.$inferSelect
export type ApplicationLogRow = typeof schema.applicationLogs.$inferSelect

/** 全部投递，按提交时间倒序 */
export function listApplications(handle: DatabaseHandle): ApplicationRow[] {
  return handle.db
    .select()
    .from(schema.applications)
    .orderBy(sql`${schema.applications.submittedAt} desc`)
    .all()
}

/** 投递日志，按序号升序，mapper 再按 applicationId 分组 */
export function listApplicationLogs(handle: DatabaseHandle): ApplicationLogRow[] {
  return handle.db
    .select()
    .from(schema.applicationLogs)
    .orderBy(schema.applicationLogs.seq)
    .all()
}

/** 投递页筛选：条件在 SQL 里，返回主键交给页面收窄列表 */
export function queryApplicationIds(
  handle: DatabaseHandle,
  query: ViewQuery
): string[] | undefined {
  const conds: SQL[] = []
  if (query.tab && query.tab !== 'all') {
    conds.push(eq(schema.applications.status, query.tab as ApplicationView['status']))
  }
  if (query.scope === 'me') {
    conds.push(eq(schema.applications.candidateId, query.candidateId ?? ''))
  }
  if (query.q?.trim()) {
    const kw = `%${query.q.trim()}%`
    conds.push(sql`exists (select 1 from jobs where jobs.id = ${schema.applications.jobId} and (jobs.title like ${kw} or jobs.company like ${kw}))`)
  }
  if (conds.length === 0) return undefined
  return handle.db
    .select({ id: schema.applications.id })
    .from(schema.applications)
    .where(and(...conds))
    .all()
    .map((r) => r.id)
}

/** 更新投递状态，版本号由 service 层推进 */
export function updateApplicationStatus(
  handle: DatabaseHandle,
  id: string,
  status: ApplicationView['status']
): void {
  handle.db
    .update(schema.applications)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.applications.id, id))
    .run()
}
