import type { InterviewView } from '@core'
import type { InterviewerRow, InterviewRow } from '../repositories/interviews.repo'
import { iso } from './common'

/** 面试 + 面试官 → 读模型，面试官按面试分组 */
export function toInterviewViews(
  rows: InterviewRow[],
  people: InterviewerRow[]
): InterviewView[] {
  const byItv = new Map<string, { name: string; title: string }[]>()
  for (const p of people) {
    const list = byItv.get(p.interviewId) ?? []
    list.push({ name: p.name, title: p.title })
    byItv.set(p.interviewId, list)
  }

  return rows.map((i) => ({
    id: i.id,
    jobId: i.jobId,
    candidateId: i.candidateId,
    sourceId: i.sourceId,
    conversationId: i.conversationId ?? undefined,
    round: i.round,
    roundIndex: i.roundIndex,
    roundTotal: i.roundTotal,
    status: i.status,
    startsAt: i.startsAt.toISOString(),
    durationMin: i.durationMin,
    format: i.format,
    place: i.place,
    interviewers: byItv.get(i.id) ?? [],
    invitedAt: i.invitedAt.toISOString(),
    replyBy: iso(i.replyBy),
    note: i.note
  }))
}
