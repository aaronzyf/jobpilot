import type {
  ApplicationStatus,
  CommMessage,
  CommStage,
  EmploymentType,
  InterviewFormat,
  InterviewRound,
  InterviewStatus,
  RemoteType,
  Region,
  SubmitChannel,
  Verdict
} from './types'

/**
 * 读模型（read model）。
 *
 * 表结构是写模型：列拆得细、时间戳是整数、没有冗余字段。
 * 页面需要的是一屏能直接渲染的形状：时间已经转成 ISO、统计已经聚合好、
 * 匹配分数按求职者分好组。两者之间的转换在主进程的仓储层完成，
 * 渲染层只吃这里的类型，不直接碰数据库行。
 *
 * 时间一律用 ISO 字符串：跨 IPC 传输后 Date 会退化成字符串，
 * 与其在两边各写一套还原逻辑，不如一开始就用字符串，展示时再用 Intl 格式化。
 */

export interface CandidateStats {
  applied: number
  replied: number
  pending: number
  interview: number
}

export interface CandidateView {
  id: string
  name: string
  headline: string
  years: number
  location: string
  hue: number
  resumeFile: string
  resumeUpdatedAt: string
  resumePages: number
  email: string
  smtp: { host: string; port: number; verified: boolean } | null
  note: string
  languages: string[]
  thresholds: { auto: number; reject: number }
  dailyCap: number
  /** 从投递与面试现算，不落库 */
  stats: CandidateStats
  resumeFacts: { projects: number; experiences: number; skills: number }
}

export interface JobMatchView {
  score: number
  verdict: Verdict
  reasons: { label: string; weight: number; detail: string }[]
  gaps: string[]
}

export interface JobView {
  id: string
  company: string
  hue: number
  title: string
  city: string
  country: string
  workMode: RemoteType
  employment: EmploymentType
  salaryText: string
  sourceId: string
  sourceName: string
  region: Region
  channel: SubmitChannel
  /** 渠道发布时间 */
  postedAt: string
  /** 距现在的小时数，排序用。由 postedAt 现算 */
  postedHours: number
  /** 候选人有打分的岗位才有；键是 candidateId */
  matches: Record<string, JobMatchView>
  tags: string[]
  jdSummary: string
  responsibilities: string[]
  requirements: string[]
  contactEmail?: string
  subjectRule?: { raw: string; template: string; example: string }
  companyMeta: { size: string; stage: string; industry: string; visa: boolean }
  applicants: number
  saved: boolean
}

export interface ApplicationLogView {
  at: string
  label: string
  detail: string
}

export interface ApplicationView {
  id: string
  jobId: string
  candidateId: string
  channel: SubmitChannel
  status: ApplicationStatus
  submittedAt: string
  score: number
  resumeSnapshot: string
  subject?: string
  body?: string
  to?: string
  subjectRuleOk?: boolean
  error?: string
  logs: ApplicationLogView[]
}

export interface SourceView {
  id: string
  name: string
  region: Region
  intervalMin: number
  lastRunAt: string | null
  nextRunAt: string | null
  found: number
  state: 'ok' | 'running' | 'error' | 'paused'
  auth: 'password' | 'cookie' | 'none'
  account: string
  enabled: boolean
  capabilities: string[]
}

export interface ConversationView {
  id: string
  jobId: string
  candidateId: string
  sourceId: string
  peer: { name: string; title: string }
  stage: CommStage
  /** 由未读消息现算：dir='in' 且 readAt 为空 */
  unread: number
  messages: CommMessage[]
}

export interface InterviewView {
  id: string
  jobId: string
  candidateId: string
  sourceId: string
  conversationId?: string
  round: InterviewRound
  roundIndex: number
  roundTotal: number
  status: InterviewStatus
  startsAt: string
  durationMin: number
  format: InterviewFormat
  place: string
  interviewers: { name: string; title: string }[]
  invitedAt: string
  replyBy: string | null
  note: string
}

export interface SavedViewView {
  id: string
  nameKey: string
  /** 命中数按 filter 现算 */
  count: number
}

export interface LlmUsageView {
  labelKey: string
  model: string
  calls: number
  /** 已格式化的金额，如 ¥1.92 */
  cost: string
}

/** 概览页图表：近 7 天的抓取 / 匹配 / 投递 */
export interface TrendPointView {
  /** 本地日期键，形如 11-25；今天的点用 'today' */
  day: string
  found: number
  matched: number
  sent: number
}

/** 近 7 天沟通量 */
export interface CommTrendPointView {
  day: string
  in: number
  out: number
}

/** 今日按小时的抓取量 */
export interface HourlyPointView {
  h: string
  n: number
}

export interface MetricsView {
  trend: TrendPointView[]
  commTrend: CommTrendPointView[]
  hourly: HourlyPointView[]
}

/** 一次拉全，渲染层负责按页切片。数据量小（岗位百级），比逐页请求省事且没有加载态闪烁 */
export interface AppSnapshot {
  candidates: CandidateView[]
  jobs: JobView[]
  applications: ApplicationView[]
  sources: SourceView[]
  conversations: ConversationView[]
  interviews: InterviewView[]
  savedViews: SavedViewView[]
  llmUsage: LlmUsageView[]
  metrics: MetricsView
  /** 上次选中的求职者，存 settings 表 */
  activeCandidateId: string
  /** 数据版本号，写操作后自增，渲染层据此判断是否需要重取 */
  revision: number
}
