import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/form'
import { Sheet } from '@/components/ui/overlay'
import { Checkbox } from '@/components/ui/switch'
import { useT } from '@/i18n'
import type { Candidate } from '@/lib/types'
import { cn } from '@/lib/utils'

export type WorkMode = 'remote' | 'hybrid' | 'onsite'

export interface Filters {
  workModes: WorkMode[]
  region: 'all' | 'cn' | 'global'
  employment: 'all' | 'fulltime' | 'contract'
  minScore: number
  postedWithin: 0 | 24 | 72 | 168
  keyword: string
  excludeOutsource: boolean
  visa: boolean
}

export const defaultFilters: Filters = {
  workModes: [],
  region: 'all',
  employment: 'all',
  minScore: 0,
  postedWithin: 0,
  keyword: '',
  excludeOutsource: true,
  visa: false
}

export function activeFilterCount(f: Filters): number {
  let n = 0
  if (f.workModes.length) n += f.workModes.length
  if (f.region !== 'all') n += 1
  if (f.employment !== 'all') n += 1
  if (f.minScore > 0) n += 1
  if (f.postedWithin > 0) n += 1
  if (f.keyword.trim()) n += 1
  if (f.excludeOutsource) n += 1
  if (f.visa) n += 1
  return n
}

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line px-4 py-3 first:border-t-0">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[11.5px] font-medium text-fg">{title}</span>
        {hint ? <span className="text-[10px] text-fg-subtle">{hint}</span> : null}
      </div>
      {children}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-6 rounded border px-2 text-[11px] transition-colors',
        active
          ? 'border-accent/45 bg-accent/12 text-accent'
          : 'border-line bg-surface-2 text-fg-muted hover:border-line-strong hover:text-fg'
      )}
    >
      {children}
    </button>
  )
}

export function FilterSheet({
  open,
  onClose,
  filters,
  onApply,
  candidate
}: {
  open: boolean
  onClose: () => void
  filters: Filters
  onApply: (f: Filters) => void
  candidate: Candidate
}) {
  const t = useT()
  const [draft, setDraft] = useState<Filters>(filters)

  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  const toggleMode = (m: WorkMode) =>
    setDraft((d) => ({
      ...d,
      workModes: d.workModes.includes(m) ? d.workModes.filter((x) => x !== m) : [...d.workModes, m]
    }))

  return (
    <Sheet
      open={open}
      onClose={onClose}
      width={392}
      title={t('filters.title')}
      desc={t('filters.desc')}
      footer={
        <>
          <Button variant="ghost" size="sm" className="mr-auto gap-1" onClick={() => setDraft(defaultFilters)}>
            <RotateCcw size={11} />
            {t('common.reset')}
          </Button>
          <Button variant="ghost" size="sm">
            {t('common.saveAsView')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onApply(draft)
              onClose()
            }}
          >
            {t('common.apply')}
          </Button>
        </>
      }
    >
      <Group title={t('filters.workMode')} hint={t('filters.multiSelect')}>
        <div className="flex gap-1.5">
          {(
            [
              ['remote', 'meta.workModeRemote'],
              ['hybrid', 'meta.workModeHybrid'],
              ['onsite', 'meta.workModeOnsite']
            ] as const
          ).map(([v, label]) => (
            <Chip key={v} active={draft.workModes.includes(v)} onClick={() => toggleMode(v)}>
              {t(label)}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title={t('filters.region')}>
        <div className="flex gap-1.5">
          {(
            [
              ['all', 'common.any'],
              ['cn', 'meta.regionCn'],
              ['global', 'meta.regionGlobal']
            ] as const
          ).map(([v, label]) => (
            <Chip
              key={v}
              active={draft.region === v}
              onClick={() => setDraft((d) => ({ ...d, region: v }))}
            >
              {t(label)}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title={t('filters.employment')}>
        <div className="flex gap-1.5">
          {(
            [
              ['all', 'common.any'],
              ['fulltime', 'meta.employmentFulltime'],
              ['contract', 'meta.employmentContract']
            ] as const
          ).map(([v, label]) => (
            <Chip
              key={v}
              active={draft.employment === v}
              onClick={() => setDraft((d) => ({ ...d, employment: v }))}
            >
              {t(label)}
            </Chip>
          ))}
        </div>
      </Group>

      <Group
        title={t('filters.score')}
        hint={t('filters.scoreHint', { name: candidate.name, auto: candidate.thresholds.auto })}
      >
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            value={draft.minScore}
            onChange={(e) => setDraft((d) => ({ ...d, minScore: Number(e.target.value) }))}
            className="flex-1"
          />
          <span className="tnum w-8 text-right text-[11.5px] text-fg">
            {draft.minScore === 0
              ? t('filters.scoreUnlimited')
              : t('filters.scoreAtLeast', { n: draft.minScore })}
          </span>
        </div>
      </Group>

      <Group title={t('filters.posted')}>
        <Select
          value={String(draft.postedWithin)}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              postedWithin: Number(e.target.value) as Filters['postedWithin']
            }))
          }
        >
          <option value="0">{t('filters.postedUnlimited')}</option>
          <option value="24">{t('filters.posted24')}</option>
          <option value="72">{t('filters.posted72')}</option>
          <option value="168">{t('filters.posted168')}</option>
        </Select>
      </Group>

      <Group title={t('filters.keywords')} hint={t('filters.keywordsHint')}>
        <Input
          placeholder={t('filters.keywordsPlaceholder')}
          value={draft.keyword}
          onChange={(e) => setDraft((d) => ({ ...d, keyword: e.target.value }))}
        />
      </Group>

      <Group title={t('filters.exclude')}>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[11.5px] text-fg-muted">
            <Checkbox
              checked={draft.excludeOutsource}
              onChange={(v) => setDraft((d) => ({ ...d, excludeOutsource: v }))}
            />
            {t('filters.excludeOutsource')}
          </label>
          <label className="flex items-center gap-2 text-[11.5px] text-fg-muted">
            <Checkbox
              checked={draft.visa}
              onChange={(v) => setDraft((d) => ({ ...d, visa: v }))}
            />
            {t('filters.excludeVisaOnly')}
          </label>
        </div>
      </Group>

      <div className="px-4 pb-4 pt-1 text-[10.5px] leading-relaxed text-fg-subtle">
        {t('filters.note')}
      </div>
    </Sheet>
  )
}
