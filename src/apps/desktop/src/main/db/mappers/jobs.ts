import type { JobMatchView, JobView, SavedViewView } from '@core'
import type { BookmarkRow, JobRow, JobScoreRow, SavedViewRow } from '../repositories/jobs.repo'
import { isoOf } from './common'

/**
 * 岗位行 → 读模型。
 * 分数按岗位收进 matches（键为候选人）、收藏收成 Set、来源名查表，
 * 这些拼装都在这里完成，仓储层不掺和。
 */
export function toJobViews(
  rows: JobRow[],
  scores: JobScoreRow[],
  bookmarks: BookmarkRow[],
  sourceName: Map<string, string>,
  now = Date.now()
): JobView[] {
  const byJob = new Map<string, Record<string, JobMatchView>>()
  for (const s of scores) {
    const bucket = byJob.get(s.jobId) ?? {}
    bucket[s.candidateId] = {
      score: s.score,
      verdict: s.verdict,
      reasons: s.reasons,
      gaps: s.gaps
    }
    byJob.set(s.jobId, bucket)
  }
  const saved = new Set(bookmarks.map((b) => b.jobId))

  return rows.map((j) => ({
    id: j.id,
    company: j.company,
    hue: j.companyHue,
    title: j.title,
    city: j.city,
    country: j.country,
    workMode: j.workMode,
    employment: j.employmentType,
    salaryText: j.salaryText,
    sourceId: j.sourceId,
    sourceName: sourceName.get(j.sourceId) ?? j.sourceId,
    region: j.region,
    channel: j.submitChannel,
    postedAt: isoOf(j.postedAt),
    postedHours: Math.max(0, Math.floor((now - j.postedAt.getTime()) / 3_600_000)),
    matches: byJob.get(j.id) ?? {},
    tags: j.tags,
    jdSummary: j.jdSummary,
    responsibilities: j.responsibilities,
    requirements: j.requirements,
    contactEmail: j.contactEmail ?? undefined,
    subjectRule:
      j.subjectRuleRaw && j.subjectRuleTemplate && j.subjectRuleExample
        ? {
            raw: j.subjectRuleRaw,
            template: j.subjectRuleTemplate,
            example: j.subjectRuleExample
          }
        : undefined,
    companyMeta: {
      size: j.companySize,
      stage: j.companyStage,
      industry: j.companyIndustry,
      visa: j.companyVisa
    },
    applicants: j.applicants,
    saved: saved.has(j.id)
  }))
}

/**
 * 收藏视图命中数：条件是保存在 JSON 里的旧结构，岗位最多百级，
 * 用读模型内存过滤比拼动态 SQL 好维护。
 */
export function countViewMatches(
  jobs: JobView[],
  filter: {
    remote?: boolean
    companies?: string[]
    minApplicants?: number
    visa?: boolean
    verdict?: 'auto' | 'confirm' | 'reject'
  }
): number {
  return jobs.filter((j) => {
    if (filter.remote && j.workMode !== 'remote') return false
    if (filter.visa && !j.companyMeta.visa) return false
    if (filter.companies && !filter.companies.includes(j.company)) return false
    if (filter.minApplicants && j.applicants < filter.minApplicants) return false
    if (filter.verdict) {
      const verdicts = Object.values(j.matches).map((m) => m.verdict)
      if (!verdicts.includes(filter.verdict)) return false
    }
    return true
  }).length
}

export function toSavedViewViews(rows: SavedViewRow[], jobs: JobView[]): SavedViewView[] {
  return rows.map((v) => ({ id: v.id, nameKey: v.nameKey, count: countViewMatches(jobs, v.filter) }))
}
