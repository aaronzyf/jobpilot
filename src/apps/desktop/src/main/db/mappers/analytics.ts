import type {
  CommTrendPointView,
  HourlyPointView,
  LlmUsageView,
  MetricsView,
  TrendPointView
} from '@core'
import type {
  AutoScoreRow,
  DiscoveredRow,
  LlmUsageRow,
  MessageAtRow,
  SubmittedRow
} from '../repositories/analytics.repo'
import { dayKey, lastDays } from './common'

export const EMPTY_METRICS: MetricsView = { trend: [], commTrend: [], hourly: [] }

/** 近 7 天抓取 / 匹配 / 投递 + 沟通量 + 今日小时分布，全部由明细现算 */
export function toMetrics(
  jobs: DiscoveredRow[],
  autoScores: AutoScoreRow[],
  submissions: SubmittedRow[],
  messages: MessageAtRow[]
): MetricsView {
  const days = lastDays(7)
  const autoJobIds = new Set(autoScores.map((r) => r.jobId))

  const trend: TrendPointView[] = days.map((d) => {
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const inDay = (t: Date) => t >= d && t < next
    const jobsToday = jobs.filter((r) => inDay(r.discoveredAt))
    return {
      day: dayKey(d).slice(5),
      found: jobsToday.length,
      matched: jobsToday.filter((r) => autoJobIds.has(r.id)).length,
      sent: submissions.filter((r) => inDay(r.submittedAt)).length
    }
  })

  const commTrend: CommTrendPointView[] = days.map((d) => {
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const inDay = messages.filter((r) => r.at >= d && r.at < next)
    return {
      day: dayKey(d).slice(5),
      in: inDay.filter((r) => r.dir === 'in').length,
      out: inDay.filter((r) => r.dir === 'out').length
    }
  })

  // 今日按小时的抓取量，只取 08–18，与界面横轴对齐
  const todayKey = dayKey(new Date())
  const hourly: HourlyPointView[] = Array.from({ length: 11 }, (_, i) => {
    const h = i + 8
    const n = jobs.filter(
      (r) => dayKey(r.discoveredAt) === todayKey && r.discoveredAt.getHours() === h
    ).length
    return { h: String(h).padStart(2, '0'), n }
  })

  return { trend, commTrend, hourly }
}

export function toLlmUsageViews(rows: LlmUsageRow[]): LlmUsageView[] {
  return rows.map((u) => ({
    labelKey: u.scene,
    model: u.model,
    calls: u.calls,
    cost: `¥${(u.costCents / 100).toFixed(2)}`
  }))
}
