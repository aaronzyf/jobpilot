import { and, eq, inArray, or, sql, type SQL } from 'drizzle-orm'
import type { InterviewStatus, ViewQuery } from '@core'
import type { DatabaseHandle } from '../index'
import { schema } from '../index'

export type InterviewRow = typeof schema.interviews.$inferSelect
export type InterviewerRow = typeof schema.interviewInterviewers.$inferSelect

export function listInterviews(handle: DatabaseHandle): InterviewRow[] {
  return handle.db.select().from(schema.interviews).orderBy(schema.interviews.startsAt).all()
}

export function listInterviewers(handle: DatabaseHandle): InterviewerRow[] {
  return handle.db
    .select()
    .from(schema.interviewInterviewers)
    .orderBy(schema.interviewInterviewers.seq)
    .all()
}

/** 面试页筛选：时间相关档位按 startsAt + durationMin 现算 */
export function queryInterviewIds(
  handle: DatabaseHandle,
  query: ViewQuery
): string[] | undefined {
  const conds: SQL[] = []
  const now = Date.now()
  const ended = sql`(${schema.interviews.startsAt} + ${schema.interviews.durationMin} * 60000) <= ${now}`
  if (query.tab === 'invited') conds.push(eq(schema.interviews.status, 'invited'))
  if (query.tab === 'upcoming') {
    conds.push(inArray(schema.interviews.status, ['accepted', 'rescheduled']))
    conds.push(sql`not ${ended}`)
  }
  if (query.tab === 'past') {
    conds.push(
      or(
        inArray(schema.interviews.status, ['done', 'declined', 'cancelled']),
        ended
      ) as SQL
    )
  }
  if (query.q?.trim()) {
    const kw = `%${query.q.trim()}%`
    conds.push(
      or(
        sql`exists (select 1 from jobs where jobs.id = ${schema.interviews.jobId} and (jobs.title like ${kw} or jobs.company like ${kw}))`,
        sql`exists (select 1 from interview_interviewers where interview_interviewers.interview_id = ${schema.interviews.id} and (interview_interviewers.name like ${kw} or interview_interviewers.title like ${kw}))`
      ) as SQL
    )
  }
  if (conds.length === 0) return undefined
  return handle.db
    .select({ id: schema.interviews.id })
    .from(schema.interviews)
    .where(and(...conds))
    .all()
    .map((r) => r.id)
}

export function updateInterviewStatus(
  handle: DatabaseHandle,
  id: string,
  status: InterviewStatus
): void {
  handle.db.update(schema.interviews).set({ status }).where(eq(schema.interviews.id, id)).run()
}
