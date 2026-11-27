import { useState } from 'react'
import { ArrowRight, ChevronRight, Clock3, Sparkles, TrendingUp } from 'lucide-react'
import { Mark } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Empty } from '@/components/ui/misc'
import { ScoreRing, Sparkline } from '@/components/ui/viz'
import { useI18n, type TKey, type TParams } from '@/i18n'
import {
  clockLabel,
  dayOffset,
  relativeLabel,
  greetingKey,
  scoreBarClass,
  sourceStateMeta,
  todayLabel,
  verdictMeta,
  weekdayLabel
} from '@/lib/meta'
import { useApp } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Interview, Verdict } from '@core'

interface FunnelStep {
  labelKey: TKey
  value: number
  noteKey: TKey
  noteParams?: TParams
}

/** 日期键：与 metrics 里的 MM-DD 对齐，用来把岗位 / 面试归到某一天 */
const mmdd = (iso: string): string => {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function Donut({ parts }: { parts: { value: number; color: string; label: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1
  const r = 38
  const c = 2 * Math.PI * r
  let offset = 0

  return (
    <svg viewBox="0 0 100 100" className="h-[104px] w-[104px] -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--track)" strokeWidth="10" />
      {parts.map((p) => {
        const len = (p.value / total) * c
        const el = (
          <circle
            key={p.label}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={p.color}
            strokeWidth="10"
            strokeDasharray={`${len} ${c}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        )
        offset += len
        return el
      })}
    </svg>
  )
}

export function Dashboard() {
  const {
    candidate,
    go,
    toast,
    readIds,
    interviewStatus,
    jobs,
    applications,
    conversations,
    interviews,
    sources,
    metrics
  } = useApp()
  const { t, lang } = useI18n()
  const { trend, commTrend } = metrics

  const [queue, setQueue] = useState(() =>
    applications
      .filter((a) => a.status === 'pending_confirm' && a.candidateId === candidate.id)
      .map((a) => a.jobId)
  )

  const scoreOf = (jobId: string) => jobs.find((j) => j.id === jobId)?.matches[candidate.id]?.score ?? 50
  const tierOf = (score: number): Verdict =>
    score >= candidate.thresholds.auto
      ? 'auto'
      : score >= candidate.thresholds.reject
        ? 'confirm'
        : 'reject'

  const pool = jobs.map((j) => ({ job: j, score: j.matches[candidate.id]?.score ?? 50 }))
  const auto = pool.filter((p) => p.score >= candidate.thresholds.auto)
  const confirm = pool.filter(
    (p) => p.score >= candidate.thresholds.reject && p.score < candidate.thresholds.auto
  )
  const reject = pool.filter((p) => p.score < candidate.thresholds.reject)
  const total = pool.length

  const topJobs = [...pool].sort((a, b) => b.score - a.score).slice(0, 5)
  const maxFound = Math.max(1, ...trend.map((row) => row.found))

  // ---------------------------------------------------------------- 今日口径
  // 「今日流水」按岗位发布日与投递时间落在今天来算，不再写死数字
  const todayJobs = jobs.filter((j) => dayOffset(j.postedAt) === 0)
  const ydayJobs = jobs.filter((j) => dayOffset(j.postedAt) === -1)
  const todayApps = applications.filter((a) => dayOffset(a.submittedAt) === 0)
  const todayAutoApps = todayApps.filter((a) => tierOf(scoreOf(a.jobId)) === 'auto').length

  // ---------------------------------------------------------------- 沟通与面试
  // 全部从既有数据算出来，不另立一份写死的数字，避免和对应页面打架
  const now = Date.now()
  const ivStatus = (i: Interview) => interviewStatus[i.id] ?? i.status
  const endOf = (i: Interview) => new Date(i.startsAt).getTime() + i.durationMin * 60_000

  /** 还没答复完、时间也没过的邀约，才算「待进行」 */
  const live = interviews.filter((i) => {
    const st = ivStatus(i)
    return st !== 'done' && st !== 'declined' && st !== 'cancelled' && endOf(i) > now
  })

  const unreadTotal = conversations.reduce(
    (n, c) => n + (readIds.includes(c.id) ? 0 : c.unread),
    0
  )
  const unreadThreads = conversations.filter((c) => c.unread > 0 && !readIds.includes(c.id))
  const todayReplies = conversations.reduce(
    (n, c) => n + c.messages.filter((m) => m.dir === 'in' && dayOffset(m.at) === 0).length,
    0
  )
  const pendingInvites = interviews.filter((i) => ivStatus(i) === 'invited').length

  // 未来 7 天，今天算第 0 天
  const schedule = Array.from({ length: 7 }, (_, d) => {
    const rows = live.filter((i) => dayOffset(i.startsAt) === d)
    return { d, rows, count: rows.length }
  })
  const maxDay = Math.max(1, ...schedule.map((col) => col.count))
  const inWindow = schedule.reduce((n, col) => n + col.count, 0)

  /** 冲突只按求职者算：帮不同人投的，同一时段面试是常态，不该报警 */
  const conflicts: { a: Interview; b: Interview }[] = []
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i]
      const b = live[j]
      if (a.candidateId !== b.candidateId) continue
      if (new Date(a.startsAt).getTime() < endOf(b) && new Date(b.startsAt).getTime() < endOf(a)) {
        conflicts.push({ a, b })
      }
    }
  }
  const conflictIds = new Set(conflicts.flatMap((c) => [c.a.id, c.b.id]))
  const nextUp =
    [...live].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0] ??
    null

  const commIn = commTrend.reduce((n, r) => n + r.in, 0)
  const commOut = commTrend.reduce((n, r) => n + r.out, 0)
  const commMax = Math.max(1, ...commTrend.map((r) => r.in + r.out))

  const dayName = (d: number) => {
    if (d === 0) return t('time.today')
    if (d === 1) return t('interviews.dayTomorrow')
    const dt = new Date()
    dt.setDate(dt.getDate() + d)
    return weekdayLabel(lang, dt.toISOString())
  }

  const countdown = (iso: string) => {
    const min = Math.round((new Date(iso).getTime() - Date.now()) / 60_000)
    if (min <= 0) return t('interviews.countdownNow')
    if (min < 60) return t('interviews.countdownMinutes', { n: min })
    const hours = Math.round(min / 60)
    if (hours < 24) return t('interviews.countdownHours', { n: hours })
    return t('interviews.countdownDays', { n: Math.round(hours / 24) })
  }

  const jobOf = (id: string) => jobs.find((j) => j.id === id)

  const statColor: Record<string, string> = {
    found: 'var(--accent)',
    confirm: 'var(--warning)',
    sent: 'var(--success)',
    reject: 'var(--muted-bar)',
    replies: 'var(--accent)',
    invites: 'var(--warning)'
  }

  /**
   * 指标卡的迷你走势。近 7 天的抓取 / 匹配 / 投递来自 metrics，
   * 拒绝与面试按发布日、开始日归到同一组日期键上，保证横轴对齐。
   */
  const sparkOf = (key: string): number[] => {
    if (key === 'found') return trend.map((r) => r.found)
    if (key === 'confirm') return trend.map((r) => r.matched)
    if (key === 'sent') return trend.map((r) => r.sent)
    if (key === 'replies') return commTrend.map((r) => r.in)
    if (key === 'reject')
      return trend.map(
        (r) =>
          jobs.filter((j) => mmdd(j.postedAt) === r.day && tierOf(scoreOf(j.id)) === 'reject').length
      )
    if (key === 'invites')
      return trend.map((r) => interviews.filter((i) => mmdd(i.startsAt) === r.day).length)
    return []
  }

  const foundDelta = todayJobs.length - ydayJobs.length
  const syncedMin = sources.reduce((min, s) => {
    if (!s.lastRunAt) return min
    const m = Math.round((now - new Date(s.lastRunAt).getTime()) / 60_000)
    return m < min ? m : min
  }, Number.POSITIVE_INFINITY)

  const statCards: {
    key: string
    labelKey: TKey
    value: number
    delta: string
    deltaTone: 'up' | 'warn' | 'muted'
    hintKey: TKey
    hintParams?: TParams
  }[] = [
    {
      key: 'found',
      labelKey: 'dashboard.statFound',
      value: todayJobs.length,
      delta: `${foundDelta >= 0 ? '+' : ''}${foundDelta}`,
      deltaTone: foundDelta > 0 ? 'up' : 'muted',
      hintKey: 'dashboard.statFoundHint',
      hintParams: { n: ydayJobs.length }
    },
    {
      key: 'confirm',
      labelKey: 'dashboard.statConsider',
      value: confirm.length,
      delta: '',
      deltaTone: 'muted',
      hintKey: 'dashboard.statConsiderHint'
    },
    {
      key: 'sent',
      labelKey: 'dashboard.statSent',
      value: todayApps.length,
      delta: '',
      deltaTone: 'muted',
      hintKey: 'dashboard.statSentHint',
      hintParams: { auto: todayAutoApps }
    },
    {
      key: 'reject',
      labelKey: 'dashboard.statReject',
      value: reject.length,
      delta: '—',
      deltaTone: 'muted',
      hintKey: 'dashboard.statRejectHint'
    },
    {
      key: 'replies',
      labelKey: 'dashboard.statReplies',
      value: todayReplies,
      delta: unreadTotal ? t('dashboard.statRepliesDelta', { n: unreadTotal }) : '',
      deltaTone: 'warn',
      hintKey: 'dashboard.statRepliesHint',
      hintParams: { n: unreadThreads.length }
    },
    {
      key: 'invites',
      labelKey: 'dashboard.statInvites',
      value: pendingInvites,
      delta: '',
      deltaTone: 'muted',
      hintKey: 'dashboard.statInvitesHint',
      hintParams: { n: inWindow }
    }
  ]

  const tiers = [
    { key: 'auto' as const, count: auto.length, bar: 'bg-accent', text: 'text-accent' },
    { key: 'confirm' as const, count: confirm.length, bar: 'bg-warning', text: 'text-warning' },
    { key: 'reject' as const, count: reject.length, bar: 'bg-surface-4', text: 'text-fg-subtle' }
  ]

  /**
   * 岗位池分层。
   *
   * 原来这块是「今日流水」漏斗，数字写死在 mock 里所以能严格递减。
   * 接上真实数据后，同一天抓到的岗位往往都过了筛选，逐级递减不再成立，
   * 于是改成「各阶段现存多少」——数字是什么就画什么，不为了好看造台阶。
   */
  const hardFiltered = jobs.filter(
    (j) => !j.tags.includes('外包') && !j.tags.includes('驻场')
  )
  const appliedJobIds = new Set(applications.map((a) => a.jobId))

  const funnel: FunnelStep[] = [
    {
      labelKey: 'dashboard.funnelFetched',
      value: jobs.length,
      noteKey: 'dashboard.funnelFetchedNote',
      noteParams: { n: sources.filter((s) => s.enabled).length }
    },
    {
      labelKey: 'dashboard.funnelDeduped',
      value: jobs.length,
      noteKey: 'dashboard.funnelDedupedNote',
      noteParams: { n: 0 }
    },
    {
      labelKey: 'dashboard.funnelFiltered',
      value: hardFiltered.length,
      noteKey: 'dashboard.funnelFilteredNote'
    },
    {
      labelKey: 'dashboard.funnelConsider',
      value: confirm.length + auto.length,
      noteKey: 'dashboard.funnelConsiderNote'
    },
    {
      labelKey: 'dashboard.funnelApplied',
      value: appliedJobIds.size,
      noteKey: 'dashboard.funnelAppliedNote',
      noteParams: {
        auto: [...appliedJobIds].filter((id) => tierOf(scoreOf(id)) === 'auto').length,
        manual: [...appliedJobIds].filter((id) => tierOf(scoreOf(id)) !== 'auto').length
      }
    }
  ]
  const funnelMax = Math.max(1, ...funnel.map((f) => f.value))

  const act = (label: string) => toast(label, 'success')

  return (
    <div className="h-full overflow-y-auto [scrollbar-gutter:stable]">
      <div className="page-enter mx-auto w-full max-w-[1180px] px-6 py-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-[16px] font-medium tracking-[-0.01em]">
              {t('dashboard.greetingLine', { greeting: t(greetingKey()), name: candidate.name })}
            </h2>
            <Badge tone="neutral">{candidate.headline}</Badge>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-fg-subtle">
            <span>{todayLabel(lang)}</span>
            <span className="h-2.5 w-px bg-line-strong" />
            <span>
              {t('dashboard.autoThresholdLine', {
                auto: candidate.thresholds.auto,
                reject: candidate.thresholds.reject
              })}
            </span>
            <span className="h-2.5 w-px bg-line-strong" />
            <span className="flex items-center gap-1">
              <Clock3 size={10} />
              {Number.isFinite(syncedMin)
                ? t('dashboard.syncedAgo', { n: syncedMin })
                : t('dashboard.syncedAgo', { n: 0 })}
            </span>
          </div>
        </div>
        <Button variant="primary" size="sm" className="gap-1.5" onClick={() => go('jobs')}>
          {t('dashboard.processQueue', { n: queue.length })}
          <ArrowRight size={12.5} />
        </Button>
      </div>

      {/* 指标卡：前四张是岗位侧的流水，后两张接沟通与面试 */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((s) => (
          <Card key={s.key} className="group relative overflow-hidden px-3.5 py-3">
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 truncate text-[11px] text-fg-muted" title={t(s.labelKey)}>
                {t(s.labelKey)}
              </span>
              <Sparkline data={sparkOf(s.key)} color={statColor[s.key]} />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="tnum text-[26px] font-medium leading-none tracking-[-0.02em]">
                {s.value}
              </span>
              {s.delta ? (
                <span
                  className={cn(
                    'truncate text-[10.5px]',
                    s.deltaTone === 'up'
                      ? 'text-success'
                      : s.deltaTone === 'warn'
                        ? 'text-warning'
                        : 'text-fg-subtle'
                  )}
                >
                  {s.delta}
                </span>
              ) : null}
            </div>
            <div
              className="mt-1.5 truncate text-[10.5px] text-fg-subtle"
              title={t(s.hintKey, s.hintParams)}
            >
              {t(s.hintKey, s.hintParams)}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-2.5 grid grid-cols-[1.5fr_1fr] gap-2.5">
        {/* 待确认队列 */}
        <Card className="flex flex-col">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                {t('dashboard.queueTitle')}
                <Badge tone="warning">{queue.length}</Badge>
              </span>
            }
            subtitle={t('dashboard.queueSubtitle')}
            action={
              <Button
                variant="ghost"
                size="xs"
                disabled={queue.length === 0}
                onClick={() => {
                  setQueue([])
                  act(t('dashboard.toastConfirmedAll', { n: 3 }))
                }}
              >
                {t('dashboard.queueConfirmAll')}
              </Button>
            }
          />
          <div className="flex-1 divide-y divide-line">
            {queue.length === 0 ? (
              <Empty title={t('dashboard.queueEmpty')} hint={t('dashboard.queueEmptyHint')} />
            ) : (
              queue.slice(0, 4).map((jobId) => {
                const job = jobs.find((j) => j.id === jobId)
                if (!job) return null
                const score = job.matches[candidate.id]?.score ?? 50
                return (
                  <div key={jobId} className="flex items-center gap-3 px-4 py-2.5">
                    <Mark text={job.company} hue={job.hue} size={26} />
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => go('jobs', job.id)}
                        className="block max-w-full truncate text-left text-[12px] text-fg hover:text-accent-strong"
                      >
                        {job.title}
                      </button>
                      <div className="mt-0.5 truncate text-[10.5px] text-fg-subtle">
                        {job.company} · {job.city} · {job.salaryText}
                      </div>
                    </div>
                    <ScoreRing
                      score={score}
                      size={30}
                      auto={candidate.thresholds.auto}
                      reject={candidate.thresholds.reject}
                    />
                    <div className="flex items-center gap-1">
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => {
                          setQueue((q) => q.filter((id) => id !== jobId))
                          act(t('dashboard.toastConfirmedOne', { company: job.company, title: job.title }))
                        }}
                      >
                        {t('common.confirm')}
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          setQueue((q) => q.filter((id) => id !== jobId))
                          toast(t('dashboard.toastSkipped'), 'default')
                        }}
                      >
                        {t('dashboard.queueSkip')}
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <div className="flex items-center gap-1.5 border-t border-line px-4 py-2 text-[10px] text-fg-subtle">
            <Clock3 size={10} className="shrink-0" />
            {t('dashboard.queueRule', { auto: candidate.thresholds.auto })}
          </div>
        </Card>

        {/* 匹配分布 */}
        <Card>
          <CardHeader
            title={t('dashboard.matchDistTitle')}
            subtitle={t('dashboard.matchDistSubtitle', { n: total })}
          />
          <div className="flex items-center gap-4 px-4 pb-3 pt-1">
            <Donut
              parts={[
                { value: auto.length, color: 'var(--accent)', label: 'auto' },
                { value: confirm.length, color: 'var(--warning)', label: 'confirm' },
                { value: reject.length, color: 'var(--soft-bar)', label: 'reject' }
              ]}
            />
            <div className="min-w-0 flex-1 space-y-2">
              {tiers.map((tier) => (
                <div key={tier.key}>
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-fg-muted">
                      <span className={cn('h-1.5 w-1.5 rounded-full', tier.bar)} />
                      {t(verdictMeta[tier.key].labelKey)}
                    </span>
                    <span className="tnum text-fg">{tier.count}</span>
                  </div>
                  <div className="mt-1">
                    <div className="h-[3px] w-full overflow-hidden rounded-full bg-surface-3">
                      <div
                        className={cn('h-full rounded-full', tier.bar)}
                        style={{ width: `${(tier.count / total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-1 text-[10px] leading-relaxed text-fg-subtle">
                {t('dashboard.matchDistNote')}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-2.5 grid grid-cols-[1.5fr_1fr] gap-2.5">
        {/* 漏斗 */}
        <Card>
          <CardHeader
            title={t('dashboard.funnelTitle')}
            subtitle={t('dashboard.funnelSubtitle')}
            action={<Badge tone="neutral">{trend[trend.length - 1]?.day ?? ''}</Badge>}
          />
          <div className="space-y-2 px-4 pb-3.5 pt-1">
            {funnel.map((f, i) => {
              const pct = (f.value / funnelMax) * 100
              return (
                <div key={f.labelKey} className="flex items-center gap-2.5">
                  <span className="w-[68px] shrink-0 truncate text-[11px] text-fg-muted">
                    {t(f.labelKey)}
                  </span>
                  <div className="relative h-4 flex-1 overflow-hidden rounded bg-surface-2">
                    <div
                      className={cn(
                        'h-full rounded',
                        i === 5 ? 'bg-success/70' : i >= 4 ? 'bg-accent/70' : 'bg-accent/25'
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="tnum w-7 shrink-0 text-right text-[11.5px] text-fg">{f.value}</span>
                  <span className="w-[136px] shrink-0 truncate text-[10px] text-fg-subtle">
                    {t(f.noteKey, f.noteParams)}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* 趋势 */}
        <Card>
          <CardHeader
            title={t('dashboard.trendTitle')}
            subtitle={t('dashboard.trendSubtitle')}
            action={
              <span
                className={cn(
                  'flex items-center gap-1 text-[10.5px]',
                  foundDelta >= 0 ? 'text-success' : 'text-danger'
                )}
              >
                <TrendingUp size={11} />
                {t('dashboard.trendFetched')} {trend.reduce((n, r) => n + r.found, 0)}
              </span>
            }
          />
          <div className="px-4 pb-2">
            <div className="flex h-[104px] items-end gap-1.5">
              {trend.map((row) => (
                <div key={row.day} className="group flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-[88px] w-full items-end justify-center gap-[3px]">
                    {[
                      {
                        v: row.found,
                        cls: 'bg-soft-bar group-hover:bg-soft-bar-hover',
                        title: `${t('dashboard.trendFetched')} ${row.found}`
                      },
                      {
                        v: row.matched,
                        cls: 'bg-accent/85',
                        title: `${t('dashboard.trendMatched')} ${row.matched}`
                      },
                      {
                        v: row.sent,
                        cls: 'bg-warning/85',
                        title: `${t('dashboard.trendApplied')} ${row.sent}`
                      }
                    ].map((b, bi) => (
                      <div
                        key={bi}
                        title={b.title}
                        className={cn('w-[5px] rounded-t-[2px] transition-all', b.cls)}
                        style={{ height: `${Math.max(3, (b.v / maxFound) * 88)}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-[9.5px] text-fg-subtle">
                    {row.day === 'today' ? t('time.today') : row.day}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-3 border-t border-line pt-2 text-[10px] text-fg-subtle">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-sm bg-soft-bar" />
                {t('dashboard.trendFetched')}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-sm bg-accent/85" />
                {t('dashboard.trendMatched')}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-sm bg-warning/85" />
                {t('dashboard.trendApplied')}
              </span>
              <span className="ml-auto truncate">{t('dashboard.trendNote')}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-2.5 grid grid-cols-[1.5fr_1fr] gap-2.5">
        {/* 沟通动态：收到向上、发出向下，一眼能看出球在谁那边 */}
        <Card>
          <CardHeader
            title={t('dashboard.commTitle')}
            subtitle={t('dashboard.commSubtitle')}
            action={
              <Button variant="ghost" size="xs" className="gap-0.5" onClick={() => go('messages')}>
                {t('dashboard.commViewAll')}
                <ChevronRight size={11} />
              </Button>
            }
          />
          <div className="px-4 pb-3 pt-1">
            <div className="flex h-[96px] items-end gap-1.5">
              {commTrend.map((r) => (
                <div key={r.day} className="group flex flex-1 flex-col items-center justify-end gap-1">
                  <div
                    title={`${t('dashboard.commIn')} ${r.in} · ${t('dashboard.commOut')} ${r.out}`}
                    className="flex w-full max-w-[26px] flex-col-reverse overflow-hidden rounded-t-[2px]"
                  >
                    <div
                      className="w-full bg-accent/85 transition-all"
                      style={{ height: `${(r.in / commMax) * 76}px` }}
                    />
                    <div
                      className="w-full bg-success/70 transition-all group-hover:bg-success"
                      style={{ height: `${(r.out / commMax) * 76}px` }}
                    />
                  </div>
                  <span className="text-[9.5px] text-fg-subtle">
                    {r.day === 'today' ? t('time.today') : r.day}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-3 border-t border-line pt-2 text-[10px] text-fg-subtle">
              <span className="flex shrink-0 items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-sm bg-accent/85" />
                {t('dashboard.commIn')}
                <span className="tnum text-fg-muted">{commIn}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-sm bg-success/70" />
                {t('dashboard.commOut')}
                <span className="tnum text-fg-muted">{commOut}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                {t('dashboard.commUnread')}
                <span className="tnum text-fg-muted">{unreadTotal}</span>
              </span>
              <span className="ml-auto min-w-0 truncate" title={t('dashboard.commNote')}>
                {t('dashboard.commNote')}
              </span>
            </div>
          </div>
        </Card>

        {/* 未来 7 天面试：柱高是场次，同一位求职者撞时间的天标黄 */}
        <Card className="flex flex-col">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                {t('dashboard.schedTitle')}
                {conflicts.length > 0 ? (
                  <Badge tone="warning">
                    <span title={t('dashboard.schedNote')}>
                      {t('dashboard.schedConflict', { n: conflicts.length })}
                    </span>
                  </Badge>
                ) : null}
              </span>
            }
            subtitle={t('dashboard.schedSubtitle', { n: inWindow })}
            action={
              <Button
                variant="ghost"
                size="xs"
                className="gap-0.5"
                onClick={() => go('interviews')}
              >
                {t('dashboard.schedNav')}
                <ChevronRight size={11} />
              </Button>
            }
          />
          <div className="flex items-end gap-1 px-4 pt-1.5">
            {schedule.map((col) => {
              const hasConflict = col.rows.some((r) => conflictIds.has(r.id))
              return (
                <div key={col.d} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <div className="flex h-[64px] w-full flex-col items-center justify-end">
                    {col.count > 0 ? (
                      <span className="tnum mb-1 text-[9.5px] text-fg-subtle">{col.count}</span>
                    ) : (
                      <span className="mb-1 h-[9px]" />
                    )}
                    <div
                      className={cn(
                        'w-full max-w-[22px] rounded-t-[2px]',
                        col.count === 0
                          ? 'bg-surface-3'
                          : hasConflict
                            ? 'bg-warning/85'
                            : 'bg-accent/70'
                      )}
                      style={{
                        height: `${col.count === 0 ? 2 : Math.max(8, (col.count / maxDay) * 52)}px`
                      }}
                    />
                  </div>
                  <span
                    className={cn(
                      'whitespace-nowrap text-[9.5px]',
                      hasConflict ? 'text-warning' : 'text-fg-subtle'
                    )}
                  >
                    {dayName(col.d)}
                  </span>
                </div>
              )
            })}
          </div>

          {nextUp ? (
            <button
              onClick={() => go('interviews')}
              className="mt-2 flex w-full items-center gap-2 border-t border-line px-4 py-2 text-left transition-colors hover:bg-surface-2"
            >
              <span className="shrink-0 text-[10px] text-fg-subtle">{t('dashboard.schedNext')}</span>
              <Mark
                text={jobOf(nextUp.jobId)?.company ?? ''}
                hue={jobOf(nextUp.jobId)?.hue ?? 220}
                size={18}
              />
              <span className="min-w-0 flex-1 truncate text-[11px] text-fg">
                {jobOf(nextUp.jobId)?.title}
              </span>
              <span className="tnum hidden shrink-0 whitespace-nowrap text-[10px] text-fg-muted sm:inline">
                {clockLabel(lang, nextUp.startsAt)}
              </span>
              <span className="shrink-0 whitespace-nowrap rounded bg-surface-3 px-1.5 py-0.5 text-[9.5px] text-fg-subtle">
                {countdown(nextUp.startsAt)}
              </span>
            </button>
          ) : (
            <div className="mt-2 border-t border-line px-4 py-3 text-center text-[10.5px] text-fg-subtle">
              {t('dashboard.schedEmpty')}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-2.5 grid grid-cols-[1.5fr_1fr] gap-2.5">
        {/* 高分岗位 */}
        <Card>
          <CardHeader
            title={t('dashboard.topJobsTitle')}
            subtitle={t('dashboard.topJobsSubtitle', { name: candidate.name })}
            action={
              <Button variant="ghost" size="xs" className="gap-0.5" onClick={() => go('jobs')}>
                {t('common.viewAll')}
                <ChevronRight size={11} />
              </Button>
            }
          />
          <div className="divide-y divide-line">
            {topJobs.map(({ job, score }) => (
              <button
                key={job.id}
                onClick={() => go('jobs', job.id)}
                className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-surface-2"
              >
                <Mark text={job.company} hue={job.hue} size={24} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] text-fg">{job.title}</div>
                  <div className="truncate text-[10.5px] text-fg-subtle">
                    {job.company} · {job.city} · {job.salaryText}
                  </div>
                </div>
                <div className="flex w-16 items-center gap-1.5">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className={cn('h-full rounded-full', scoreBarClass(score, candidate.thresholds))}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className="tnum text-[11px] text-fg-muted">{score}</span>
                </div>
                <Badge tone={verdictMeta[tierOf(score)].tone}>
                  {t(verdictMeta[tierOf(score)].labelKey)}
                </Badge>
              </button>
            ))}
          </div>
        </Card>

        {/* 渠道状态 */}
        <Card className="flex flex-col">
          <CardHeader
            title={t('dashboard.sourceStatusTitle')}
            subtitle={t('dashboard.sourceStatusSubtitle')}
            action={<Sparkles size={12} className="text-fg-subtle" />}
          />
          <div className="flex-1 divide-y divide-line">
            {sources.map((s) => {
              const meta = sourceStateMeta[s.state]
              return (
                <div key={s.id} className="flex items-center gap-2 px-4 py-[7px]">
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', meta.dot)} />
                  <span className="min-w-0 flex-1 truncate text-[11.5px] text-fg">{s.name}</span>
                  <span className="tnum shrink-0 text-[10px] text-fg-subtle">
                    {t('dashboard.sourceFound', { n: s.found })}
                  </span>
                  <span className="w-14 shrink-0 text-right text-[10px] text-fg-subtle">
                    {s.state === 'error'
                      ? t('dashboard.sourceNeedLogin')
                      : s.nextRunAt
                        ? relativeLabel(lang, s.nextRunAt)
                        : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
      </div>
    </div>
  )
}
