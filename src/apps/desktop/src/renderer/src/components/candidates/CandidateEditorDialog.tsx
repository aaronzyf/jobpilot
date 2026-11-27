import { useState } from 'react'
import { FileText, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { Dialog } from '@/components/ui/overlay'
import { useI18n } from '@/i18n'
import { relativeLabel } from '@/lib/meta'
import { useApp } from '@/lib/store'
import type { Candidate } from '@/lib/types'

/**
 * 求职者配置弹窗：求职者管理页与侧栏齿轮按钮共用。
 * 渲染位置由调用方决定，配置本身不依赖当前页面。
 */
export function CandidateEditorDialog({
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
