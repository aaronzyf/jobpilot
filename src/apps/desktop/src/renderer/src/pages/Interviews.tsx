import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  CalendarPlus,
  Check,
  Copy,
  MapPin,
  MessagesSquare,
  Phone,
  Repeat2,
  TriangleAlert,
  Video,
  X
} from 'lucide-react'
import { Mark, PersonAvatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form'
import { Empty, KeyValue } from '@/components/ui/misc'
import { Checkbox, Segmented } from '@/components/ui/switch'
import { useI18n, type TKey } from '@/i18n'
import {
  clockLabel,
  dateLineLabel,
  dayOffset,
  interviewFormatMeta,
  interviewRoundMeta,
  interviewStatusMeta,
  relativeLabel
} from '@/lib/meta'
import { useApp } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Interview, InterviewFormat, InterviewStatus } from '@core'

type Tab = 'all' | 'invited' | 'upcoming' | 'past'

const startOf = (i: Interview) => new Date(i.startsAt).getTime()
const endOf = (i: Interview) => startOf(i) + i.durationMin * 60_000

/** 已答复为「不再发生」的状态；时间过了但没人改状态时也归到这里 */
const settled = (status: InterviewStatus, i: Interview) =>
  status === 'done' || status === 'declined' || status === 'cancelled' || endOf(i) < Date.now()

const statusNoteKey: Record<InterviewStatus, TKey> = {
  invited: 'interviews.statusNoteInvited',
  accepted: 'interviews.statusNoteAccepted',
  rescheduled: 'interviews.statusNoteRescheduled',
  declined: 'interviews.statusNoteDeclined',
  done: 'interviews.statusNoteDone',
  cancelled: 'interviews.statusNoteCancelled'
}

/** 面试前要确认的三件事。清单本身与语言无关，勾选状态只存在本次会话里 */
const prepKeys: TKey[] = ['interviews.prep1', 'interviews.prep2', 'interviews.prep3']

const formatIcon: Record<InterviewFormat, typeof Video> = {
  video: Video,
  onsite: MapPin,
  phone: Phone
}

/** 面试官没有配色的来源，用名字散列出一个稳定色相 */
function hueOf(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return h
}

export function Interviews() {
  const {
    go,
    toast,
    interviewStatus,
    setInterviewStatus,
    interviews,
    candidates,
    jobs,
    sources,
    setViewFilter,
    filterIds
  } = useApp()
  const { lang, t } = useI18n()

  const jobTitle = (jobId: string): string => {
    const job = jobs.find((j) => j.id === jobId)
    return job ? `${job.company} · ${job.title}` : jobId
  }

  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const [prep, setPrep] = useState<Record<string, boolean>>({})
  const [selectedId, setSelectedId] = useState(
    () => (interviews.find((i) => i.status === 'invited') ?? interviews[0])?.id ?? ''
  )

  // 标签与搜索都下发到主进程，重新执行带条件的查询
  useEffect(() => {
    setViewFilter({ tab, q })
  }, [tab, q, setViewFilter])

  const statusOf = (i: Interview): InterviewStatus => interviewStatus[i.id] ?? i.status

  /** 待排前面（近的在上），已结束的沉到底部（近的在上） */
  const ordered = useMemo(
    () =>
      [...interviews].sort((a, b) => {
        const sa = settled(interviewStatus[a.id] ?? a.status, a)
        const sb = settled(interviewStatus[b.id] ?? b.status, b)
        if (sa !== sb) return sa ? 1 : -1
        return sa ? endOf(b) - endOf(a) : startOf(a) - startOf(b)
      }),
    [interviewStatus]
  )

  /**
   * 同一个人同一时间段只能在一场面试里。
   * 跨求职者不算冲突——那正是「帮别人投」的常态，两场可以同时进行。
   */
  const pairs = useMemo(() => {
    const active = interviews.filter((i) => !settled(interviewStatus[i.id] ?? i.status, i))
    const out: { a: Interview; b: Interview; minutes: number }[] = []
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i]
        const b = active[j]
        if (a.candidateId !== b.candidateId) continue
        const overlap = Math.min(endOf(a), endOf(b)) - Math.max(startOf(a), startOf(b))
        if (overlap > 0) out.push({ a, b, minutes: Math.round(overlap / 60_000) })
      }
    }
    return out
  }, [interviewStatus])

  const conflictOf = (id: string) => pairs.find((p) => p.a.id === id || p.b.id === id)

  const matches = (i: Interview, which: Tab) => {
    const st = statusOf(i)
    if (which === 'invited') return st === 'invited'
    if (which === 'upcoming') return !settled(st, i) && st !== 'invited'
    if (which === 'past') return settled(st, i)
    return true
  }

  const rows = ordered.filter((i) => {
    if (filterIds !== null && !filterIds.includes(i.id)) return false
    if (!matches(i, tab)) return false
    if (!q.trim()) return true
    const job = jobs.find((j) => j.id === i.jobId)
    const cand = candidates.find((c) => c.id === i.candidateId)
    const hay =
      `${job?.title ?? ''} ${job?.company ?? ''} ${cand?.name ?? ''} ${i.interviewers
        .map((p) => `${p.name} ${p.title}`)
        .join(' ')}`.toLowerCase()
    return hay.includes(q.trim().toLowerCase())
  })

  /** 按本地日历分组，避免直接用 ISO 的 UTC 日期切开 */
  const groups = useMemo(() => {
    const out: { key: string; iso: string; items: Interview[] }[] = []
    for (const i of rows) {
      const d = new Date(i.startsAt)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      const last = out[out.length - 1]
      if (last && last.key === key) last.items.push(i)
      else out.push({ key, iso: i.startsAt, items: [i] })
    }
    return out
  }, [rows])

  // 换筛选标签后，若当前这场不在结果里，就落到第一条，
  // 否则会出现「已结束」标签下右边还显示一场待确认的面试
  useEffect(() => {
    if (rows.length > 0 && !rows.some((r) => r.id === selectedId)) setSelectedId(rows[0].id)
  }, [rows, selectedId])

  const selected = interviews.find((i) => i.id === selectedId) ?? null
  const selectedJob = selected ? jobs.find((j) => j.id === selected.jobId) : null
  const selectedCand = selected ? candidates.find((c) => c.id === selected.candidateId) : null
  const selectedStatus = selected ? statusOf(selected) : null
  const prepDone = selected
    ? prepKeys.filter((_, idx) => prep[`${selected.id}:${idx}`]).length
    : 0
  const selectedConflict = selected ? conflictOf(selected.id) : undefined

  const dayHeader = (iso: string) => {
    const offset = dayOffset(iso)
    if (offset === 0) return t('interviews.dayToday')
    if (offset === 1) return t('interviews.dayTomorrow')
    return dateLineLabel(lang, iso)
  }

  const countdown = (i: Interview) => {
    const ms = startOf(i) - Date.now()
    if (ms <= 0) return null
    const min = Math.round(ms / 60_000)
    if (min < 60) return t('interviews.countdownMinutes', { n: Math.max(1, min) })
    const hours = Math.round(min / 60)
    if (hours < 24) return t('interviews.countdownHours', { n: hours })
    return t('interviews.countdownDays', { n: Math.round(hours / 24) })
  }

  const copyLink = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // 剪贴板被拒时也给出反馈，不至于点了没反应
    }
    toast(t('interviews.copyDone'), 'success')
  }

  const counts = {
    all: interviews.length,
    invited: interviews.filter((i) => matches(i, 'invited')).length,
    upcoming: interviews.filter((i) => matches(i, 'upcoming')).length,
    past: interviews.filter((i) => matches(i, 'past')).length
  }

  const pendingInRows = rows.filter((r) => statusOf(r) === 'invited').length

  const FormatIcon = selected ? formatIcon[selected.format] : Video

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* 工具条 */}
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-5 py-2">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'all', label: t('interviews.tabAll'), badge: counts.all },
            { value: 'invited', label: t('interviews.tabInvited'), badge: counts.invited },
            { value: 'upcoming', label: t('interviews.tabUpcoming'), badge: counts.upcoming },
            { value: 'past', label: t('interviews.tabPast'), badge: counts.past }
          ]}
        />

        <div className="ml-auto flex items-center gap-1.5">
          {pairs.length > 0 ? (
            <button
              onClick={() => setSelectedId(pairs[0].a.id)}
              title={t('interviews.conflictTitle')}
              className="flex shrink-0 items-center gap-1 rounded border border-warning/25 bg-warning/8 px-1.5 py-1 text-[10.5px] text-warning transition-colors hover:bg-warning/14"
            >
              <TriangleAlert size={10} />
              {t('interviews.conflictChip', { n: pairs.length })}
            </button>
          ) : null}
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('interviews.searchPlaceholder')}
            className="h-7 w-[212px] text-[11.5px]"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* 左：按天分组的邀约 */}
        <div className="flex w-[300px] shrink-0 flex-col border-r border-line">
          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
            {groups.map((g) => (
              <div key={g.key}>
                <div className="sticky top-0 z-10 border-b border-line/60 bg-bg/95 px-3 py-1 text-[9.5px] uppercase tracking-wider text-fg-subtle backdrop-blur">
                  {dayHeader(g.iso)}
                </div>
                {g.items.map((i) => {
                  const job = jobs.find((j) => j.id === i.jobId)
                  const cand = candidates.find((c) => c.id === i.candidateId)
                  const st = statusOf(i)
                  const meta = interviewStatusMeta[st]
                  const conflict = conflictOf(i.id)
                  const active = i.id === selectedId
                  return (
                    <button
                      key={i.id}
                      onClick={() => setSelectedId(i.id)}
                      className={cn(
                        'block w-full border-b border-line/70 px-3 py-2.5 text-left transition-colors',
                        active ? 'bg-accent/[0.07]' : 'hover:bg-surface-2/70'
                      )}
                    >
                      <div className="flex gap-2.5">
                        <div className="w-[52px] shrink-0">
                          <div className="tnum text-[11px] leading-4 text-fg-muted">
                            {clockLabel(lang, i.startsAt)}
                          </div>
                          <div className="text-[9.5px] leading-4 text-fg-subtle">
                            {t('interviews.durationValue', { n: i.durationMin })}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="min-w-0 flex-1 truncate text-[11.5px] text-fg">
                              {job?.title}
                            </span>
                            {conflict ? (
                              <TriangleAlert size={10} className="shrink-0 text-warning" />
                            ) : null}
                          </div>

                          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-fg-subtle">
                            <span className="truncate">{job?.company}</span>
                            <span className="shrink-0">·</span>
                            <span className="shrink-0">{t(interviewFormatMeta[i.format])}</span>
                            <span className="shrink-0">·</span>
                            <span className="truncate">{t(interviewRoundMeta[i.round])}</span>
                          </div>

                          <div className="mt-1 flex items-center gap-1.5">
                            <PersonAvatar name={cand?.name ?? '?'} hue={cand?.hue ?? 220} size={13} />
                            <span className="truncate text-[10px] text-fg-subtle">{cand?.name}</span>
                            <Badge
                              tone={meta.tone}
                              className="ml-auto h-4 px-1 text-[10px] font-normal"
                            >
                              {t(meta.labelKey)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}

            {rows.length === 0 ? (
              <Empty
                title={
                  interviews.length === 0 ? t('interviews.emptyTitle') : t('interviews.noMatchTitle')
                }
                hint={t('interviews.emptyHint')}
              />
            ) : null}
          </div>

          <div className="flex h-7 shrink-0 items-center gap-2 border-t border-line px-3 text-[10px] text-fg-subtle">
            <span className="truncate">{t('interviews.footerCount', { n: rows.length })}</span>
            {pendingInRows > 0 ? (
              <span className="ml-auto shrink-0 whitespace-nowrap">
                {t('interviews.footerPending', { n: pendingInRows })}
              </span>
            ) : null}
          </div>
        </div>

        {/* 右：单场详情 */}
        <div className="flex min-w-0 flex-1 flex-col">
          {selected && selectedJob && selectedCand && selectedStatus ? (
            <>
              <div className="flex shrink-0 items-start gap-2.5 border-b border-line px-4 py-2.5">
                <Mark text={selectedJob.company} hue={selectedJob.hue} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[12.5px] font-medium">{selectedJob.title}</span>
                    <Badge tone={interviewStatusMeta[selectedStatus].tone} dot>
                      {t(interviewStatusMeta[selectedStatus].labelKey)}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[10.5px] text-fg-subtle">
                    <span className="truncate">{selectedJob.company}</span>
                    <span className="shrink-0">·</span>
                    <span className="truncate">
                      {sources.find((s) => s.id === selected.sourceId)?.name}
                    </span>
                    <span className="shrink-0">·</span>
                    <PersonAvatar name={selectedCand.name} hue={selectedCand.hue} size={13} />
                    <span className="shrink-0">{selectedCand.name}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  className="gap-1"
                  onClick={() => go('jobs', selectedJob.id)}
                >
                  {t('interviews.openJob')}
                  <ArrowUpRight size={11} />
                </Button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 [scrollbar-gutter:stable]">
                {/* 时间：这一页的主信息，给足视觉权重 */}
                <div className="rounded-lg border border-line bg-surface-2 px-3.5 py-3">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[12.5px] font-medium">
                          {dateLineLabel(lang, selected.startsAt)}
                        </span>
                        {countdown(selected) ? (
                          <span className="rounded bg-accent/12 px-1.5 py-0.5 text-[10px] text-accent">
                            {countdown(selected)}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="tnum text-[21px] font-medium leading-none tracking-tight">
                          {clockLabel(lang, selected.startsAt)}
                        </span>
                        <span className="text-[12px] text-fg-subtle">–</span>
                        <span className="tnum text-[12.5px] text-fg-muted">
                          {clockLabel(lang, new Date(endOf(selected)).toISOString())}
                        </span>
                        <span className="text-[10.5px] text-fg-subtle">
                          · {t('interviews.durationValue', { n: selected.durationMin })}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: selected.roundTotal }).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              i < selected.roundIndex ? 'bg-accent' : 'bg-surface-4'
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-fg-subtle">
                        {t(interviewRoundMeta[selected.round])} ·{' '}
                        {t('interviews.roundOf', {
                          n: selected.roundIndex,
                          total: selected.roundTotal
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedConflict ? (
                  <button
                    onClick={() =>
                      setSelectedId(
                        selectedConflict.a.id === selected.id
                          ? selectedConflict.b.id
                          : selectedConflict.a.id
                      )
                    }
                    className="mt-2 flex w-full items-start gap-2 rounded-md border border-warning/25 bg-warning/8 px-2.5 py-2 text-left transition-colors hover:bg-warning/14"
                  >
                    <TriangleAlert size={12} className="mt-0.5 shrink-0 text-warning" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium text-warning">
                        {t('interviews.conflictTitle')}
                      </div>
                      <div className="mt-0.5 text-[10.5px] leading-relaxed text-warning/85">
                        {t('interviews.conflictHint', {
                          job: jobTitle(
                            selectedConflict.a.id === selected.id
                              ? selectedConflict.b.jobId
                              : selectedConflict.a.jobId
                          ),
                          n: selectedConflict.minutes
                        })}
                      </div>
                    </div>
                    <ArrowUpRight size={11} className="mt-0.5 shrink-0 text-warning/70" />
                  </button>
                ) : null}

                <div className="mt-3">
                  <KeyValue label={t('interviews.formatLabel')}>
                    <span className="flex items-center gap-1.5">
                      <FormatIcon size={11} className="shrink-0 text-fg-subtle" />
                      {t(interviewFormatMeta[selected.format])}
                    </span>
                  </KeyValue>

                  <KeyValue
                    label={
                      selected.format === 'video'
                        ? t('interviews.linkLabel')
                        : selected.format === 'phone'
                          ? t(interviewFormatMeta.phone)
                          : t('interviews.placeLabel')
                    }
                  >
                    {selected.format === 'video' ? (
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="min-w-0 flex-1 truncate text-accent">{selected.place}</span>
                        <Button
                          size="xs"
                          variant="ghost"
                          className="gap-1"
                          onClick={() => copyLink(selected.place)}
                        >
                          <Copy size={10} />
                          {t('interviews.copyLink')}
                        </Button>
                      </span>
                    ) : (
                      <span className="break-words">{selected.place}</span>
                    )}
                  </KeyValue>

                  <KeyValue label={t('interviews.interviewersLabel')}>
                    {selected.interviewers.length ? (
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {selected.interviewers.map((p) => (
                          <span key={p.name} className="flex items-center gap-1">
                            <PersonAvatar name={p.name} hue={hueOf(p.name)} size={14} />
                            <span className="text-fg">{p.name}</span>
                            <span className="text-fg-subtle">· {p.title}</span>
                          </span>
                        ))}
                      </span>
                    ) : (
                      t('interviews.noInterviewers')
                    )}
                  </KeyValue>

                  <KeyValue label={t('interviews.replyByLabel')}>
                    {selected.replyBy ? (
                      <span className="flex items-center gap-1.5">
                        <span>
                          {dateLineLabel(lang, selected.replyBy)}{' '}
                          {clockLabel(lang, selected.replyBy)}
                        </span>
                        <span
                          className={cn(
                            'rounded px-1 text-[10px]',
                            new Date(selected.replyBy).getTime() - Date.now() < 3_600_000 &&
                              new Date(selected.replyBy).getTime() > Date.now()
                              ? 'bg-warning/12 text-warning'
                              : 'bg-surface-3 text-fg-subtle'
                          )}
                        >
                          {relativeLabel(lang, selected.replyBy)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-fg-subtle">{t('common.none')}</span>
                    )}
                  </KeyValue>

                  <KeyValue label={t('interviews.invitedAtLabel')}>
                    {relativeLabel(lang, selected.invitedAt)}
                  </KeyValue>
                </div>

                <div className="mt-3 rounded-md border border-line bg-surface-2/60 px-2.5 py-2">
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-fg-subtle">
                    {t('interviews.noteTitle')}
                  </div>
                  <div className="text-[11.5px] leading-relaxed text-fg-muted">{selected.note}</div>
                </div>

                {!settled(selectedStatus, selected) ? (
                  <div className="mt-2 rounded-md border border-line bg-surface-2/60 px-2.5 py-2">
                    <div className="mb-0.5 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-fg-subtle">
                        {t('interviews.prepTitle')}
                      </span>
                      <span className="tnum text-[10px] text-fg-subtle">
                        {t('interviews.prepCount', { done: prepDone, total: prepKeys.length })}
                      </span>
                    </div>
                    {prepKeys.map((key, idx) => {
                      const id = `${selected.id}:${idx}`
                      const on = Boolean(prep[id])
                      return (
                        <label
                          key={key}
                          className="flex cursor-pointer items-center gap-2 py-1 text-[11px]"
                        >
                          <Checkbox
                            checked={on}
                            onChange={(v) => setPrep((prev) => ({ ...prev, [id]: v }))}
                          />
                          <span
                            className={cn(
                              'leading-relaxed',
                              on ? 'text-fg-subtle line-through' : 'text-fg-muted'
                            )}
                          >
                            {t(key)}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                ) : null}

                <div className="mt-2.5 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-fg-subtle">
                  <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-fg-subtle" />
                  {t(statusNoteKey[selectedStatus])}
                </div>
              </div>

              {/* 动作条：只给当前状态下有意义的按钮；都没有就不占位 */}
              {selectedStatus === 'invited' ||
              !settled(selectedStatus, selected) ||
              selected.conversationId ? (
              <div className="flex shrink-0 items-center gap-1.5 border-t border-line px-4 py-2.5">
                {selectedStatus === 'invited' ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        setInterviewStatus(selected.id, 'accepted')
                        toast(
                          t('interviews.acceptToast', { company: selectedJob.company }),
                          'success'
                        )
                      }}
                    >
                      <Check size={12} />
                      {t('interviews.accept')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() =>
                        toast(
                          t('interviews.rescheduleToast', {
                            name: selected.interviewers[0]?.name ?? selectedJob.company
                          }),
                          'default'
                        )
                      }
                    >
                      <Repeat2 size={12} />
                      {t('interviews.reschedule')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        setInterviewStatus(selected.id, 'declined')
                        toast(
                          t('interviews.declineToast', {
                            name: selected.interviewers[0]?.name ?? selectedJob.company
                          }),
                          'default'
                        )
                      }}
                    >
                      <X size={12} />
                      {t('interviews.decline')}
                    </Button>
                  </>
                ) : !settled(selectedStatus, selected) ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => toast(t('interviews.calendarToast'), 'success')}
                    >
                      <CalendarPlus size={12} />
                      {t('interviews.addCalendar')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() =>
                        toast(
                          t('interviews.rescheduleToast', {
                            name: selected.interviewers[0]?.name ?? selectedJob.company
                          }),
                          'default'
                        )
                      }
                    >
                      <Repeat2 size={12} />
                      {t('interviews.reschedule')}
                    </Button>
                  </>
                ) : null}

                {selected.conversationId ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto gap-1.5"
                    onClick={() => go('messages', undefined, selected.conversationId)}
                  >
                    <MessagesSquare size={12} />
                    {t('interviews.openChat')}
                  </Button>
                ) : null}
              </div>
              ) : null}
            </>
          ) : (
            <Empty title={t('interviews.selectTitle')} hint={t('interviews.selectHint')} />
          )}
        </div>
      </div>
    </div>
  )
}

