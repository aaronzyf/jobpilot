import type { ApplicationView } from '@core'
import type { ApplicationLogRow, ApplicationRow } from '../repositories/applications.repo'
import { isoOf } from './common'

/** 投递行 + 日志行 → 读模型，日志按 applicationId 分组 */
export function toApplicationViews(
  rows: ApplicationRow[],
  logs: ApplicationLogRow[]
): ApplicationView[] {
  const byApp = new Map<string, typeof logs>()
  for (const l of logs) {
    const list = byApp.get(l.applicationId) ?? []
    list.push(l)
    byApp.set(l.applicationId, list)
  }

  return rows.map((a) => ({
    id: a.id,
    jobId: a.jobId,
    candidateId: a.candidateId,
    channel: a.channel,
    status: a.status,
    submittedAt: isoOf(a.submittedAt),
    score: a.score,
    resumeSnapshot: a.resumeSnapshot,
    subject: a.subject ?? undefined,
    body: a.body ?? undefined,
    to: a.toEmail ?? undefined,
    subjectRuleOk: a.subjectRuleOk ?? undefined,
    error: a.error ?? undefined,
    logs: (byApp.get(a.id) ?? []).map((l) => ({
      at: isoOf(l.at),
      label: l.label,
      detail: l.detail
    }))
  }))
}
