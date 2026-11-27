import type {
  ApplicationStatus,
  CommStage,
  InterviewFormat,
  InterviewRound,
  InterviewStatus,
  SubmitChannel,
  Verdict
} from '@core'
import type { Tone } from '@/components/ui/badge'
import type { Lang, TKey } from '@/i18n'

// 这里只存 i18n key，不存文案。渲染层用 t(meta.labelKey) 取词，
// 这样切换语言时所有枚举标签同时变化，不会出现中英混排。

export const statusMeta: Record<ApplicationStatus, { labelKey: TKey; tone: Tone }> = {
  draft: { labelKey: 'meta.statusDraft', tone: 'neutral' },
  pending_confirm: { labelKey: 'meta.statusPending', tone: 'warning' },
  queued: { labelKey: 'meta.statusQueued', tone: 'neutral' },
  sent: { labelKey: 'meta.statusSent', tone: 'success' },
  failed: { labelKey: 'meta.statusFailed', tone: 'danger' },
  replied: { labelKey: 'meta.statusReplied', tone: 'accent' },
  rejected: { labelKey: 'meta.statusRejected', tone: 'neutral' }
}

export const verdictMeta: Record<
  Verdict,
  { labelKey: TKey; tone: Tone; hintKey: TKey }
> = {
  auto: { labelKey: 'meta.verdictAuto', tone: 'accent', hintKey: 'meta.verdictAutoHint' },
  confirm: { labelKey: 'meta.verdictConfirm', tone: 'warning', hintKey: 'meta.verdictConfirmHint' },
  reject: { labelKey: 'meta.verdictReject', tone: 'neutral', hintKey: 'meta.verdictRejectHint' }
}

export const channelMeta: Record<SubmitChannel, { labelKey: TKey; shortKey: TKey }> = {
  email: { labelKey: 'meta.channelEmail', shortKey: 'meta.channelEmailShort' },
  'ats-form': { labelKey: 'meta.channelAtsForm', shortKey: 'meta.channelAtsFormShort' },
  'platform-message': {
    labelKey: 'meta.channelPlatformMessage',
    shortKey: 'meta.channelPlatformShort'
  },
  manual: { labelKey: 'meta.channelManual', shortKey: 'meta.channelManualShort' }
}

/** 沟通阶段。只描述对话进度，不替代 ApplicationStatus */
export const stageMeta: Record<CommStage, { labelKey: TKey; tone: Tone }> = {
  chatting: { labelKey: 'meta.stageChatting', tone: 'neutral' },
  screening: { labelKey: 'meta.stageScreening', tone: 'accent' },
  interview: { labelKey: 'meta.stageInterview', tone: 'warning' },
  offer: { labelKey: 'meta.stageOffer', tone: 'success' },
  closed: { labelKey: 'meta.stageClosed', tone: 'neutral' }
}

// ---------------------------------------------------------------- 面试邀约（R13）

/** 邀约状态：描述「这场面试答复到哪一步」，与面试是否已经发生无关 */
export const interviewStatusMeta: Record<
  InterviewStatus,
  { labelKey: TKey; tone: Tone }
> = {
  invited: { labelKey: 'meta.ivInvited', tone: 'warning' },
  accepted: { labelKey: 'meta.ivAccepted', tone: 'success' },
  rescheduled: { labelKey: 'meta.ivRescheduled', tone: 'accent' },
  declined: { labelKey: 'meta.ivDeclined', tone: 'neutral' },
  done: { labelKey: 'meta.ivDone', tone: 'neutral' },
  cancelled: { labelKey: 'meta.ivCancelled', tone: 'neutral' }
}

export const interviewFormatMeta: Record<InterviewFormat, TKey> = {
  video: 'meta.ivFormatVideo',
  onsite: 'meta.ivFormatOnsite',
  phone: 'meta.ivFormatPhone'
}

export const interviewRoundMeta: Record<InterviewRound, TKey> = {
  phone: 'meta.ivRoundPhone',
  technical: 'meta.ivRoundTechnical',
  design: 'meta.ivRoundDesign',
  manager: 'meta.ivRoundManager',
  hr: 'meta.ivRoundHr',
  final: 'meta.ivRoundFinal'
}

export type WorkMode = 'remote' | 'hybrid' | 'onsite'

export const workModeMeta: Record<WorkMode, { labelKey: TKey; tone: Tone }> = {
  remote: { labelKey: 'meta.workModeRemote', tone: 'accent' },
  hybrid: { labelKey: 'meta.workModeHybrid', tone: 'neutral' },
  onsite: { labelKey: 'meta.workModeOnsite', tone: 'neutral' }
}

export type Employment = 'fulltime' | 'parttime' | 'intern' | 'contract'

export const employmentMeta: Record<Employment, TKey> = {
  fulltime: 'meta.employmentFulltime',
  parttime: 'meta.employmentParttime',
  intern: 'meta.employmentIntern',
  contract: 'meta.employmentContract'
}

export type SourceState = 'ok' | 'running' | 'error' | 'paused'

export const sourceStateMeta: Record<SourceState, { labelKey: TKey; tone: Tone; dot: string }> = {
  ok: { labelKey: 'meta.sourceOk', tone: 'success', dot: 'bg-success' },
  running: { labelKey: 'meta.sourceRunning', tone: 'accent', dot: 'bg-accent' },
  error: { labelKey: 'meta.sourceError', tone: 'danger', dot: 'bg-danger' },
  paused: { labelKey: 'meta.sourcePaused', tone: 'neutral', dot: 'bg-fg-subtle' }
}

export type AuthKind = 'password' | 'cookie' | 'none'

export const authMeta: Record<AuthKind, TKey> = {
  password: 'meta.authPassword',
  cookie: 'meta.authCookie',
  none: 'meta.authNone'
}

export function scoreTone(score: number, thresholds: { auto: number; reject: number }): Tone {
  if (score >= thresholds.auto) return 'accent'
  if (score >= thresholds.reject) return 'warning'
  return 'neutral'
}

export function scoreBarClass(score: number, thresholds: { auto: number; reject: number }): string {
  if (score >= thresholds.auto) return 'bg-accent'
  if (score >= thresholds.reject) return 'bg-warning'
  return 'bg-surface-4'
}

/** 首页问候语按当前时间返回对应的 key */
export function greetingKey(): TKey {
  const h = new Date().getHours()
  if (h < 6) return 'greeting.dawn'
  if (h < 11) return 'greeting.morning'
  if (h < 14) return 'greeting.noon'
  if (h < 18) return 'greeting.afternoon'
  return 'greeting.evening'
}

const locale = (lang: Lang): string => (lang === 'zh' ? 'zh-CN' : 'en-US')

/** 日期按当前语言格式化，避免出现「2026 年 11 月 27 日」出现在英文界面 */
export function todayLabel(lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), {
    year: 'numeric',
    month: lang === 'zh' ? 'long' : 'short',
    day: 'numeric',
    weekday: 'long'
  }).format(new Date())
}

/** 09:42 / 9:42 AM。时间一律从 ISO 现算，不把「今天 09:42」写进数据 */
export function clockLabel(lang: Lang, iso: string): string {
  return new Intl.DateTimeFormat(locale(lang), {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso))
}

/**
 * 18 分钟前 / in 2 hours。
 * 正负两个方向都要成立：这里算的是「与现在的时间差」，不是「已过去多久」。
 * 一周以上直接给日期：再往后「9 天前」的信息量不如具体日子。
 */
export function relativeLabel(lang: Lang, iso: string): string {
  const target = new Date(iso).getTime()
  const diffMin = Math.round((target - Date.now()) / 60_000)
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: 'auto', style: 'short' })
  // 未来为正、过去为负；至少按 1 个单位算，避免出现「此刻」
  const signed = (n: number) => (diffMin >= 0 ? Math.max(1, n) : -Math.max(1, n))
  const abs = Math.abs(diffMin)
  if (abs < 60) return rtf.format(signed(abs), 'minute')
  const hours = Math.round(abs / 60)
  if (hours < 24) return rtf.format(signed(hours), 'hour')
  const days = Math.round(hours / 24)
  if (days <= 6) return rtf.format(signed(days), 'day')
  return new Intl.DateTimeFormat(locale(lang), { month: 'short', day: 'numeric' }).format(
    new Date(iso)
  )
}

/**
 * 列表里的时间列：今天只给时刻（09:42），更早给「昨天 16:20」「3 天前 11:03」。
 * 不把这种组合写进数据，语言切换时同一个时间戳要能重新拼。
 */
export function atLabel(lang: Lang, iso: string): string {
  if (dayDiff(iso) === 0) return clockLabel(lang, iso)
  return `${relativeLabel(lang, iso)} ${clockLabel(lang, iso)}`
}

/** 按本地日历算天数差：0 = 今天，1 = 昨天。用于消息流里的日期分隔 */
export function dayDiff(iso: string): number {
  const then = new Date(iso)
  then.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((now.getTime() - then.getTime()) / 86_400_000)
}

/** 分隔条上的短日期：11月25日 / Nov 25 */
export function dayLabel(lang: Lang, iso: string): string {
  return new Intl.DateTimeFormat(locale(lang), { month: 'short', day: 'numeric' }).format(
    new Date(iso)
  )
}

/** 周六 / Sat */
export function weekdayLabel(lang: Lang, iso: string): string {
  return new Intl.DateTimeFormat(locale(lang), { weekday: 'short' }).format(new Date(iso))
}

/**
 * 11月28日 周六 / Sat, Nov 28。
 * 中英文的日期与星期顺序本来就不一样，交给各自的语序拼，不硬套一个模板。
 */
export function dateLineLabel(lang: Lang, iso: string): string {
  const day = dayLabel(lang, iso)
  const weekday = weekdayLabel(lang, iso)
  return lang === 'zh' ? `${day} ${weekday}` : `${weekday}, ${day}`
}

/** 相对今天的天数：明天 +1、昨天 -1。日程类页面要用正数方向，dayDiff 是反的 */
export function dayOffset(iso: string): number {
  const then = new Date(iso)
  then.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((then.getTime() - now.getTime()) / 86_400_000)
}
