import { Bookmark, BookmarkCheck, ExternalLink, Mail, Send, TriangleAlert, X } from 'lucide-react'
import { Mark } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KeyValue } from '@/components/ui/misc'
import { Bar, ScoreRing } from '@/components/ui/viz'
import { useI18n } from '@/i18n'
import type { Candidate, Job } from '@/lib/types'
import { scoreFor, verdictFor } from '@/lib/match'
import { channelMeta, employmentMeta, relativeLabel, verdictMeta, workModeMeta } from '@/lib/meta'
import { cn } from '@/lib/utils'

export function JobDetail({
  job,
  candidate,
  saved,
  onClose,
  onCompose,
  onApply,
  onToggleSave
}: {
  job: Job
  candidate: Candidate
  saved: boolean
  onClose: () => void
  onCompose: () => void
  onApply: () => void
  onToggleSave: () => void
}) {
  const { t, lang } = useI18n()
  const match = job.matches[candidate.id]
  const score = scoreFor(job, candidate.id)
  const verdict = verdictFor(score, candidate.thresholds.auto, candidate.thresholds.reject)
  const reasons = match?.reasons ?? []
  const gaps = match?.gaps ?? []
  const meta = verdictMeta[verdict]
  const smtpReady = candidate.smtp?.verified === true
  const emailBlocked = job.channel === 'email' && !smtpReady

  return (
    <aside className="anim-slide flex h-full w-[418px] shrink-0 flex-col border-l border-line bg-surface">
      {/* 头部 */}
      <div className="shrink-0 border-b border-line px-4 py-3">
        <div className="flex items-start gap-2.5">
          <Mark text={job.company} hue={job.hue} size={32} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[13.5px] font-medium leading-snug text-fg">{job.title}</h2>
            <div className="mt-0.5 truncate text-[11px] text-fg-subtle">
              {job.company} · {job.city} · {t('jobDetail.postedAt', { date: relativeLabel(lang, job.postedAt) })}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={onToggleSave}
              title={saved ? t('jobDetail.unsave') : t('jobDetail.save')}
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded hover:bg-surface-3',
                saved ? 'text-accent' : 'text-fg-subtle hover:text-fg'
              )}
            >
              {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
            </button>
            <button
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded text-fg-subtle hover:bg-surface-3 hover:text-fg"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <Badge tone={workModeMeta[job.workMode].tone}>
            {t(workModeMeta[job.workMode].labelKey)}
          </Badge>
          <Badge tone="neutral">{t(employmentMeta[job.employment])}</Badge>
          <Badge tone="neutral">{job.salaryText}</Badge>
          <Badge tone="neutral">{job.sourceName}</Badge>
          {job.companyMeta.visa ? <Badge tone="success">{t('jobDetail.visa')}</Badge> : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* 匹配度 */}
        <div className="border-b border-line px-4 py-3.5">
          <div className="flex items-center gap-3.5">
            <ScoreRing
              score={score}
              auto={candidate.thresholds.auto}
              reject={candidate.thresholds.reject}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Badge tone={meta.tone}>{t(meta.labelKey)}</Badge>
                <span className="text-[10.5px] text-fg-subtle">
                  {t('jobDetail.thresholdLine', {
                    auto: candidate.thresholds.auto,
                    reject: candidate.thresholds.reject
                  })}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-fg-muted">
                {t(verdictMeta[verdict].hintKey)}
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {reasons.map((r) => (
              <div key={r.label} className="flex items-center gap-2">
                <span className="w-[74px] shrink-0 truncate text-[10.5px] text-fg-muted">
                  {r.label}
                </span>
                <Bar
                  value={r.weight * 100}
                  height="h-[3px]"
                  className={r.weight >= 0.8 ? 'bg-accent/80' : r.weight >= 0.5 ? 'bg-accent/45' : 'bg-surface-4'}
                  trackClassName="flex-1"
                />
                <span className="tnum w-6 shrink-0 text-right text-[10px] text-fg-subtle">
                  {Math.round(r.weight * 100)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 space-y-1">
            {reasons.slice(0, 2).map((r) => (
              <div key={r.label} className="flex gap-1.5 text-[10.5px] leading-relaxed text-fg-subtle">
                <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-success/70" />
                {r.detail}
              </div>
            ))}
          </div>

          {gaps.length > 0 ? (
            <div className="mt-2.5 rounded-md border border-warning/20 bg-warning/6 px-2 py-1.5">
              <div className="mb-0.5 flex items-center gap-1 text-[10px] text-warning/90">
                <TriangleAlert size={10} />
                {t('jobDetail.gaps')}
              </div>
              {gaps.map((g) => (
                <div key={g} className="text-[10.5px] leading-relaxed text-fg-muted">
                  · {g}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* 投递信息 */}
        <div className="border-b border-line px-4 py-3">
          <div className="mb-1.5 text-[11px] font-medium text-fg">{t('jobDetail.channel')}</div>
          <KeyValue label={t('jobDetail.method')}>{t(channelMeta[job.channel].labelKey)}</KeyValue>
          {job.contactEmail ? (
            <KeyValue label={t('jobDetail.email')}>{job.contactEmail}</KeyValue>
          ) : null}
          <KeyValue label={t('jobDetail.resume')}>{candidate.resumeFile}</KeyValue>
          {job.subjectRule ? (
            <div className="mt-1.5 rounded-md border border-line bg-surface-2 p-2">
              <div className="mb-1 flex items-center gap-1 text-[10px] text-fg-subtle">
                <Mail size={10} />
                {t('jobDetail.subjectRule')}
              </div>
              <div className="font-mono text-[10.5px] leading-relaxed text-fg-muted">
                {job.subjectRule.raw}
              </div>
            </div>
          ) : null}
          {emailBlocked ? (
            <div className="mt-1.5 flex items-start gap-1.5 rounded-md border border-danger/25 bg-danger/8 px-2 py-1.5 text-[10.5px] leading-relaxed text-danger/90">
              <TriangleAlert size={11} className="mt-px shrink-0" />
              {t('jobDetail.noSmtp', { name: candidate.name })}
            </div>
          ) : null}
        </div>

        {/* JD */}
        <div className="px-4 py-3">
          <div className="mb-1.5 text-[11px] font-medium text-fg">{t('jobDetail.description')}</div>
          <p className="text-[11.5px] leading-relaxed text-fg-muted">{job.jdSummary}</p>

          <div className="mt-2.5 mb-1 text-[10.5px] text-fg-subtle">{t('jobDetail.responsibilities')}</div>
          <ul className="space-y-1">
            {job.responsibilities.map((r) => (
              <li key={r} className="flex gap-1.5 text-[11px] leading-relaxed text-fg-muted">
                <span className="mt-[6px] h-[3px] w-[3px] shrink-0 rounded-full bg-fg-subtle" />
                {r}
              </li>
            ))}
          </ul>

          <div className="mt-2.5 mb-1 text-[10.5px] text-fg-subtle">{t('jobDetail.requirements')}</div>
          <ul className="space-y-1">
            {job.requirements.map((r) => (
              <li key={r} className="flex gap-1.5 text-[11px] leading-relaxed text-fg-muted">
                <span className="mt-[6px] h-[3px] w-[3px] shrink-0 rounded-full bg-fg-subtle" />
                {r}
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap gap-1">
            {job.tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] text-fg-subtle"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-0.5 border-t border-line pt-2 text-[10.5px] text-fg-subtle">
            <span>{t('jobDetail.companySize', { v: job.companyMeta.size })}</span>
            <span>{t('jobDetail.funding', { v: job.companyMeta.stage })}</span>
            <span>{t('jobDetail.industry', { v: job.companyMeta.industry })}</span>
            <span>{t('jobDetail.applicants', { n: job.applicants })}</span>
          </div>
        </div>
      </div>

      {/* 底部操作 */}
      <div className="shrink-0 border-t border-line bg-surface-2/60 px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <Button
            variant="primary"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={onApply}
            disabled={emailBlocked}
          >
            <Send size={12} />
            {verdict === 'auto'
              ? t('jobDetail.applyAndSend')
              : verdict === 'confirm'
                ? t('jobDetail.confirmThenApply')
                : t('jobDetail.applyAnyway')}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onCompose}>
            <Mail size={12} />
            {t('jobDetail.preview')}
          </Button>
          <Button variant="ghost" size="icon" title={t('jobDetail.openOriginal')}>
            <ExternalLink size={13} />
          </Button>
        </div>
      </div>
    </aside>
  )
}
