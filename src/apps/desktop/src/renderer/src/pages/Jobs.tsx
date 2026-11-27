import { useEffect, useMemo, useState } from 'react'
import { ArrowUpDown, Check, Columns3, Filter, Search, X } from 'lucide-react'
import { Mark } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form'
import { Empty } from '@/components/ui/misc'
import { MenuItem, MenuLabel, MenuSeparator, Popover } from '@/components/ui/overlay'
import { Segmented } from '@/components/ui/switch'
import { JobDetail } from '@/components/jobs/JobDetail'
import { EmailComposer } from '@/components/mail/EmailComposer'
import {
  FilterSheet,
  activeFilterCount,
  defaultFilters,
  type Filters
} from '@/components/jobs/FilterSheet'
import { useI18n } from '@/i18n'
import { scoreFor, verdictFor } from '@/lib/match'
import {
  channelMeta,
  employmentMeta,
  relativeLabel,
  scoreBarClass,
  workModeMeta
} from '@/lib/meta'
import type { Job } from '@/lib/types'
import { useApp } from '@/lib/store'
import { useMediaQuery } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import type { Verdict } from '@core'

type Tab = Verdict | 'all'
type Sort = 'score' | 'posted'

const allColumns = {
  location: 'jobs.colLocation',
  salary: 'jobs.colSalary',
  score: 'jobs.colScore',
  channel: 'jobs.colChannel',
  source: 'jobs.colSource',
  posted: 'jobs.colPosted'
} as const

type ColumnKey = keyof typeof allColumns

export function Jobs() {
  const { candidate, focusJobId, clearFocusJob, go, toast, jobs, savedIds, toggleSaved } = useApp()
  const { t, lang } = useI18n()
  const wide = useMediaQuery('(min-width: 1260px)')
  const [tab, setTab] = useState<Tab>('all')
  const [sort, setSort] = useState<Sort>('score')
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [checked, setChecked] = useState<string[]>([])
  const [mailJob, setMailJob] = useState<Job | null>(null)
  const [columns, setColumns] = useState<ColumnKey[]>(Object.keys(allColumns) as ColumnKey[])

  useEffect(() => {
    if (focusJobId) {
      setSelectedId(focusJobId)
      clearFocusJob()
    }
  }, [focusJobId, clearFocusJob])

  const rows = useMemo(() => {
    const base = jobs.map((job) => ({
      job,
      score: scoreFor(job, candidate.id),
      verdict: verdictFor(scoreFor(job, candidate.id), candidate.thresholds.auto, candidate.thresholds.reject)
    }))

    const filtered = base.filter(({ job, score, verdict }) => {
      if (tab !== 'all' && verdict !== tab) return false
      if (filters.workModes.length && !filters.workModes.includes(job.workMode)) return false
      if (filters.region !== 'all' && job.region !== filters.region) return false
      if (filters.employment !== 'all' && job.employment !== filters.employment) return false
      if (score < filters.minScore) return false
      if (filters.postedWithin > 0 && job.postedHours > filters.postedWithin) return false
      if (filters.visa && !job.companyMeta.visa) return false
      if (filters.excludeOutsource && (job.tags.includes('外包') || job.tags.includes('驻场'))) return false
      if (filters.keyword.trim()) {
        const kw = filters.keyword.trim().toLowerCase()
        const hay = `${job.title} ${job.company} ${job.jdSummary} ${job.tags.join(' ')}`.toLowerCase()
        if (!hay.includes(kw)) return false
      }
      return true
    })

    return filtered.sort((a, b) =>
      sort === 'score' ? b.score - a.score : a.job.postedHours - b.job.postedHours
    )
  }, [tab, filters, sort, candidate])

  const counts = useMemo(() => {
    const base = jobs
      .map((j) => ({
        job: j,
        verdict: verdictFor(scoreFor(j, candidate.id), candidate.thresholds.auto, candidate.thresholds.reject)
      }))
      .filter(({ job }) => {
        if (filters.excludeOutsource && (job.tags.includes('外包') || job.tags.includes('驻场'))) return false
        return true
      })
    return {
      all: base.length,
      auto: base.filter((b) => b.verdict === 'auto').length,
      confirm: base.filter((b) => b.verdict === 'confirm').length,
      reject: base.filter((b) => b.verdict === 'reject').length
    }
  }, [candidate, filters.excludeOutsource])

  const selected = rows.find((r) => r.job.id === selectedId)?.job ?? null
  // 并排显示详情时，表格空间变小，先收起信息量最低的两列
  const cols = wide && selected ? columns.filter((c) => c !== 'source' && c !== 'posted') : columns
  const filterCount = activeFilterCount(filters)

  const chips: { label: string; onClear: () => void }[] = []
  if (filters.keyword.trim())
    chips.push({ label: `“${filters.keyword.trim()}”`, onClear: () => setFilters((f) => ({ ...f, keyword: '' })) })
  filters.workModes.forEach((m) =>
    chips.push({
      label: t(workModeMeta[m].labelKey),
      onClear: () => setFilters((f) => ({ ...f, workModes: f.workModes.filter((x) => x !== m) }))
    })
  )
  if (filters.region !== 'all')
    chips.push({
      label: filters.region === 'cn' ? t('meta.regionCn') : t('meta.regionGlobal'),
      onClear: () => setFilters((f) => ({ ...f, region: 'all' }))
    })
  if (filters.employment !== 'all')
    chips.push({
      label: t(employmentMeta[filters.employment]),
      onClear: () => setFilters((f) => ({ ...f, employment: 'all' }))
    })
  if (filters.minScore > 0)
    chips.push({
      label: t('jobs.shipChipScore', { n: filters.minScore }),
      onClear: () => setFilters((f) => ({ ...f, minScore: 0 }))
    })
  if (filters.postedWithin > 0)
    chips.push({
      label:
        filters.postedWithin === 24
          ? t('filters.posted24')
          : filters.postedWithin === 72
            ? t('filters.posted72')
            : t('filters.posted168'),
      onClear: () => setFilters((f) => ({ ...f, postedWithin: 0 }))
    })
  if (filters.excludeOutsource)
    chips.push({
      label: t('jobs.chipExcludeOutsource'),
      onClear: () => setFilters((f) => ({ ...f, excludeOutsource: false }))
    })
  if (filters.visa)
    chips.push({ label: t('jobs.chipVisa'), onClear: () => setFilters((f) => ({ ...f, visa: false })) })

  const allChecked = rows.length > 0 && checked.length === rows.length

  return (
    <div className="relative flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 工具栏 */}
        <div className="flex shrink-0 items-center gap-2 border-b border-line px-5 py-2">
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: 'all', label: t('jobs.tabAll'), badge: counts.all },
              { value: 'auto', label: t('jobs.tabAuto'), badge: counts.auto },
              { value: 'confirm', label: t('jobs.tabConfirm'), badge: counts.confirm },
              { value: 'reject', label: t('jobs.tabReject'), badge: counts.reject }
            ]}
          />

          <div className="ml-auto flex items-center gap-1.5">
            <div className="relative hidden min-[1140px]:block">
              <Search
                size={12}
                className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-fg-subtle"
              />
              <Input
                value={filters.keyword}
                onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
                placeholder={t('jobs.searchPlaceholder')}
                className="h-7 w-[144px] pl-7 text-[11.5px]"
              />
            </div>

            <Button
              variant={filterCount > 0 ? 'subtle' : 'ghost'}
              size="sm"
              className="gap-1.5"
              onClick={() => setFilterOpen(true)}
            >
              <Filter size={12} strokeWidth={1.8} />
              {t('jobs.filter')}
              {filterCount > 0 ? (
                <span className="rounded bg-accent/18 px-1 text-[10px] leading-4 text-accent">
                  {filterCount}
                </span>
              ) : null}
            </Button>

            <Popover
              trigger={({ toggle }) => (
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={toggle}>
                  <ArrowUpDown size={12} strokeWidth={1.8} />
                  {sort === 'score' ? t('jobs.sortScore') : t('jobs.sortNewest')}
                </Button>
              )}
            >
              <MenuLabel>{t('jobs.sortLabel')}</MenuLabel>
              <MenuItem selected={sort === 'score'} onClick={() => setSort('score')}>
                {t('jobs.sortScoreDesc')}
              </MenuItem>
              <MenuItem selected={sort === 'posted'} onClick={() => setSort('posted')}>
                {t('jobs.sortNewestDesc')}
              </MenuItem>
              <MenuSeparator />
              <MenuLabel>{t('jobs.savedViews')}</MenuLabel>
              <MenuItem hint="18">{t('jobs.viewRemoteHigh')}</MenuItem>
              <MenuItem hint="26">{t('jobs.viewBigTech')}</MenuItem>
              <MenuItem hint="9">{t('jobs.viewVisa')}</MenuItem>
            </Popover>

            <Popover
              trigger={({ toggle }) => (
                <Button variant="ghost" size="icon" onClick={toggle} title={t('jobs.columnsTitle')}>
                  <Columns3 size={13} strokeWidth={1.8} />
                </Button>
              )}
            >
              <MenuLabel>{t('jobs.columnsTitle')}</MenuLabel>
              {(Object.keys(allColumns) as ColumnKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() =>
                    setColumns((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]))
                  }
                  className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[11.5px] text-fg-muted hover:bg-surface-3 hover:text-fg"
                >
                  <span
                    className={cn(
                      'flex h-3 w-3 items-center justify-center rounded-[3px] border',
                      columns.includes(k)
                        ? 'border-accent bg-accent text-white'
                        : 'border-line-strong'
                    )}
                  >
                    {columns.includes(k) ? <Check size={8} strokeWidth={3} /> : null}
                  </span>
                  {t(allColumns[k])}
                </button>
              ))}
            </Popover>
          </div>
        </div>

        {/* 条件与批量操作 */}
        <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-line bg-surface/50 px-5">
          {checked.length > 0 ? (
            <>
              <span className="text-[11px] text-fg">
                {t('common.selectedCount', { n: checked.length })}
              </span>
              <Button
                size="xs"
                variant="primary"
                onClick={() => {
                  toast(t('jobs.toastBatch', { n: checked.length }), 'success')
                  setChecked([])
                }}
              >
                {t('jobs.batchApply')}
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  toast(t('jobs.toastIgnore', { n: checked.length }), 'default')
                  setChecked([])
                }}
              >
                {t('jobs.ignore')}
              </Button>
              <button
                onClick={() => setChecked([])}
                className="ml-1 text-[10.5px] text-fg-subtle hover:text-fg-muted"
              >
                {t('common.clearSelection')}
              </button>
            </>
          ) : (
            <>
              {chips.length === 0 ? (
                <span className="text-[10.5px] text-fg-subtle">
                  {t('jobs.emptyFilterNote')}
                </span>
              ) : (
                chips.map((c) => (
                  <span
                    key={c.label}
                    className="inline-flex h-5 items-center gap-1 rounded border border-line-strong bg-surface-2 px-1.5 text-[10.5px] text-fg-muted"
                  >
                    {c.label}
                    <button onClick={c.onClear} className="text-fg-subtle hover:text-fg">
                      <X size={9} />
                    </button>
                  </span>
                ))
              )}
              {chips.length > 0 ? (
                <>
                  <span className="mx-1 h-3 w-px shrink-0 bg-line-strong" />
                  <button
                    onClick={() => setFilters(defaultFilters)}
                    className="shrink-0 text-[10.5px] text-fg-subtle hover:text-fg-muted"
                  >
                    {t('common.clear')}
                  </button>
                </>
              ) : null}
            </>
          )}
        </div>

        {/* 表格 */}
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[720px] table-fixed border-collapse text-[12px]">
            <thead className="sticky top-0 z-10 bg-bg/95 backdrop-blur">
              <tr className="border-b border-line text-left text-[10.5px] text-fg-subtle">
                <th className="w-9 py-2 pl-4 pr-1 font-normal">
                  <span className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={() => setChecked(allChecked ? [] : rows.map((r) => r.job.id))}
                      className="h-3 w-3 accent-[var(--accent)]"
                    />
                  </span>
                </th>
                <th className="py-2 pr-2 font-normal">{t('jobs.colCompany')}</th>
                {cols.includes('location') ? (
                  <th className="w-[122px] px-2 font-normal">{t(allColumns.location)}</th>
                ) : null}
                {cols.includes('salary') ? (
                  <th className="w-[120px] whitespace-nowrap px-2 font-normal">
                    {t(allColumns.salary)}
                  </th>
                ) : null}
                {cols.includes('score') ? (
                  <th className="w-[92px] px-2 font-normal">{t(allColumns.score)}</th>
                ) : null}
                {cols.includes('channel') ? (
                  <th className="w-[58px] px-2 font-normal">{t(allColumns.channel)}</th>
                ) : null}
                {cols.includes('source') ? (
                  <th className="w-[84px] px-2 font-normal">{t(allColumns.source)}</th>
                ) : null}
                {cols.includes('posted') ? (
                  <th className="w-[60px] px-2 font-normal">{t(allColumns.posted)}</th>
                ) : null}
                <th className="w-8 pr-4" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ job, score, verdict }) => {
                const active = job.id === selectedId
                return (
                  <tr
                    key={job.id}
                    onClick={() => setSelectedId(job.id)}
                    className={cn(
                      'group cursor-default border-b border-line/70 transition-colors',
                      active ? 'bg-accent/[0.07]' : 'hover:bg-surface-2/70'
                    )}
                  >
                    <td className="py-2 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                      <span className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={checked.includes(job.id)}
                          onChange={() =>
                            setChecked((c) =>
                              c.includes(job.id) ? c.filter((x) => x !== job.id) : [...c, job.id]
                            )
                          }
                          className="h-3 w-3 accent-[var(--accent)]"
                        />
                      </span>
                    </td>
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'h-1.5 w-1.5 shrink-0 rounded-full',
                            verdict === 'auto'
                              ? 'bg-accent'
                              : verdict === 'confirm'
                                ? 'bg-warning'
                                : 'bg-surface-4'
                          )}
                        />
                        <Mark text={job.company} hue={job.hue} size={22} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                'truncate text-[12px]',
                                active ? 'text-fg' : 'text-fg/95'
                              )}
                            >
                              {job.title}
                            </span>
                            {savedIds.includes(job.id) ? (
                              <span className="shrink-0 whitespace-nowrap text-[10px] text-accent">
                                · {t('jobs.favorited')}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-fg-subtle">
                            <span className="truncate">{job.company}</span>
                            <span className="text-fg-subtle/50">|</span>
                            <span className="truncate">
                              {t(employmentMeta[job.employment])} ·{' '}
                              {t(workModeMeta[job.workMode].labelKey)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    {cols.includes('location') ? (
                      <td className="px-2 text-[11.5px] text-fg-muted">
                        <span className="truncate">
                          {job.city}
                          {job.region === 'global' ? ` · ${job.country}` : ''}
                        </span>
                      </td>
                    ) : null}
                    {cols.includes('salary') ? (
                      <td className="tnum whitespace-nowrap px-2 text-[11.5px] text-fg-muted">{job.salaryText}</td>
                    ) : null}
                    {cols.includes('score') ? (
                      <td className="px-2">
                        <div className="flex items-center gap-2">
                          <div className="h-[3px] w-9 overflow-hidden rounded-full bg-surface-3">
                            <div
                              className={cn('h-full rounded-full', scoreBarClass(score, candidate.thresholds))}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="tnum text-[11px] text-fg-muted">{score}</span>
                        </div>
                      </td>
                    ) : null}
                    {cols.includes('channel') ? (
                      <td className="px-2">
                        <span className="text-[11px] text-fg-muted">
                          {t(channelMeta[job.channel].shortKey)}
                        </span>
                      </td>
                    ) : null}
                    {cols.includes('source') ? (
                      <td className="px-2">
                        <span className="truncate text-[11px] text-fg-subtle">{job.sourceName}</span>
                      </td>
                    ) : null}
                    {cols.includes('posted') ? (
                      <td className="whitespace-nowrap px-2 text-[10.5px] text-fg-subtle">
                        {relativeLabel(lang, job.postedAt)}
                      </td>
                    ) : null}
                    <td className="pr-3" />
                  </tr>
                )
              })}
            </tbody>
          </table>

          {rows.length === 0 ? (
            <Empty
              title={t('jobs.emptyTitle')}
              hint={t('jobs.emptyHint')}
              action={
                <Button variant="outline" size="sm" onClick={() => setFilters(defaultFilters)}>
                  {t('common.clearFilters')}
                </Button>
              }
            />
          ) : null}
        </div>

        {/* 状态栏 */}
        <div className="flex h-7 shrink-0 items-center gap-3 overflow-hidden border-t border-line px-5 text-[10.5px] text-fg-subtle">
          <span className="truncate">
            {t('jobs.footerCount', { n: rows.length, name: candidate.name })}
          </span>
          <span className="ml-auto shrink-0 whitespace-nowrap">
            {t('jobs.footerSync', {
              reject: candidate.thresholds.reject,
              auto: candidate.thresholds.auto
            })}
          </span>
        </div>
      </div>

      {selected && !wide ? (
        <div className="absolute inset-0 z-10 bg-scrim-soft" onClick={() => setSelectedId(null)} />
      ) : null}

      {selected ? (
        <div
          className={cn(
            !wide &&
              'absolute inset-y-0 right-0 z-20 shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.8)]'
          )}
        >
        <JobDetail
          job={selected}
          candidate={candidate}
          saved={savedIds.includes(selected.id)}
          onClose={() => setSelectedId(null)}
          onCompose={() => setMailJob(selected)}
          onToggleSave={() => toggleSaved(selected.id)}
          onApply={() => {
            if (selected.channel === 'email') {
              setMailJob(selected)
              return
            }
            toast(
              t('jobs.toastSubmitted', { company: selected.company, title: selected.title }),
              'success'
            )
            go('applications')
          }}
        />
        </div>
      ) : null}

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onApply={setFilters}
        candidate={candidate}
      />

      <EmailComposer
        open={mailJob !== null}
        onClose={() => setMailJob(null)}
        job={mailJob}
        candidate={candidate}
        onSend={() => {
          if (!mailJob) return
          toast(t('jobs.toastMailSent', { email: mailJob.contactEmail ?? '' }), 'success')
          go('applications')
        }}
      />
    </div>
  )
}
