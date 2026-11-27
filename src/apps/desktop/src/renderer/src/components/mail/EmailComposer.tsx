import { Check, FileText, Paperclip, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/overlay'
import { useT } from '@/i18n'
import type { Candidate, Job } from '@/lib/types'
import { buildEmail } from '@/lib/draft'
import { cn } from '@/lib/utils'

export function EmailComposer({
  open,
  onClose,
  job,
  candidate,
  onSend
}: {
  open: boolean
  onClose: () => void
  job: Job | null
  candidate: Candidate
  onSend: () => void
}) {
  const t = useT()
  if (!job) return null
  const draft = buildEmail(job, candidate)
  const smtpReady = candidate.smtp?.verified === true

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="lg"
      title={t('mail.title')}
      desc={`${job.company} · ${job.title}`}
      footer={
        <>
          <span className="mr-auto flex items-center gap-1.5 text-[10.5px] text-fg-subtle">
            <ShieldCheck size={11} />
            {t('mail.desc')}
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('mail.saveDraft')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!smtpReady}
            onClick={() => {
              onSend()
              onClose()
            }}
          >
            {smtpReady ? t('mail.send') : t('mail.mailNotConfigured')}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[1fr_212px] gap-4">
        <div className="min-w-0">
          <div className="mb-3 space-y-1 rounded-md border border-line bg-surface-2 px-2.5 py-2">
            <div className="flex items-baseline gap-2 text-[11.5px]">
              <span className="w-12 shrink-0 text-fg-subtle">{t('mail.from')}</span>
              <span className="truncate text-fg-muted">
                {candidate.smtp
                  ? t('mail.smtpVerified', { email: candidate.email })
                  : t('mail.noSmtp')}
              </span>
            </div>
            <div className="flex items-baseline gap-2 text-[11.5px]">
              <span className="w-12 shrink-0 text-fg-subtle">{t('mail.to')}</span>
              <span className="truncate font-mono text-[11px] text-fg">{draft.to}</span>
            </div>
            <div className="flex items-baseline gap-2 text-[11.5px]">
              <span className="w-12 shrink-0 text-fg-subtle">{t('mail.subject')}</span>
              <span className="min-w-0 flex-1 truncate text-fg">{draft.subject}</span>
              <Badge tone={draft.subjectOk ? 'success' : 'danger'} dot>
                {draft.subjectOk ? t('mail.subjectMatch') : t('mail.subjectMismatch')}
              </Badge>
            </div>
          </div>

          <div className="max-h-[268px] overflow-y-auto whitespace-pre-wrap rounded-md border border-line bg-surface-2 px-3 py-2.5 text-[12px] leading-[1.72] text-fg-muted">
            {draft.body}
          </div>

          <div className="mt-2 flex items-center gap-2 rounded-md border border-line bg-surface-2 px-2.5 py-2.5">
            <FileText size={13} className="shrink-0 text-danger/80" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11.5px] text-fg">{draft.attachment}</div>
              <div className="text-[10px] text-fg-subtle">{t('mail.attachmentNote')}</div>
            </div>
            <Paperclip size={12} className="shrink-0 text-fg-subtle" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="rounded-md border border-line bg-surface-2 p-2.5">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-fg">
              <Check size={11} className="text-success" />
              {t('mail.ruleCheck')}
            </div>
            {job.subjectRule ? (
              <>
                <div className="text-[10px] leading-relaxed text-fg-subtle">
                  {t('mail.ruleRaw', { v: job.subjectRule.raw })}
                </div>
                <div className="mt-1.5 rounded border border-line bg-surface px-1.5 py-1 font-mono text-[10px] text-fg-muted">
                  {job.subjectRule.template}
                </div>
                <div className="mt-1.5 text-[10px] leading-relaxed text-fg-subtle">
                  {t('mail.ruleExample', { v: job.subjectRule.example })}
                </div>
              </>
            ) : (
              <div className="text-[10px] leading-relaxed text-fg-subtle">
                {t('mail.ruleDefault')}
              </div>
            )}
          </div>

          <div
            className={cn(
              'rounded-md border p-2.5 text-[10.5px] leading-relaxed',
              smtpReady
                ? 'border-line bg-surface-2 text-fg-subtle'
                : 'border-danger/30 bg-danger/8 text-danger/90'
            )}
          >
            {smtpReady ? (
              <>
                <div className="mb-1 flex items-center gap-1.5 text-[11px] text-fg">
                  <ShieldCheck size={11} className="text-success" />
                  {t('mail.preCheck')}
                </div>
                {t('mail.smtpOk', {
                  sent: Math.min(3, candidate.dailyCap),
                  cap: candidate.dailyCap
                })}
              </>
            ) : (
              <>
                <div className="mb-1 flex items-center gap-1.5 text-[11px]">
                  <TriangleAlert size={11} />
                  {t('mail.cannotSend')}
                </div>
                {t('mail.cannotSendHint')}
              </>
            )}
          </div>

          <div className="rounded-md border border-dashed border-line-strong p-2.5 text-[10px] leading-relaxed text-fg-subtle">
            {t('mail.factNote')}
          </div>
        </div>
      </div>
    </Dialog>
  )
}
