import { useState } from 'react'
import {
  FileText,
  Mail,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UserRound,
  type LucideIcon
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { Dialog } from '@/components/ui/overlay'
import { useI18n, type TKey } from '@/i18n'
import { relativeLabel } from '@/lib/meta'
import { useApp } from '@/lib/store'
import type { Candidate } from '@/lib/types'
import { cn } from '@/lib/utils'

type SectionKey = 'profile' | 'resume' | 'matching' | 'delivery'

interface ConfigSection {
  key: SectionKey
  icon: LucideIcon
  label: TKey
  desc: TKey
}

/** 配置分类：左侧菜单与右侧表单共用同一份定义 */
const SECTIONS: ConfigSection[] = [
  {
    key: 'profile',
    icon: UserRound,
    label: 'candidates.sectionProfile',
    desc: 'candidates.sectionProfileDesc'
  },
  {
    key: 'resume',
    icon: FileText,
    label: 'candidates.sectionResume',
    desc: 'candidates.sectionResumeDesc'
  },
  {
    key: 'matching',
    icon: SlidersHorizontal,
    label: 'candidates.sectionMatching',
    desc: 'candidates.sectionMatchingDesc'
  },
  {
    key: 'delivery',
    icon: Mail,
    label: 'candidates.sectionDelivery',
    desc: 'candidates.sectionDeliveryDesc'
  }
]

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-3 border-b border-line pb-2.5">
      <div className="text-[13px] font-medium text-fg">{title}</div>
      <div className="mt-1 text-[10.5px] text-fg-subtle">{desc}</div>
    </div>
  )
}

/**
 * 求职者配置弹窗：求职者管理页与侧栏齿轮按钮共用。
 * 配置项按「基本档案 / 简历与诉求 / 匹配策略 / 投递与邮件」分组，
 * 左侧菜单切换，右侧保持表单式布局。
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
  const [section, setSection] = useState<SectionKey>('profile')

  // 可编辑项统一收进 state，切分类时不会丢掉未保存的修改
  const [name, setName] = useState(candidate.name)
  const [headline, setHeadline] = useState(candidate.headline)
  const [location, setLocation] = useState(candidate.location)
  const [languages, setLanguages] = useState(candidate.languages.join(', '))
  const [note, setNote] = useState(candidate.note)
  const [email, setEmail] = useState(candidate.email)
  const [dailyCap, setDailyCap] = useState(candidate.dailyCap)
  const [auto, setAuto] = useState(candidate.thresholds.auto)
  const [reject, setReject] = useState(candidate.thresholds.reject)

  const active = SECTIONS.find((s) => s.key === section) ?? SECTIONS[0]

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
      <div className="flex min-h-[360px] gap-4">
        <nav className="sticky top-0 w-[152px] shrink-0 self-start space-y-1 border-r border-line pr-3">
          {SECTIONS.map((s) => {
            const Icon = s.icon
            const isActive = s.key === active.key
            return (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                aria-pressed={isActive}
                className={cn(
                  'flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors',
                  isActive
                    ? 'bg-surface-3 text-fg shadow-[inset_0_0_0_1px_var(--inset-highlight)]'
                    : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
                )}
              >
                <Icon
                  size={14}
                  strokeWidth={1.7}
                  className={cn('mt-0.5 shrink-0', isActive ? 'text-accent-strong' : 'text-fg-subtle')}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11.5px] font-medium">{t(s.label)}</span>
                  <span className="mt-0.5 block truncate text-[9.5px] text-fg-subtle">
                    {t(s.desc)}
                  </span>
                </span>
              </button>
            )
          })}
        </nav>

        <div key={section} className="anim-fade min-w-0 flex-1">
          <SectionHeader title={t(active.label)} desc={t(active.desc)} />

          {section === 'profile' ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label={t('candidates.fieldName')}>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label={t('candidates.fieldPosition')}>
                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
              </Field>
              <Field label={t('candidates.fieldLocation')}>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} />
              </Field>
              <Field label={t('candidates.fieldYears')}>
                <Input value={t('candidates.fieldYearsValue', { n: candidate.years })} readOnly />
              </Field>
              <Field className="col-span-2" label={t('candidates.fieldLanguages')}>
                <Input value={languages} onChange={(e) => setLanguages(e.target.value)} />
              </Field>
              <div className="col-span-2 flex items-start gap-2 rounded-md border border-line bg-surface-2/60 px-3 py-2.5 text-[10.5px] leading-relaxed text-fg-subtle">
                <UserRound size={12} className="mt-0.5 shrink-0" />
                <span>{t('candidates.pageDesc')}</span>
              </div>
            </div>
          ) : null}

          {section === 'resume' ? (
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="text-[11.5px] text-fg-muted">{t('candidates.resumeFile')}</span>
                  <span className="text-right text-[10.5px] text-fg-subtle">
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

              <div className="flex items-center gap-1.5 rounded-md border border-line bg-surface-2/50 px-3 py-2 text-[10.5px] text-fg-subtle">
                <Sparkles size={12} className="shrink-0" />
                {t('candidates.facts', {
                  projects: candidate.resumeFacts.projects,
                  experiences: candidate.resumeFacts.experiences,
                  skills: candidate.resumeFacts.skills
                })}
              </div>

              <Field label={t('candidates.fieldNote')} hint={t('candidates.fieldNoteHint')}>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder={t('candidates.fieldNotePlaceholder')}
                />
              </Field>
            </div>
          ) : null}

          {section === 'matching' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface-2/50 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-[11.5px] text-fg">{t('candidates.matchingStatus')}</div>
                  <div className="mt-0.5 text-[10px] leading-relaxed text-fg-subtle">
                    {t('candidates.matchingStatusDesc')}
                  </div>
                </div>
                <Badge tone={candidate.enabled ? 'success' : 'neutral'} dot>
                  {candidate.enabled ? t('candidates.matching') : t('candidates.disabled')}
                </Badge>
              </div>

              <div className="space-y-2 rounded-md border border-line bg-surface-2 px-3 py-2.5">
                <div className="mb-1 text-[11.5px] text-fg-muted">{t('candidates.threshold')}</div>
                <div className="flex items-center gap-3">
                  <span className="w-[86px] shrink-0 text-[11px] text-fg-subtle">
                    {t('candidates.auto')}
                  </span>
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
                  <span className="w-[86px] shrink-0 text-[11px] text-fg-subtle">
                    {t('candidates.reject')}
                  </span>
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
                <div className="border-t border-line pt-2 text-[10px] leading-relaxed text-fg-subtle">
                  {t('candidates.thresholdNote')}
                </div>
              </div>
            </div>
          ) : null}

          {section === 'delivery' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Field label={t('candidates.fieldEmail')}>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field label={t('candidates.fieldDailyCap')}>
                  <Select
                    value={String(dailyCap)}
                    onChange={(e) => setDailyCap(Number(e.target.value))}
                  >
                    {[8, 12, 15, 20, 30].map((n) => (
                      <option key={n} value={n}>
                        {t('candidates.mails', { n })}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t('candidates.fieldSmtpHost')}>
                  <Input
                    value={candidate.smtp?.host ?? t('candidates.smtpNotConfigured')}
                    readOnly
                  />
                </Field>
                <Field label={t('candidates.fieldSmtpPort')}>
                  <Input value={candidate.smtp ? String(candidate.smtp.port) : '—'} readOnly />
                </Field>
              </div>

              <div className="flex items-center justify-between rounded-md border border-line bg-surface-2/50 px-3 py-2">
                <span className="text-[11px] text-fg-muted">{t('candidates.smtpStatus')}</span>
                <Badge
                  tone={
                    !candidate.smtp
                      ? 'danger'
                      : candidate.smtp.verified
                        ? 'success'
                        : 'warning'
                  }
                  dot
                >
                  {!candidate.smtp
                    ? t('candidates.cannotSend')
                    : candidate.smtp.verified
                      ? t('candidates.smtpVerified')
                      : t('candidates.smtpUnverified')}
                </Badge>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Dialog>
  )
}
