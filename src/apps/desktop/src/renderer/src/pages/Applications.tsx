import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  CheckCheck,
  Download,
  FileText,
  Mail,
  RotateCw,
  TriangleAlert,
  X
} from 'lucide-react'
import { Mark, PersonAvatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form'
import { Empty, KeyValue } from '@/components/ui/misc'
import { Segmented } from '@/components/ui/switch'
import { EmailComposer } from '@/components/mail/EmailComposer'
import { atLabel, channelMeta, statusMeta } from '@/lib/meta'
import type { ApplicationRow } from '@/lib/types'
import { useI18n } from '@/i18n'
import { useApp } from '@/lib/store'
import { useMediaQuery } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import type { ApplicationStatus } from '@core'

type Tab = ApplicationStatus | 'all'

export function Applications() {
  const { candidate, go, toast, applications, candidates, jobs } = useApp()
  const { t, lang } = useI18n()
  const wide = useMediaQuery('(min-width: 1220px)')
  const [tab, setTab] = useState<Tab>('all')
  const [scope, setScope] = useState<'all' | 'me'>('all')
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mailApp, setMailApp] = useState<ApplicationRow | null>(null)

  const rows = useMemo(() => {
    return applications.filter((a) => {
      if (tab !== 'all' && a.status !== tab) return false
      if (scope === 'me' && a.candidateId !== candidate.id) return false
      if (q.trim()) {
        const job = jobs.find((j) => j.id === a.jobId)
        const hay = `${job?.title ?? ''} ${job?.company ?? ''}`.toLowerCase()
        if (!hay.includes(q.trim().toLowerCase())) return false
      }
      return true
    })
  }, [tab, scope, q, candidate.id, applications, jobs])

  const count = (s: ApplicationStatus) => applications.filter((a) => a.status === s).length
  const selected = applications.find((a) => a.id === selectedId) ?? null
  const selectedJob = selected ? jobs.find((j) => j.id === selected.jobId) : null
  const selectedCand = selected ? candidates.find((c) => c.id === selected.candidateId) : null

  const mailJob = mailApp ? jobs.find((j) => j.id === mailApp.jobId) ?? null : null
  const mailCandidate = mailApp
    ? candidates.find((c) => c.id === mailApp.candidateId) ?? candidate
    : candidate

  return (
    <div className="relative flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b border-line px-5 py-2">
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: 'all', label: t('applications.tabAll'), badge: applications.length },
              {
                value: 'pending_confirm',
                label: t('applications.tabPending'),
                badge: count('pending_confirm')
              },
              { value: 'sent', label: t('applications.tabSent'), badge: count('sent') },
              { value: 'replied', label: t('applications.tabReplied'), badge: count('replied') },
              { value: 'failed', label: t('applications.tabFailed'), badge: count('failed') }
            ]}
          />

          <div className="ml-auto flex items-center gap-1.5">
            <Segmented
              value={scope}
              onChange={setScope}
              options={[
                { value: 'all', label: t('applications.allCandidates') },
                { value: 'me', label: candidate.name }
              ]}
            />
            <div className="relative hidden min-[1100px]:block">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('applications.searchPlaceholder')}
                className="h-7 w-[124px] text-[11.5px]"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => toast(t('applications.toastExport'), 'success')}
            >
              <Download size={12} />
              {t('common.export')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                toast(t('applications.toastConfirmAll', { n: count('pending_confirm') }), 'success')
              }
            >
              <CheckCheck size={12} />
              {t('applications.batchConfirm')}
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[680px] table-fixed border-collapse text-[12px]">
            <thead className="sticky top-0 z-10 bg-bg/95 backdrop-blur">
              <tr className="border-b border-line text-left text-[10.5px] text-fg-subtle">
                <th className="py-2 pl-5 pr-2 font-normal">{t('applications.colCompany')}</th>
                <th className="w-[96px] px-2 font-normal">{t('applications.colCandidate')}</th>
                <th className="w-[76px] px-2 font-normal">{t('applications.colChannel')}</th>
                <th className="w-[78px] px-2 font-normal">{t('applications.colScore')}</th>
                <th className="w-[112px] px-2 font-normal">{t('applications.colStatus')}</th>
                <th className="w-[100px] px-2 font-normal">{t('applications.colTime')}</th>
                <th className="w-[88px] px-2 font-normal">{t('applications.colActions')}</th>
                <th className="w-6 pr-4" />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const job = jobs.find((j) => j.id === a.jobId)
                const cand = candidates.find((c) => c.id === a.candidateId)
                const meta = statusMeta[a.status]
                const active = a.id === selectedId
                return (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className={cn(
                      'border-b border-line/70 transition-colors',
                      active ? 'bg-accent/[0.07]' : 'hover:bg-surface-2/70'
                    )}
                  >
                    <td className="py-2 pl-5 pr-2">
                      <div className="flex items-center gap-2">
                        <Mark text={job?.company ?? '?'} hue={job?.hue ?? 220} size={22} />
                        <div className="min-w-0">
                          <div className="truncate text-[12px] text-fg">{job?.title}</div>
                          <div className="truncate text-[10.5px] text-fg-subtle">{job?.company}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2">
                      <div className="flex items-center gap-1.5">
                        <PersonAvatar name={cand?.name ?? '?'} hue={cand?.hue ?? 220} size={16} />
                        <span className="truncate text-[11px] text-fg-muted">{cand?.name}</span>
                      </div>
                    </td>
                    <td className="px-2 text-[11px] text-fg-muted">
                      {t(channelMeta[a.channel].shortKey)}
                    </td>
                    <td className="px-2">
                      <span className="tnum text-[11px] text-fg-muted">{a.score}</span>
                    </td>
                    <td className="px-2">
                      <Badge tone={meta.tone} dot>
                        {t(meta.labelKey)}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-2 text-[10.5px] text-fg-subtle">{atLabel(lang, a.submittedAt)}</td>
                    <td className="px-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5">
                        {a.channel === 'email' ? (
                          <button
                            title={t('applications.actionPreviewMail')}
                            onClick={() => setMailApp(a)}
                            className="flex h-6 w-6 items-center justify-center rounded text-fg-subtle hover:bg-surface-3 hover:text-fg"
                          >
                            <Mail size={12} />
                          </button>
                        ) : null}
                        <button
                          title={t('applications.actionSnapshot')}
                          onClick={() => setSelectedId(a.id)}
                          className="flex h-6 w-6 items-center justify-center rounded text-fg-subtle hover:bg-surface-3 hover:text-fg"
                        >
                          <FileText size={12} />
                        </button>
                        <button
                          title={t('applications.actionOpenJob')}
                          onClick={() => job && go('jobs', job.id)}
                          className="flex h-6 w-6 items-center justify-center rounded text-fg-subtle hover:bg-surface-3 hover:text-fg"
                        >
                          <ArrowUpRight size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="pr-4" />
                  </tr>
                )
              })}
            </tbody>
          </table>

          {rows.length === 0 ? (
            <Empty title={t('applications.emptyTitle')} hint={t('applications.emptyHint')} />
          ) : null}
        </div>

        <div className="flex h-7 shrink-0 items-center gap-3 overflow-hidden border-t border-line px-5 text-[10.5px] text-fg-subtle">
          <span className="truncate">{t('applications.footerCount', { n: rows.length })}</span>
          <span className="ml-auto shrink-0 whitespace-nowrap">
            {t('applications.footerRetention')}
          </span>
        </div>
      </div>

      {selected && !wide ? (
        <div className="absolute inset-0 z-10 bg-scrim-soft" onClick={() => setSelectedId(null)} />
      ) : null}

      {selected && selectedJob && selectedCand ? (
        <div
          className={cn(
            !wide &&
              'absolute inset-y-0 right-0 z-20 shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.8)]'
          )}
        >
        <aside className="anim-slide flex h-full w-[396px] shrink-0 flex-col border-l border-line bg-surface">
          <div className="flex items-start gap-2.5 border-b border-line px-4 py-3">
            <Mark text={selectedJob.company} hue={selectedJob.hue} size={30} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium">{selectedJob.title}</div>
              <div className="mt-0.5 truncate text-[10.5px] text-fg-subtle">
                {selectedJob.company} · {selectedCand.name} · {atLabel(lang, selected.submittedAt)}
              </div>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-fg-subtle hover:bg-surface-3 hover:text-fg"
            >
              <X size={14} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
              <Badge tone={statusMeta[selected.status].tone} dot>
                {t(statusMeta[selected.status].labelKey)}
              </Badge>
              <span className="text-[10.5px] text-fg-subtle">
                {t('applications.channelScore', {
                  channel: t(channelMeta[selected.channel].labelKey),
                  n: selected.score
                })}
              </span>
              <div className="ml-auto flex gap-1">
                {selected.status === 'failed' ? (
                  <Button
                    size="xs"
                    variant="primary"
                    className="gap-1"
                    onClick={() => toast(t('applications.toastRetry'), 'success')}
                  >
                    <RotateCw size={10} />
                    {t('applications.retry')}
                  </Button>
                ) : null}
                {selected.channel === 'email' ? (
                  <Button
                    size="xs"
                    variant="outline"
                    className="gap-1"
                    onClick={() => setMailApp(selected)}
                  >
                    <Mail size={10} />
                    {t('applications.mailContent')}
                  </Button>
                ) : null}
              </div>
            </div>

            {selected.error ? (
              <div className="mx-4 mt-3 flex items-start gap-1.5 rounded-md border border-danger/25 bg-danger/8 px-2.5 py-2 text-[11px] leading-relaxed text-danger/90">
                <TriangleAlert size={12} className="mt-px shrink-0" />
                {selected.error}
              </div>
            ) : null}

            <div className="px-4 py-3">
              <div className="mb-1.5 text-[11px] font-medium">{t('applications.contentBlock')}</div>
              <KeyValue label={t('applications.recipient')}>
                <span className="font-mono text-[10.5px]">{selected.to ?? '—'}</span>
              </KeyValue>
              <KeyValue label={t('applications.subject')}>
                {selected.subject ?? (
                  <span className="text-fg-subtle">{t('applications.noSubject')}</span>
                )}
              </KeyValue>
              {selected.subject ? (
                <KeyValue label={t('applications.subjectCheck')}>
                  {selected.subjectRuleOk ? (
                    <span className="text-success">{t('applications.subjectOk')}</span>
                  ) : (
                    <span className="text-danger">{t('applications.subjectFail')}</span>
                  )}
                </KeyValue>
              ) : null}
              <KeyValue label={t('applications.resumeSnapshot')}>{selected.resumeSnapshot}</KeyValue>

              {selected.body ? (
                <div className="mt-2 max-h-[168px] overflow-y-auto whitespace-pre-wrap rounded-md border border-line bg-surface-2 px-2.5 py-2 text-[11px] leading-relaxed text-fg-muted">
                  {selected.body}
                </div>
              ) : null}
            </div>

            <div className="border-t border-line px-4 py-3">
              <div className="mb-2.5 text-[11px] font-medium">{t('applications.trace')}</div>
              <div className="relative space-y-3 pl-4">
                <div className="absolute bottom-1 left-[3px] top-1 w-px bg-line" />
                {selected.logs.map((l, i) => (
                  <div key={`${l.at}-${i}`} className="relative">
                    <span
                      className={cn(
                        'absolute -left-4 top-[5px] h-[7px] w-[7px] rounded-full ring-2 ring-surface',
                        i === selected.logs.length - 1
                          ? selected.status === 'failed'
                            ? 'bg-danger'
                            : 'bg-accent'
                          : 'bg-surface-4'
                      )}
                    />
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] text-fg">{l.label}</span>
                      <span className="text-[10px] text-fg-subtle">{atLabel(lang, l.at)}</span>
                    </div>
                    <div className="mt-0.5 text-[10.5px] leading-relaxed text-fg-subtle">
                      {l.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-line bg-surface-2/60 px-3 py-2.5">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={() => go('jobs', selectedJob.id)}
            >
              {t('applications.openJobDetail')}
              <ArrowUpRight size={12} />
            </Button>
          </div>
        </aside>
        </div>
      ) : null}

      <EmailComposer
        open={mailApp !== null}
        onClose={() => setMailApp(null)}
        job={mailJob}
        candidate={mailCandidate}
        onSend={() => toast(t('applications.toastResent'), 'success')}
      />
    </div>
  )
}
