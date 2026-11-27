import { useEffect, useState } from 'react'
import {
  Briefcase,
  FileText,
  GraduationCap,
  Lightbulb,
  Mail,
  Phone,
  Send,
  Target,
  User
} from 'lucide-react'
import type { ResumeEntryKind, ResumeItemView, ResumeView } from '@core'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/overlay'
import { useI18n } from '@/i18n'
import { useApp } from '@/lib/store'
import { cn } from '@/lib/utils'

/** 条目类型 → 图标。分组标题在各个 Section 上单独写 */
const KIND_ICON: Record<ResumeEntryKind, typeof Briefcase> = {
  experience: Briefcase,
  project: Lightbulb,
  education: GraduationCap
}

function Section({
  title,
  icon: Icon,
  children
}: {
  title: string
  icon?: typeof FileText
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-line px-6 py-4 first:border-t-0">
      <div className="mb-2.5 flex items-center gap-1.5">
        {Icon ? <Icon size={13} className="text-fg-subtle" /> : null}
        <h3 className="text-[11.5px] font-medium uppercase tracking-wider text-fg-muted">
          {title}
        </h3>
      </div>
      {children}
    </section>
  )
}

function TimelineItem({ item }: { item: ResumeItemView }) {
  const Icon = KIND_ICON[item.kind]

  return (
    <div className="border-l border-line pl-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-fg">
          <Icon size={12} className="shrink-0 text-fg-subtle" />
          {item.title}
        </span>
        {item.subtitle ? (
          <span className="text-[11.5px] text-fg-muted">{item.subtitle}</span>
        ) : null}
        {item.period ? (
          <span className="tnum text-[10.5px] text-fg-subtle">{item.period}</span>
        ) : null}
      </div>
      {item.stack ? (
        <div className="mt-1 text-[10.5px] leading-relaxed text-fg-subtle">{item.stack}</div>
      ) : null}
      {item.highlights.length ? (
        <ul className="mt-1.5 space-y-1">
          {item.highlights.map((line, i) => (
            <li key={i} className="flex gap-2 text-[11.5px] leading-relaxed text-fg-muted">
              <span className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-fg-subtle" />
              <span className="min-w-0 flex-1">{line}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/**
 * 简历预览。
 *
 * 数据在打开时才从库里读一次（点开才查库），不在列表页预取。
 * 版式按「一份文档」来排：抬头、简介、技术栈分组、时间线。
 */
export function ResumePreviewDialog({
  candidateId,
  open,
  onClose
}: {
  candidateId: string
  open: boolean
  onClose: () => void
}) {
  const { loadResume, candidate } = useApp()
  const { t } = useI18n()
  const [resume, setResume] = useState<ResumeView | null>(null)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!open) {
      setLoaded(false)
      return
    }
    let alive = true
    setLoading(true)
    void loadResume(candidateId)
      .then((r) => {
        if (!alive) return
        setResume(r)
        setLoaded(true)
      })
      .catch(() => {
        if (!alive) return
        setResume(null)
        setLoaded(true)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [open, candidateId, loadResume])

  const experiences = resume?.items.filter((i) => i.kind === 'experience') ?? []
  const projects = resume?.items.filter((i) => i.kind === 'project') ?? []
  const educations = resume?.items.filter((i) => i.kind === 'education') ?? []

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="lg"
      title={t('resume.previewTitle', { name: candidate.name })}
      desc={t('resume.previewDesc')}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[12px] text-fg-subtle">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          {t('resume.loading')}
        </div>
      ) : null}

      {!loading && loaded && !resume ? (
        <div className="py-14 text-center text-[11.5px] text-fg-subtle">
          {t('resume.notParsed')}
        </div>
      ) : null}

      {!loading && resume ? (
        <div className="-mx-4 -my-3.5">
          {/* 抬头 */}
          <div className="px-6 pb-4 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {resume.contact.phone ? (
                <span className="flex items-center gap-1 text-[10.5px] text-fg-subtle">
                  <Phone size={10} />
                  {resume.contact.phone}
                </span>
              ) : null}
              {candidate.email ? (
                <span className="flex items-center gap-1 text-[10.5px] text-fg-subtle">
                  <Mail size={10} />
                  {candidate.email}
                </span>
              ) : null}
              {resume.contact.telegram ? (
                <span className="flex items-center gap-1 text-[10.5px] text-fg-subtle">
                  <Send size={10} />
                  {resume.contact.telegram}
                </span>
              ) : null}
              <span className="flex items-center gap-1 text-[10.5px] text-fg-subtle">
                <User size={10} />
                {candidate.location} · {t('candidates.fieldYearsValue', { n: candidate.years })}
              </span>
              <span className="flex items-center gap-1 text-[10.5px] text-fg-subtle">
                <FileText size={10} />
                {resume.file} · {t('candidates.resumePages', { n: resume.pages })}
              </span>
            </div>
          </div>

          {resume.profile ? (
            <Section title={t('resume.profile')} icon={User}>
              <div className="space-y-2">
                {resume.profile.split('\n\n').map((para, i) => (
                  <p key={i} className="text-[11.5px] leading-relaxed text-fg-muted">
                    {para}
                  </p>
                ))}
              </div>
            </Section>
          ) : null}

          {resume.intent ? (
            <Section title={t('resume.intent')} icon={Target}>
              <p className="text-[11.5px] leading-relaxed text-fg-muted">{resume.intent}</p>
            </Section>
          ) : null}

          {resume.skills.length ? (
            <Section title={t('resume.skills')} icon={Lightbulb}>
              <div className="space-y-2.5">
                {resume.skills.map((group) => (
                  <div key={group.group}>
                    <div className="mb-1 text-[10.5px] text-fg-subtle">{group.group}</div>
                    <div className="flex flex-wrap gap-1">
                      {group.items.map((item) => (
                        <Badge key={item} tone="neutral">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {experiences.length ? (
            <Section title={t('resume.kindExperience')} icon={Briefcase}>
              <div className="space-y-4">
                {experiences.map((item) => (
                  <TimelineItem key={item.id} item={item} />
                ))}
              </div>
            </Section>
          ) : null}

          {projects.length ? (
            <Section title={t('resume.kindProject')} icon={Lightbulb}>
              <div className="space-y-4">
                {projects.map((item) => (
                  <TimelineItem key={item.id} item={item} />
                ))}
              </div>
            </Section>
          ) : null}

          {educations.length ? (
            <Section title={t('resume.kindEducation')} icon={GraduationCap}>
              <div className="space-y-4">
                {educations.map((item) => (
                  <TimelineItem key={item.id} item={item} />
                ))}
              </div>
            </Section>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  )
}

/** 列表里的简历入口：显示文件名，点击打开预览 */
export function ResumeTrigger({
  candidateId,
  fileName,
  className
}: {
  candidateId: string
  fileName: string
  className?: string
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={t('resume.openPreview')}
        className={cn(
          'min-w-0 flex-1 truncate text-left text-[10.5px] text-fg-muted',
          'hover:text-fg hover:underline decoration-line-strong underline-offset-2',
          className
        )}
      >
        {fileName}
      </button>
      <ResumePreviewDialog
        candidateId={candidateId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
