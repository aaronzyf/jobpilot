import { gte, sql } from 'drizzle-orm'
import type { DatabaseHandle } from '../index'
import { schema } from '../index'

export type DiscoveredRow = { discoveredAt: Date; id: string }
export type AutoScoreRow = { jobId: string; score: number }
export type SubmittedRow = { submittedAt: Date }
export type MessageAtRow = { at: Date; dir: string }
export type LlmUsageRow = typeof schema.llmUsage.$inferSelect

/** 近 7 天趋势用的原始明细；日期窗口的组装交给 mapper */
export function listJobDiscovery(handle: DatabaseHandle): DiscoveredRow[] {
  return handle.db
    .select({ discoveredAt: schema.jobs.discoveredAt, id: schema.jobs.id })
    .from(schema.jobs)
    .all()
}

export function listAutoScores(handle: DatabaseHandle): AutoScoreRow[] {
  return handle.db
    .select({ jobId: schema.jobScores.jobId, score: schema.jobScores.score })
    .from(schema.jobScores)
    .where(sql`${schema.jobScores.verdict} = 'auto'`)
    .all()
}

export function listSubmissions(handle: DatabaseHandle): SubmittedRow[] {
  return handle.db
    .select({ submittedAt: schema.applications.submittedAt })
    .from(schema.applications)
    .all()
}

export function listMessagesSince(handle: DatabaseHandle, from: number): MessageAtRow[] {
  return handle.db
    .select({ at: schema.messages.at, dir: schema.messages.dir })
    .from(schema.messages)
    .where(gte(schema.messages.at, new Date(from)))
    .all()
}

export function listLlmUsage(handle: DatabaseHandle): LlmUsageRow[] {
  return handle.db.select().from(schema.llmUsage).all()
}

/** 清空全部业务表，保留表结构。用于「恢复示例数据」 */
export function clearBusinessTables(handle: DatabaseHandle): void {
  const tables = [
    'interview_interviewers',
    'interviews',
    'messages',
    'conversations',
    'application_logs',
    'applications',
    'job_bookmarks',
    'job_scores',
    'match_runs',
    'jobs',
    'sources',
    'saved_views',
    'llm_usage',
    'settings',
    'resume_items',
    'resume_documents',
    'candidates'
  ]
  handle.sqlite.transaction(() => {
    for (const t of tables) handle.sqlite.exec(`delete from ${t}`)
  })()
}
