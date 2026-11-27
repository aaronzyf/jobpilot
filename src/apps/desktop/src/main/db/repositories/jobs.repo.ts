import { and, eq, gte, inArray, like, lt, notLike, or, sql, type SQL } from 'drizzle-orm'
import type { JobViewFilter } from '@core'
import type { DatabaseHandle } from '../index'
import { schema } from '../index'

export type JobRow = typeof schema.jobs.$inferSelect
export type JobScoreRow = typeof schema.jobScores.$inferSelect
export type BookmarkRow = typeof schema.jobBookmarks.$inferSelect
export type SavedViewRow = typeof schema.savedViews.$inferSelect

/**
 * 岗位列表查询：筛选条件全部落成 SQL WHERE。
 * 页面改条件时会真正打到数据库，而不是拿快照在内存里过滤。
 */
export function queryJobs(handle: DatabaseHandle, filter?: JobViewFilter): JobRow[] {
  const conds: SQL[] = []
  if (filter) {
    if (filter.workModes?.length) {
      conds.push(inArray(schema.jobs.workMode, filter.workModes))
    }
    if (filter.region && filter.region !== 'all') {
      conds.push(eq(schema.jobs.region, filter.region))
    }
    if (filter.employment && filter.employment !== 'all') {
      conds.push(eq(schema.jobs.employmentType, filter.employment))
    }
    if (filter.visa) conds.push(eq(schema.jobs.companyVisa, true))
    if (filter.postedWithin && filter.postedWithin > 0) {
      conds.push(
        gte(schema.jobs.postedAt, new Date(Date.now() - filter.postedWithin * 3_600_000))
      )
    }
    if (filter.excludeOutsource) {
      conds.push(
        and(
          notLike(schema.jobs.tags, '%外包%'),
          notLike(schema.jobs.tags, '%驻场%')
        ) as SQL
      )
    }
    if (filter.keyword?.trim()) {
      const kw = `%${filter.keyword.trim()}%`
      conds.push(
        or(
          like(schema.jobs.title, kw),
          like(schema.jobs.company, kw),
          like(schema.jobs.jdSummary, kw),
          like(schema.jobs.tags, kw)
        ) as SQL
      )
    }

    // 分数 / 档位依赖当前求职者的阈值，用 exists 子查询下推
    const verdict = filter.verdict && filter.verdict !== 'all' ? filter.verdict : null
    const min = filter.minScore ?? 0
    if ((filter.candidateId && verdict) || min > 0) {
      const scoreConds: SQL[] = min > 0 ? [gte(schema.jobScores.score, min)] : []
      if (filter.candidateId) scoreConds.push(eq(schema.jobScores.candidateId, filter.candidateId))
      if (verdict === 'auto') scoreConds.push(gte(schema.jobScores.score, filter.auto ?? 85))
      if (verdict === 'confirm') {
        scoreConds.push(gte(schema.jobScores.score, filter.reject ?? 40))
        scoreConds.push(lt(schema.jobScores.score, filter.auto ?? 85))
      }
      if (verdict === 'reject') scoreConds.push(lt(schema.jobScores.score, filter.reject ?? 40))
      conds.push(sql`exists (select 1 from job_scores where job_scores.job_id = ${schema.jobs.id} and ${and(...scoreConds)})`)
    }
  }

  return handle.db
    .select()
    .from(schema.jobs)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(schema.jobs.postedAt)
    .all()
}

/** 全部匹配分数。按岗位分组是读模型的职责，这里只返回行 */
export function listJobScores(handle: DatabaseHandle): JobScoreRow[] {
  return handle.db.select().from(schema.jobScores).all()
}

/** 开放岗位，后台匹配按这份清单扫描 */
export function listOpenJobs(handle: DatabaseHandle): JobRow[] {
  return handle.db
    .select()
    .from(schema.jobs)
    .where(eq(schema.jobs.status, 'open'))
    .orderBy(schema.jobs.postedAt)
    .all()
}

/** 后台新算出的分数。同一个人同一岗位已存在时不覆盖 */
export function insertJobScore(handle: DatabaseHandle, row: JobScoreRow): void {
  handle.db
    .insert(schema.jobScores)
    .values(row)
    .onConflictDoNothing()
    .run()
}

export function listBookmarks(handle: DatabaseHandle): BookmarkRow[] {
  return handle.db.select().from(schema.jobBookmarks).all()
}

export function listSavedViews(handle: DatabaseHandle): SavedViewRow[] {
  return handle.db.select().from(schema.savedViews).orderBy(schema.savedViews.sort).all()
}

/** 切换收藏：只写关联表，版本号由 service 层统一推进 */
export function setBookmark(handle: DatabaseHandle, jobId: string, saved: boolean): void {
  const { db } = handle
  if (saved) {
    db.insert(schema.jobBookmarks)
      .values({ jobId, createdAt: new Date() })
      .onConflictDoNothing()
      .run()
  } else {
    db.delete(schema.jobBookmarks).where(eq(schema.jobBookmarks.jobId, jobId)).run()
  }
}
