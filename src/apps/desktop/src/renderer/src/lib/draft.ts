import { translate, type Lang, type TKey } from '@/i18n'
import type { Candidate, Job } from '@/lib/types'

const romanize: Record<string, string> = {
  Aaron: 'Aaron Zhang',
  林珊: 'Lin Shan',
  陈默: 'Mo Chen'
}

export interface Draft {
  to: string
  subject: string
  subjectOk: boolean
  /** 用 key 而非文案，渲染层按当前语言翻译 */
  subjectNoteKey: TKey
  body: string
  attachment: string
  language: Lang
}

const hasCjk = (s: string) => /[\u4e00-\u9fa5]/.test(s)

/**
 * 求职信语言跟随岗位，而不是界面语言。
 * 给中文岗位投英文信、或给海外岗位投中文信，都是错的。
 */
function jobLanguage(job: Job): Lang {
  const rule = job.subjectRule
  if (rule) {
    return /[A-Za-z]{4,}/.test(rule.template) && !hasCjk(rule.template) ? 'en' : 'zh'
  }
  return hasCjk(job.title) ? 'zh' : 'en'
}

/** 按 JD 约定的主题模板渲染。模板里的占位符由渠道归一化阶段抽出 */
function renderSubject(
  job: Job,
  c: Candidate,
  lang: Lang
): { subject: string; ok: boolean; noteKey: TKey } {
  const rule = job.subjectRule
  const name = romanize[c.name] ?? c.name

  if (!rule) {
    return {
      subject: translate(lang, 'mail.subjectDefaultTemplate', { title: job.title, name: c.name }),
      ok: true,
      noteKey: 'mail.subjectNoteDefault'
    }
  }

  const subject = rule.template
    .replace(/\{姓名\}|\{Name\}/g, c.name)
    .replace(/\{Your Name\}/g, name)
    .replace(/\{岗位名称\}|\{岗位\}|\{Job Title\}|\{Position\}/g, job.title)
    .replace(
      /\{工作年限\}|\{年限\}|\{Years\}/g,
      translate(lang, 'mail.yearsValue', { n: c.years })
    )

  return { subject, ok: true, noteKey: 'mail.subjectNoteRendered' }
}

export function buildEmail(job: Job, c: Candidate): Draft {
  const lang = jobLanguage(job)
  const { subject, ok, noteKey } = renderSubject(job, c, lang)

  // 匹配理由与缺口存在 job_scores 里，按求职者分开；没打分时退到一句泛化描述
  const match = job.matches[c.id]
  const strength = match?.reasons[0]?.detail ?? (lang === 'zh' ? '相关工作经历' : 'relevant experience')
  const gap = match?.gaps[0]

  const body =
    lang === 'en'
      ? `Dear Hiring Team,

I am writing to apply for the ${job.title} role at ${job.company}. I have ${c.years} years of experience in ${c.headline}, and my background lines up closely with what the role asks for: ${strength}.

${gap ? `I am aware that the team may be looking for ${gap}, and I would be glad to walk through how I plan to close that gap in the first months.\n\n` : ''}My resume is attached for your review. I would welcome the chance to talk about how I can contribute.

Best regards,
${romanize[c.name] ?? c.name}
${c.email}`

      : `${job.company} 的招聘负责人，您好：

我在${job.sourceName}上看到「${job.title}」这个岗位，希望应聘。

我目前有 ${c.years} 年${c.headline.replace('·', '工作经验，方向为')}。与岗位最相关的一点是：${strength}。${gap ? `我也注意到岗位对「${gap}」有期待，这部分我准备了具体的学习与补齐计划，可以在沟通时展开说明。` : ''}

随信附上我的简历。如果时间方便，希望能有 20 分钟交流一下岗位的实际挑战。

顺颂商祺
${c.name}
${c.email}`

  return {
    to: job.contactEmail ?? `${job.company.toLowerCase().replace(/\s/g, '')}-recruit@example.com`,
    subject,
    subjectOk: ok,
    subjectNoteKey: noteKey,
    body,
    attachment: translate(lang, 'mail.attachmentLabel', {
      file: c.resumeFile,
      v: c.resumePages + 5
    }),
    language: lang
  }
}
