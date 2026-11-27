import type { CandidateStats, CandidateView } from '@core'
import type {
  ApplicationAggregateRow,
  CandidateRow,
  InterviewAggregateRow
} from '../repositories/candidates.repo'

/** 从投递与面试明细现算每个候选人的统计，不落冗余列 */
export function candidateStatsOf(
  apps: ApplicationAggregateRow[],
  ivs: InterviewAggregateRow[],
  now = Date.now()
): Map<string, CandidateStats> {
  const map = new Map<string, CandidateStats>()
  const slot = (id: string) => {
    const cur = map.get(id) ?? { applied: 0, replied: 0, pending: 0, interview: 0 }
    map.set(id, cur)
    return cur
  }

  for (const a of apps) {
    const s = slot(a.candidateId)
    s.applied += 1
    if (a.status === 'replied') s.replied += 1
    if (a.status === 'pending_confirm') s.pending += 1
  }
  for (const i of ivs) {
    const end = i.startsAt.getTime() + i.durationMin * 60_000
    const open = i.status === 'invited' || i.status === 'accepted' || i.status === 'rescheduled'
    if (open && end > now) slot(i.candidateId).interview += 1
  }
  return map
}

export function toCandidateViews(
  rows: CandidateRow[],
  stats: Map<string, CandidateStats>
): CandidateView[] {
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    headline: c.headline,
    years: c.years,
    location: c.location,
    hue: c.hue,
    resumeFile: c.resumeFile,
    resumeUpdatedAt: c.resumeUpdatedAt.toISOString(),
    resumePages: c.resumePages,
    email: c.email,
    smtp:
      c.smtpHost && c.smtpPort
        ? { host: c.smtpHost, port: c.smtpPort, verified: c.smtpVerified }
        : null,
    note: c.note,
    languages: c.languages,
    thresholds: { auto: c.thresholdAuto, reject: c.thresholdReject },
    dailyCap: c.dailyCap,
    stats: stats.get(c.id) ?? { applied: 0, replied: 0, pending: 0, interview: 0 },
    resumeFacts: {
      projects: c.factProjects,
      experiences: c.factExperiences,
      skills: c.factSkills
    }
  }))
}
