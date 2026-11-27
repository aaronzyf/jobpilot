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
  Upload,
  UserRound
} from 'lucide-react'
import { PersonAvatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { Dialog, MenuItem, Popover } from '@/components/ui/overlay'
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

function EditorDialog({
  candidate,
  open,
  onClose
}: {
  candidate: Candidate
  open: boolean
  onClose: () => void
}) {
  const { toast } = useApp()
  const { t, lang } = useI18n()
  const [auto, setAuto] = useState(candidate.thresholds.auto)
  const [reject, setReject] = useState(candidate.thresholds.reject)
  const [note, setNote] = useState(candidate.note)
  const [name, setName] = useState(candidate.name)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="lg"
      title={t('candidates.editTitle', { name: candidate.name })}
      desc={t('candidates.editDesc')}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              toast(t('candidates.toastSaved', { name }), 'success')
              onClose()
            }}
          >
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Field label={t('candidates.fieldName')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t('candidates.fieldPosition')}>
          <Input defaultValue={candidate.headline} />
        </Field>

        <div className="col-span-2">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[11.5px] text-fg-muted">{t('candidates.resumeFile')}</span>
            <span className="text-[10.5px] text-fg-subtle">
              {t('candidates.resumeMeta', {
                when: relativeLabel(lang, candidate.resumeUpdatedAt),
                projects: candidate.resumeFacts.projects,
                experiences: candidate.resumeFacts.experiences
              })}
            </span>
          </div>
          <div className="flex items-center gap-2.5 rounded-md border border-dashed border-line-strong bg-surface-2/50 px-3 py-2.5">
            <FileText size={18} className="shrink-0 text-danger/70" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] text-fg">{candidate.resumeFile}</div>
              <div className="text-[10.5px] text-fg-subtle">
                {t('candidates.resumePages', { n: candidate.resumePages })}
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Upload size={11} />
              {t('candidates.replace')}
            </Button>
          </div>
        </div>

        <div className="col-span-2">
          <Field label={t('candidates.fieldNote')} hint={t('candidates.fieldNoteHint')}>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={t('candidates.fieldNotePlaceholder')}
            />
          </Field>
        </div>

        <div className="col-span-2">
          <div className="mb-1.5 text-[11.5px] text-fg-muted">{t('candidates.threshold')}</div>
          <div className="space-y-2 rounded-md border border-line bg-surface-2 px-3 py-2.5">
            <div className="flex items-center gap-3">
              <span className="w-[86px] shrink-0 text-[11px] text-fg-subtle">{t('candidates.auto')}</span>
              <input
                type="range"
                min={reject + 5}
                max={99}
                value={auto}
                onChange={(e) => setAuto(Number(e.target.value))}
                className="flex-1"
              />
              <span className="tnum w-7 text-right text-[11.5px] text-accent">{auto}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-[86px] shrink-0 text-[11px] text-fg-subtle">{t('candidates.reject')}</span>
              <input
                type="range"
                min={0}
                max={auto - 5}
                value={reject}
                onChange={(e) => setReject(Number(e.target.value))}
                className="flex-1"
              />
              <span className="tnum w-7 text-right text-[11.5px] text-warning">{reject}</span>
            </div>
            <div className="text-[10px] leading-relaxed text-fg-subtle">
              {t('candidates.thresholdNote')}
            </div>
          </div>
        </div>

        <Field label={t('candidates.fieldEmail')}>
          <Input defaultValue={candidate.email} />
        </Field>
        <Field label={t('candidates.fieldDailyCap')}>
          <Select defaultValue={String(candidate.dailyCap)}>
            {[8, 12, 15, 20, 30].map((n) => (
              <option key={n} value={n}>
                {t('candidates.mails', { n })}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Dialog>
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
                  <MenuItem onClick={toggleEnabled}>
                    {c.enabled ? t('candidates.disable') : t('candidates.enable')}
                  </MenuItem>
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
                <Button
                  variant={c.enabled ? 'ghost' : 'outline'}
                  size="sm"
                  className="gap-1.5"
                  onClick={toggleEnabled}
                  title={c.enabled ? t('candidates.disableHint') : t('candidates.enableHint')}
                >
                  <Power size={11} />
                  {c.enabled ? t('candidates.disable') : t('candidates.enable')}
                </Button>
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
        <EditorDialog
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
