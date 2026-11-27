import { eq } from 'drizzle-orm'
import type { DatabaseHandle } from '../index'
import { schema } from '../index'

export type CandidateRow = typeof schema.candidates.$inferSelect
export type ApplicationAggregateRow = {
  candidateId: string
  status: (typeof schema.applications.$inferSelect)['status']
}
export type InterviewAggregateRow = {
  candidateId: string
  status: (typeof schema.interviews.$inferSelect)['status']
  startsAt: Date
  durationMin: number
}

/** 未归档的候选人，按创建时间升序 */
export function listCandidates(handle: DatabaseHandle): CandidateRow[] {
  return handle.db
    .select()
    .from(schema.candidates)
    .where(eq(schema.candidates.archived, false))
    .orderBy(schema.candidates.createdAt)
    .all()
}

/** 候选人统计的原始明细：投递状态 + 面试时间，聚合交给 mapper */
export function candidateApplicationRows(handle: DatabaseHandle): ApplicationAggregateRow[] {
  return handle.db
    .select({
      candidateId: schema.applications.candidateId,
      status: schema.applications.status
    })
    .from(schema.applications)
    .all()
}

export function candidateInterviewRows(handle: DatabaseHandle): InterviewAggregateRow[] {
  return handle.db
    .select({
      candidateId: schema.interviews.candidateId,
      status: schema.interviews.status,
      startsAt: schema.interviews.startsAt,
      durationMin: schema.interviews.durationMin
    })
    .from(schema.interviews)
    .all()
}
