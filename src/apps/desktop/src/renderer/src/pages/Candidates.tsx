import { useState } from 'react'
import {
  Check,
  FileText,
  Mail,
  MoreHorizontal,
  Pencil,
  Power,
  Plus,
  Sparkles,
  UserRound
} from 'lucide-react'
import { CandidateEditorDialog } from '@/components/candidates/CandidateEditorDialog'
import { PersonAvatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MenuItem, Popover } from '@/components/ui/overlay'
import { useI18n } from '@/i18n'
import { relativeLabel } from '@/lib/meta'
import type { Candidate } from '@/lib/types'
import { useApp } from '@/lib/store'
import { cn } from '@/lib/utils'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="tnum text-[14px] leading-none text-fg">{value}</div>
      <div className="mt-1 text-[10px] text-fg-subtle">{label}</div>
    </div>
  )
}

export function Candidates() {
  const { candidate, setCandidateId, setCandidateEnabled, matchRuns, toast, candidates } = useApp()
  const { t, lang } = useI18n()
  const [editing, setEditing] = useState<Candidate | null>(null)

  return (
    <div className="h-full overflow-y-auto [scrollbar-gutter:stable]">
      <div className="page-enter mx-auto w-full max-w-[1180px] px-6 py-5">
      <div className="mb-3.5 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-medium">{t('candidates.pageTitle')}</h2>
            <Badge tone="neutral">{t('candidates.people', { n: candidates.length })}</Badge>
          </div>
          <p className="mt-1 text-[11px] text-fg-subtle">
            {t('candidates.pageDesc')}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="gap-1.5"
          onClick={() => toast(t('candidates.toastNew'), 'default')}
        >
          <Plus size={12.5} />
          {t('candidates.newCandidate')}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 min-[1180px]:grid-cols-3">
        {candidates.map((c) => {
          const isCurrent = c.id === candidate.id
          const run = matchRuns[c.id]
          const toggleEnabled = () => {
            if (isCurrent && c.enabled) return
            setCandidateEnabled(c.id, !c.enabled)
            toast(
              t(c.enabled ? 'candidates.toastDisabled' : 'candidates.toastEnabled', {
                name: c.name
              }),
              c.enabled ? 'warning' : 'success'
            )
          }
          return (
            <Card
              key={c.id}
              className={cn(
                'flex flex-col p-3.5 transition-colors',
                isCurrent && 'border-accent/35 bg-accent/[0.04]'
              )}
            >
              <div className="flex items-start gap-2.5">
                <PersonAvatar name={c.name} hue={c.hue} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] font-medium">{c.name}</span>
                    {isCurrent ? (
                      <Badge tone="accent">{t('candidates.current')}</Badge>
                    ) : null}
                    <Badge tone={c.enabled ? 'success' : 'neutral'} dot>
                      {c.enabled ? t('candidates.matching') : t('candidates.disabled')}
                    </Badge>
                  </div>
                  <div className="mt-0.5 truncate text-[10.5px] text-fg-subtle">
                    {t('candidates.yearsOld', { headline: c.headline, n: c.years })}
                  </div>
                </div>
                <Popover
                  align="end"
                  trigger={({ toggle }) => (
                    <button
                      onClick={toggle}
                      className="flex h-6 w-6 items-center justify-center rounded text-fg-subtle hover:bg-surface-3 hover:text-fg"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  )}
                >
                  <MenuItem onClick={() => setEditing(c)}>{t('candidates.editProfile')}</MenuItem>
                  {!isCurrent || !c.enabled ? (
                    <MenuItem onClick={toggleEnabled}>
                      {c.enabled ? t('candidates.disable') : t('candidates.enable')}
                    </MenuItem>
                  ) : null}
                  <MenuItem onClick={() => toast(t('candidates.toastDuplicated'), 'success')}>
                    {t('candidates.duplicate')}
                  </MenuItem>
                  <MenuItem onClick={() => toast(t('candidates.toastArchived'), 'default')}>
                    {t('candidates.archive')}
                  </MenuItem>
                </Popover>
              </div>

              <div className="mt-3 flex items-center justify-between border-y border-line py-2">
                <Stat label={t('candidates.statApplied')} value={c.stats.applied} />
                <Stat label={t('candidates.statPending')} value={c.stats.pending} />
                <Stat label={t('candidates.statReplied')} value={c.stats.replied} />
                <Stat label={t('candidates.statInterview')} value={c.stats.interview} />
                <div className="shrink-0 text-right">
                  <div className="tnum text-[14px] leading-none text-fg">
                    {c.thresholds.reject}
                    <span className="mx-1 text-[11px] text-fg-subtle">/</span>
                    {c.thresholds.auto}
                  </div>
                  <div className="mt-1 whitespace-nowrap text-[9.5px] text-fg-subtle">
                    {t('candidates.thresholdOrder')}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[9.5px] text-fg-subtle">
                <span>
                  {c.enabled
                    ? t('candidates.matchScan', { n: run?.scanned ?? 0 })
                    : t('candidates.matchPaused')}
                </span>
                <span>
                  {run ? relativeLabel(lang, new Date(run.at).toISOString()) : t('candidates.notScanned')}
                </span>
              </div>

              <div className="mt-2.5 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <FileText size={11} className="shrink-0 text-danger/70" />
                  <span className="min-w-0 flex-1 truncate text-[10.5px] text-fg-muted">
                    {c.resumeFile}
                  </span>
                  <span className="shrink-0 text-[9.5px] text-fg-subtle">
                    {relativeLabel(lang, c.resumeUpdatedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail size={11} className="shrink-0 text-fg-subtle" />
                  <span className="min-w-0 flex-1 truncate text-[10.5px] text-fg-muted">
                    {c.smtp ? `${c.email} · ${c.smtp.host}` : t('candidates.smtpNotConfigured')}
                  </span>
                  {c.smtp ? (
                    <Badge tone={c.smtp.verified ? 'success' : 'warning'}>
                      {c.smtp.verified ? t('candidates.smtpVerified') : t('candidates.smtpUnverified')}
                    </Badge>
                  ) : (
                    <Badge tone="danger">{t('candidates.cannotSend')}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles size={11} className="shrink-0 text-fg-subtle" />
                  <span className="text-[10.5px] text-fg-subtle">
                    {t('candidates.facts', {
                      projects: c.resumeFacts.projects,
                      experiences: c.resumeFacts.experiences,
                      skills: c.resumeFacts.skills
                    })}
                  </span>
                </div>
              </div>

              <div className="mt-2.5 rounded-md border border-dashed border-line-strong px-2 py-1.5">
                <div className="mb-0.5 text-[9.5px] uppercase tracking-wider text-fg-subtle">
                  {t('candidates.requirement')}
                </div>
                <p className="line-clamp-3 text-[10.5px] leading-relaxed text-fg-muted">{c.note}</p>
              </div>

              <div className="mt-auto flex items-center gap-1.5 pt-3">
                <Button
                  variant={isCurrent ? 'subtle' : 'outline'}
                  size="sm"
                  className="flex-1 gap-1.5"
                  disabled={isCurrent}
                  onClick={() => {
                    setCandidateId(c.id)
                    toast(t('candidates.toastSwitched', { name: c.name }), 'success')
                  }}
                >
                  {isCurrent ? <Check size={11} /> : <UserRound size={11} />}
                  {isCurrent ? t('candidates.inUse') : t('candidates.switchTo')}
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditing(c)}>
                  <Pencil size={11} />
                  {t('common.edit')}
                </Button>
                <span
                  title={
                    isCurrent && c.enabled
                      ? t('candidates.currentCannotDisable')
                      : c.enabled
                        ? t('candidates.disableHint')
                        : t('candidates.enableHint')
                  }
                >
                  <Button
                    variant={c.enabled ? 'ghost' : 'outline'}
                    size="sm"
                    className="gap-1.5"
                    disabled={isCurrent && c.enabled}
                    onClick={toggleEnabled}
                  >
                    <Power size={11} />
                    {c.enabled ? t('candidates.disable') : t('candidates.enable')}
                  </Button>
                </span>
              </div>
            </Card>
          )
        })}

        <button
          onClick={() => toast(t('candidates.toastNew'), 'default')}
          className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong text-fg-subtle transition-colors hover:border-accent/40 hover:bg-accent/[0.03] hover:text-fg-muted"
        >
          <Plus size={18} />
          <span className="text-[11.5px]">{t('candidates.newHint')}</span>
          <span className="text-[10px]">{t('candidates.newSubHint')}</span>
        </button>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-surface/60 px-3.5 py-2.5 text-[10.5px] leading-relaxed text-fg-subtle">
        <Sparkles size={11} className="mt-0.5 shrink-0" />
        <span>
          {t('candidates.footerNote')}
        </span>
      </div>

      {editing ? (
        <CandidateEditorDialog
          key={editing.id}
          candidate={editing}
          open
          onClose={() => setEditing(null)}
        />
      ) : null}
      </div>
    </div>
  )
}
