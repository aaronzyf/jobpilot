export type Region = 'cn' | 'global'
export type EmploymentType = 'fulltime' | 'parttime' | 'intern' | 'contract'
export type RemoteType = 'remote' | 'hybrid' | 'onsite'

/** 投递通道。与招聘渠道解耦：同一渠道的岗位可能走不同通道 */
export type SubmitChannel = 'email' | 'ats-form' | 'platform-message' | 'manual'

/** R4 三档。reject 只是标记，数据不丢，阈值调整后可重新出现 */
export type Verdict = 'auto' | 'confirm' | 'reject'

export type ApplicationStatus =
  | 'draft'
  | 'pending_confirm'
  | 'queued'
  | 'sent'
  | 'failed'
  | 'replied'
  | 'rejected'

// ---------------------------------------------------------------- 元信息

export interface SourceMeta {
  id: string
  name: string
  region: Region
  homepage: string
  /** 对外声明。与真实实现的一致性由 assertSourceContract 在启动时校验 */
  capabilities: {
    list: boolean
    detail: boolean
    apply: SubmitChannel | 'none'
  }
  defaults: {
    refreshIntervalMin: number
    maxItemsPerRun: number
  }
}

// ---------------------------------------------------------------- 渠道原始数据

export interface ApplyHints {
  /** JD 里留的邮箱，用于 R8 邮件投递 */
  emails: string[]
  /** 跳官网 / ATS 表单 */
  externalUrl?: string
  /** JD 约定的邮件主题原文，例如「姓名+应聘岗位+工作年限」 */
  subjectRuleRaw?: string
}

export interface RawJobSummary {
  externalId: string
  company: string
  title: string
  city?: string
  salaryText?: string
  url?: string
  postedAt?: Date
}

export interface RawJobDetail {
  externalId: string
  description: string
  salaryText?: string
  applyHints: ApplyHints
  raw?: unknown
}

// ---------------------------------------------------------------- 归一化结果

/** 渠道差异在 normalizer 里消化掉，落到这里就是统一形状 */
export interface NormalizedJob {
  sourceId: string
  externalId: string
  company: string
  title: string
  city?: string
  country?: string
  remoteType?: RemoteType
  employmentType?: EmploymentType
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  description?: string
  contactEmails?: string[]
  externalUrl?: string
  submitChannel?: SubmitChannel
  postedAt?: Date
}

// ---------------------------------------------------------------- 查询条件

/** 可下推到渠道侧的筛选。剩下的筛选留在本地做 */
export interface ListQuery {
  keywords?: string[]
  excludeKeywords?: string[]
  cities?: string[]
  employmentType?: EmploymentType[]
  remote?: RemoteType
  salaryMin?: number
  /** 只取该时间之后发布的 */
  since?: Date
  /** 断点续爬 */
  cursor?: string
}

// ---------------------------------------------------------------- 匹配（R2 / R4）

export interface ScoreDimensions {
  skill: number
  experience: number
  salary: number
  location: number
}

export interface MatchResult {
  /** 0-100 */
  score: number
  verdict: Verdict
  dimensions: ScoreDimensions
  /** 给用户看的理由，不是给模型看的 */
  reason: string
  model: string
}

/** 匹配用的求职者视图。note 来自 R9 的自由文本配置 */
export interface MatchInput {
  candidateId: string
  resumeText: string
  /** R9：用户填写的要求与偏好 */
  note?: string
  job: NormalizedJob
}

// ---------------------------------------------------------------- 沟通记录（R12）

/**
 * 和招聘方的对话走到哪一步。
 * 只描述对话本身，不替代 ApplicationStatus：一个岗位可能还没投递就开始聊，
 * 也可能投递后才转入沟通，两者分开存，避免互相覆盖。
 */
export type CommStage = 'chatting' | 'screening' | 'interview' | 'offer' | 'closed'

/** in：对方发来；out：求职者发出 */
export type MessageDirection = 'in' | 'out'

export interface CommMessage {
  id: string
  /** ISO 时间字符串。不存「18 分钟前」这类本地化文案，展示时才按界面语言格式化 */
  at: string
  dir: MessageDirection
  /** 正文。对话内容本身不翻译，与岗位标题同理 */
  text: string
}

export interface Conversation {
  id: string
  jobId: string
  candidateId: string
  /** 与 Job.sourceId 对齐，用来取平台名与头像色 */
  sourceId: string
  /** 对话对方：HR / 招聘者 */
  peer: { name: string; title: string }
  stage: CommStage
  /** 未读数，0 表示已读完 */
  unread: number
  /** 按时间正序，最后一条即列表预览 */
  messages: CommMessage[]
}

// ---------------------------------------------------------------- 面试邀约（R13）

/**
 * 面试轮次。与 CommStage 无关：沟通到「面试中」只是对话状态的描述，
 * 而这里要回答的是「这是第几轮、什么形式、在哪里」，两者不能互相替代。
 */
export type InterviewRound = 'phone' | 'technical' | 'design' | 'manager' | 'hr' | 'final'

export type InterviewFormat = 'video' | 'onsite' | 'phone'

/**
 * 邀约自身的状态，描述「这场面试的答复结果」。
 * done / cancelled 与时间无关地存在：过了时间但没人改状态时，展示层按时间兜底。
 */
export type InterviewStatus =
  | 'invited'
  | 'accepted'
  | 'rescheduled'
  | 'declined'
  | 'done'
  | 'cancelled'

export interface Interview {
  id: string
  jobId: string
  candidateId: string
  sourceId: string
  /** 对应 Conversation.id，可从邀约跳回沟通记录；平台没有对话时为空 */
  conversationId?: string
  round: InterviewRound
  /** 第 roundIndex 轮，共 roundTotal 轮。用来画轮次进度 */
  roundIndex: number
  roundTotal: number
  status: InterviewStatus
  /** 开始时间，ISO */
  startsAt: string
  /** 时长（分钟）。结束时间由 startsAt + durationMin 算出，不单独存 */
  durationMin: number
  format: InterviewFormat
  /** 视频会议链接 / 现场地址 / 电话号码，含义由 format 决定 */
  place: string
  interviewers: { name: string; title: string }[]
  /** 邀约送达时间，ISO */
  invitedAt: string
  /** 回复截止时间；对方没给就是 null */
  replyBy: string | null
  /** 对方附的说明与准备要求 */
  note: string
}

// ---------------------------------------------------------------- 简历正文

/**
 * 简历正文里的条目类型。
 * 工作经历、项目、教育背景三类：结构相同，只是渲染时的标题层级不同。
 */
export type ResumeEntryKind = 'experience' | 'project' | 'education'

/** 简历里的联系方式。邮箱在 candidates 表，这里放电话、Telegram、主页这类 */
export interface ResumeContact {
  phone?: string
  telegram?: string
  site?: string
}

/** 技术栈分组：一组技能一个名字，如「前端」「移动端」 */
export interface ResumeSkillGroup {
  group: string
  items: string[]
}

// ---------------------------------------------------------------- 求职者配置写入

/** 邮件收发端点。host 为空表示未配置，落库时写 null */
export interface MailEndpoint {
  host: string
  port: number
}

/** POP3 收信端点。enabled 只表示是否启用拉取，不代表已连通 */
export interface Pop3Endpoint extends MailEndpoint {
  enabled: boolean
}

/**
 * 求职者档案配置的可写部分。
 * 只覆盖弹窗里能改的字段，resumeFile、stats、enabled 等不在其中。
 */
export interface CandidateProfilePatch {
  name: string
  headline: string
  location: string
  languages: string[]
  note: string
  thresholds: { auto: number; reject: number }
  dailyCap: number
  email: string
  smtp: MailEndpoint | null
  pop3: Pop3Endpoint | null
}
