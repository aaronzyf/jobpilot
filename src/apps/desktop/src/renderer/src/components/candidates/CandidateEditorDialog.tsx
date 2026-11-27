import { useState } from 'react'
import {
  FileText,
  Inbox,
  Mail,
  Send,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UserRound,
  type LucideIcon
} from 'lucide-react'
import type { CandidateProfilePatch } from '@core'
import { Badge, type Tone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { Dialog } from '@/components/ui/overlay'
import { Switch } from '@/components/ui/switch'
import { useI18n, type TKey } from '@/i18n'
import { relativeLabel } from '@/lib/meta'
import { useApp } from '@/lib/store'
import type { Candidate } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ResumeTrigger } from './ResumePreviewDialog'

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
  const { toast, saveCandidateProfile } = useApp()
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
  const [smtpHost, setSmtpHost] = useState(candidate.smtp?.host ?? '')
  const [smtpPort, setSmtpPort] = useState(String(candidate.smtp?.port ?? 465))
  const [pop3Host, setPop3Host] = useState(candidate.pop3?.host ?? '')
  const [pop3Port, setPop3Port] = useState(String(candidate.pop3?.port ?? 995))
  const [pop3Enabled, setPop3Enabled] = useState(candidate.pop3?.enabled ?? false)

  const active = SECTIONS.find((s) => s.key === section) ?? SECTIONS[0]

  /** 端口按字符串编辑，保存时再解析；填不出合法端口就当作未配置 */
  const portOf = (raw: string): number | null => {
    const n = Number.parseInt(raw.trim(), 10)
    return Number.isInteger(n) && n >= 1 && n <= 65535 ? n : null
  }

  const smtpConfigured = Boolean(smtpHost.trim() && portOf(smtpPort))
  const smtpTone: Tone = !smtpConfigured
    ? 'danger'
    : candidate.smtp?.verified
      ? 'success'
      : 'warning'
  const smtpLabel = !smtpConfigured
    ? t('candidates.cannotSend')
    : candidate.smtp?.verified
      ? t('candidates.smtpVerified')
      : t('candidates.smtpUnverified')

  const pop3Configured = Boolean(pop3Host.trim() && portOf(pop3Port))
  const pop3Tone: Tone = !pop3Configured ? 'neutral' : pop3Enabled ? 'success' : 'warning'
  const pop3Label = !pop3Configured
    ? t('candidates.pop3NotConfigured')
    : pop3Enabled
      ? t('candidates.pop3Enabled')
      : t('candidates.pop3Paused')

  const onSave = () => {
    if (!name.trim()) {
      toast(t('candidates.errNameRequired'), 'danger')
      return
    }
    const smtp = smtpHost.trim() && portOf(smtpPort) ? { host: smtpHost.trim(), port: portOf(smtpPort)! } : null
    const pop3 = pop3Host.trim() && portOf(pop3Port)
      ? { host: pop3Host.trim(), port: portOf(pop3Port)!, enabled: pop3Enabled }
      : null
    const patch: CandidateProfilePatch = {
      name: name.trim(),
      headline: headline.trim(),
      location: location.trim(),
      languages: languages
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean),
      note,
      thresholds: { auto, reject },
      dailyCap,
      email: email.trim(),
      smtp,
      pop3
    }
    saveCandidateProfile(candidate.id, patch)
    toast(t('candidates.toastSaved', { name: patch.name }), 'success')
    onClose()
  }

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
            onClick={onSave}
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
                    <ResumeTrigger
                      candidateId={candidate.id}
                      fileName={candidate.resumeFile}
                      className="text-[12px] text-fg"
                    />
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
              </div>

              {/* SMTP：发信 */}
              <div className="rounded-md border border-line bg-surface-2/40 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11.5px] text-fg">
                    <Send size={12} className="text-fg-subtle" />
                    SMTP
                  </span>
                  <Badge tone={smtpTone} dot>
                    {smtpLabel}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label={t('candidates.fieldSmtpHost')}>
                    <Input
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder={t('candidates.smtpHostPlaceholder')}
                    />
                  </Field>
                  <Field label={t('candidates.fieldPort')}>
                    <Input
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      inputMode="numeric"
                      placeholder={t('candidates.portPlaceholder')}
                    />
                  </Field>
                </div>
              </div>

              {/* POP3：收信 */}
              <div className="rounded-md border border-line bg-surface-2/40 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11.5px] text-fg">
                    <Inbox size={12} className="text-fg-subtle" />
                    POP3
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge tone={pop3Tone} dot>
                      {pop3Label}
                    </Badge>
                    <span className="flex items-center gap-1.5 text-[10.5px] text-fg-subtle">
                      <Switch checked={pop3Enabled} onChange={setPop3Enabled} size="sm" />
                      {t('candidates.pop3Enable')}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label={t('candidates.fieldPop3Host')}>
                    <Input
                      value={pop3Host}
                      onChange={(e) => setPop3Host(e.target.value)}
                      placeholder={t('candidates.pop3HostPlaceholder')}
                    />
                  </Field>
                  <Field label={t('candidates.fieldPort')}>
                    <Input
                      value={pop3Port}
                      onChange={(e) => setPop3Port(e.target.value)}
                      inputMode="numeric"
                      placeholder={t('candidates.portPlaceholder')}
                    />
                  </Field>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-fg-subtle">
                  {t('candidates.pop3Hint')}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Dialog>
  )
}
