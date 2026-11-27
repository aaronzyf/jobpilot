import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type {
  ApplicationStatus,
  CommStage,
  EmploymentType,
  InterviewFormat,
  InterviewRound,
  InterviewStatus,
  MessageDirection,
  RemoteType,
  Region,
  ResumeContact,
  ResumeEntryKind,
  ResumeSkillGroup,
  SubmitChannel,
  Verdict
} from '../../../../../packages/core/src/domain/types'

// 表结构即契约：列名 snake_case（给 SQL 看），TS 字段 camelCase（给代码看）。
// 时间一律存毫秒时间戳，不存「2 小时前」这类文案——文案是渲染层按语言现算的。

// ---------------------------------------------------------------- 求职者

export const candidates = sqliteTable('candidates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  headline: text('headline').notNull(),
  years: integer('years').notNull(),
  location: text('location').notNull(),
  /** 头像色相。只是视觉参数，不参与业务判断 */
  hue: integer('hue').notNull(),
  email: text('email').notNull(),
  languages: text('languages', { mode: 'json' }).$type<string[]>().notNull(),
  /** R9：给匹配模型看的自然语言补充要求 */
  note: text('note').notNull(),
  thresholdAuto: integer('threshold_auto').notNull(),
  thresholdReject: integer('threshold_reject').notNull(),
  dailyCap: integer('daily_cap').notNull(),
  resumeFile: text('resume_file').notNull(),
  resumeUpdatedAt: integer('resume_updated_at', { mode: 'timestamp_ms' }).notNull(),
  resumePages: integer('resume_pages').notNull(),
  smtpHost: text('smtp_host'),
  smtpPort: integer('smtp_port'),
  smtpVerified: integer('smtp_verified', { mode: 'boolean' }).notNull().default(false),
  /** POP3 收信配置：用于拉取招聘方回复。host/port 为空表示未配置 */
  pop3Host: text('pop3_host'),
  pop3Port: integer('pop3_port'),
  pop3Enabled: integer('pop3_enabled', { mode: 'boolean' }).notNull().default(false),
  /** 简历事实库规模。真实实现里应来自 fact_base 表，这里先按求职者汇总 */
  factProjects: integer('fact_projects').notNull().default(0),
  factExperiences: integer('fact_experiences').notNull().default(0),
  factSkills: integer('fact_skills').notNull().default(0),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  /** 禁用后不参与后台匹配；历史分数与投递记录保留 */
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull()
})

// ---------------------------------------------------------------- 简历正文

/**
 * 简历解析结果。
 *
 * candidates 上的 resume_file / resume_pages 只是「这份简历叫什么、几页」，
 * 这里存的是解析出来的内容本身：个人简介、求职意向、技术栈分组与时间线。
 * 两者按 candidate_id 一一对应，档案换简历就整份替换。
 */
export const resumeDocuments = sqliteTable(
  'resume_documents',
  {
    candidateId: text('candidate_id')
      .primaryKey()
      .references(() => candidates.id, { onDelete: 'cascade' }),
    /** 个人简介 */
    profile: text('profile').notNull().default(''),
    /** 求职意向 */
    intent: text('intent').notNull().default(''),
    /** 技术栈分组 */
    skills: text('skills', { mode: 'json' }).$type<ResumeSkillGroup[]>().notNull(),
    /** 联系方式：电话、Telegram、主页 */
    contact: text('contact', { mode: 'json' }).$type<ResumeContact>().notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull()
  },
  (t) => [index('idx_resume_docs_candidate').on(t.candidateId)]
)

/** 简历时间线：工作经历、项目、教育背景 */
export const resumeItems = sqliteTable(
  'resume_items',
  {
    id: text('id').primaryKey(),
    candidateId: text('candidate_id')
      .notNull()
      .references(() => candidates.id, { onDelete: 'cascade' }),
    kind: text('kind').$type<ResumeEntryKind>().notNull(),
    /** 公司 / 项目 / 学校 */
    title: text('title').notNull(),
    /** 职位 */
    subtitle: text('subtitle').notNull().default(''),
    /** 时间区间，如 2024.01 – 2025.04 */
    period: text('period').notNull().default(''),
    /** 技术栈 */
    stack: text('stack').notNull().default(''),
    /** 要点，逐条列出 */
    highlights: text('highlights', { mode: 'json' }).$type<string[]>().notNull(),
    position: integer('position').notNull().default(0)
  },
  (t) => [index('idx_resume_items_candidate').on(t.candidateId, t.position)]
)

// ---------------------------------------------------------------- 渠道

export const sources = sqliteTable('sources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  region: text('region').$type<Region>().notNull(),
  intervalMin: integer('interval_min').notNull(),
  lastRunAt: integer('last_run_at', { mode: 'timestamp_ms' }),
  nextRunAt: integer('next_run_at', { mode: 'timestamp_ms' }),
  foundCount: integer('found_count').notNull().default(0),
  state: text('state').$type<'ok' | 'running' | 'error' | 'paused'>().notNull().default('ok'),
  auth: text('auth').$type<'password' | 'cookie' | 'none'>().notNull().default('none'),
  account: text('account').notNull().default(''),
  /** 能力声明。列表/详情/投递方式由适配器上报，UI 只读 */
  capabilities: text('capabilities', { mode: 'json' }).$type<string[]>().notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  sort: integer('sort').notNull().default(0)
})

// ---------------------------------------------------------------- 岗位（池）

export const jobs = sqliteTable(
  'jobs',
  {
    id: text('id').primaryKey(),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'cascade' }),
    /** 渠道内的原始 ID，投递幂等键的一部分 */
    externalId: text('external_id'),
    company: text('company').notNull(),
    companyHue: integer('company_hue').notNull().default(220),
    title: text('title').notNull(),
    city: text('city').notNull(),
    country: text('country').notNull(),
    workMode: text('work_mode').$type<RemoteType>().notNull(),
    employmentType: text('employment_type').$type<EmploymentType>().notNull(),
    salaryText: text('salary_text').notNull(),
    salaryMin: integer('salary_min'),
    salaryMax: integer('salary_max'),
    salaryCurrency: text('salary_currency'),
    region: text('region').$type<Region>().notNull(),
    submitChannel: text('submit_channel').$type<SubmitChannel>().notNull(),
    postedAt: integer('posted_at', { mode: 'timestamp_ms' }).notNull(),
    /** 抓取入库时间。与 postedAt 分开：渠道发布时间可能早于我们发现它的时间 */
    discoveredAt: integer('discovered_at', { mode: 'timestamp_ms' }).notNull(),
    tags: text('tags', { mode: 'json' }).$type<string[]>().notNull(),
    jdSummary: text('jd_summary').notNull(),
    responsibilities: text('responsibilities', { mode: 'json' }).$type<string[]>().notNull(),
    requirements: text('requirements', { mode: 'json' }).$type<string[]>().notNull(),
    contactEmail: text('contact_email'),
    subjectRuleRaw: text('subject_rule_raw'),
    subjectRuleTemplate: text('subject_rule_template'),
    subjectRuleExample: text('subject_rule_example'),
    companySize: text('company_size').notNull().default(''),
    companyStage: text('company_stage').notNull().default(''),
    companyIndustry: text('company_industry').notNull().default(''),
    companyVisa: integer('company_visa', { mode: 'boolean' }).notNull().default(false),
    applicants: integer('applicants').notNull().default(0),
    status: text('status').$type<'open' | 'closed'>().notNull().default('open'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
  },
  (t) => [
    index('idx_jobs_posted_at').on(t.postedAt),
    index('idx_jobs_source').on(t.sourceId),
    index('idx_jobs_company').on(t.company)
  ]
)

/**
 * 岗位 × 求职者 的匹配结果（R6：岗位池全局共享，分数按求职者分开存）。
 * 判定理由与缺口都相对这位求职者，所以放这里而不是 jobs。
 */
export const jobScores = sqliteTable(
  'job_scores',
  {
    jobId: text('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    candidateId: text('candidate_id')
      .notNull()
      .references(() => candidates.id, { onDelete: 'cascade' }),
    score: integer('score').notNull(),
    verdict: text('verdict').$type<Verdict>().notNull(),
    reasons: text('reasons', { mode: 'json' })
      .$type<{ label: string; weight: number; detail: string }[]>()
      .notNull(),
    gaps: text('gaps', { mode: 'json' }).$type<string[]>().notNull(),
    model: text('model').notNull().default(''),
    scoredAt: integer('scored_at', { mode: 'timestamp_ms' }).notNull()
  },
  (t) => [
    primaryKey({ columns: [t.jobId, t.candidateId] }),
    index('idx_scores_candidate').on(t.candidateId)
  ]
)

/**
 * 后台匹配的运行摘要。每位启用档案一行，记录最近一轮扫了多少岗位、补了几条分数。
 * 禁用档案不再刷新这里，旧记录保留供回看。
 */
export const matchRuns = sqliteTable('match_runs', {
  candidateId: text('candidate_id')
    .primaryKey()
    .references(() => candidates.id, { onDelete: 'cascade' }),
  scanned: integer('scanned').notNull().default(0),
  added: integer('added').notNull().default(0),
  at: integer('at', { mode: 'timestamp_ms' }).notNull()
})

/** 岗位收藏。属于「这个人想留着看」的动作，与打分解耦 */
export const jobBookmarks = sqliteTable('job_bookmarks', {
  jobId: text('job_id')
    .primaryKey()
    .references(() => jobs.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
})

// ---------------------------------------------------------------- 投递

export const applications = sqliteTable(
  'applications',
  {
    id: text('id').primaryKey(),
    jobId: text('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    candidateId: text('candidate_id')
      .notNull()
      .references(() => candidates.id, { onDelete: 'cascade' }),
    channel: text('channel').$type<SubmitChannel>().notNull(),
    status: text('status').$type<ApplicationStatus>().notNull(),
    /** 投递动作发生的时间；草稿态时为最后一次变更时间 */
    submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull(),
    score: integer('score').notNull(),
    /** 简历快照标识：文件名 + 版本。真实实现应存 PDF 的 hash */
    resumeSnapshot: text('resume_snapshot').notNull(),
    toEmail: text('to_email'),
    subject: text('subject'),
    body: text('body'),
    subjectRuleOk: integer('subject_rule_ok', { mode: 'boolean' }),
    error: text('error'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull()
  },
  (t) => [
    index('idx_apps_candidate').on(t.candidateId),
    index('idx_apps_status').on(t.status),
    index('idx_apps_submitted').on(t.submittedAt)
  ]
)

/** 投递过程留痕：探测通道、填表、发送、收到回复…… 一条一个时间点 */
export const applicationLogs = sqliteTable(
  'application_logs',
  {
    id: text('id').primaryKey(),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    seq: integer('seq').notNull(),
    at: integer('at', { mode: 'timestamp_ms' }).notNull(),
    label: text('label').notNull(),
    detail: text('detail').notNull()
  },
  (t) => [index('idx_app_logs_app').on(t.applicationId, t.seq)]
)

// ---------------------------------------------------------------- 沟通（R12）

export const conversations = sqliteTable(
  'conversations',
  {
    id: text('id').primaryKey(),
    jobId: text('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    candidateId: text('candidate_id')
      .notNull()
      .references(() => candidates.id, { onDelete: 'cascade' }),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'cascade' }),
    peerName: text('peer_name').notNull(),
    peerTitle: text('peer_title').notNull(),
    stage: text('stage').$type<CommStage>().notNull(),
    /** 冗余的排序键：列表按最近一条消息倒序，不必每行都去聚合 messages */
    lastMessageAt: integer('last_message_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
  },
  (t) => [index('idx_conv_candidate').on(t.candidateId)]
)

/**
 * 消息。未读数不落库：由 read_at IS NULL 且 dir='in' 现算，
 * 否则「已读」要同时改两处，很容易对不上。
 */
export const messages = sqliteTable(
  'messages',
  {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    seq: integer('seq').notNull(),
    at: integer('at', { mode: 'timestamp_ms' }).notNull(),
    dir: text('dir').$type<MessageDirection>().notNull(),
    text: text('text').notNull(),
    readAt: integer('read_at', { mode: 'timestamp_ms' })
  },
  (t) => [index('idx_msg_conv').on(t.conversationId, t.seq)]
)

// ---------------------------------------------------------------- 面试邀约（R13）

export const interviews = sqliteTable(
  'interviews',
  {
    id: text('id').primaryKey(),
    jobId: text('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    candidateId: text('candidate_id')
      .notNull()
      .references(() => candidates.id, { onDelete: 'cascade' }),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'cascade' }),
    /** 平台没有对话时为空 */
    conversationId: text('conversation_id').references(() => conversations.id, {
      onDelete: 'set null'
    }),
    round: text('round').$type<InterviewRound>().notNull(),
    roundIndex: integer('round_index').notNull(),
    roundTotal: integer('round_total').notNull(),
    status: text('status').$type<InterviewStatus>().notNull(),
    startsAt: integer('starts_at', { mode: 'timestamp_ms' }).notNull(),
    /** 结束时间由 startsAt + durationMin 推出，不单独存，避免两者打架 */
    durationMin: integer('duration_min').notNull(),
    format: text('format').$type<InterviewFormat>().notNull(),
    place: text('place').notNull(),
    invitedAt: integer('invited_at', { mode: 'timestamp_ms' }).notNull(),
    replyBy: integer('reply_by', { mode: 'timestamp_ms' }),
    note: text('note').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
  },
  (t) => [
    index('idx_itv_starts').on(t.startsAt),
    index('idx_itv_candidate').on(t.candidateId)
  ]
)

export const interviewInterviewers = sqliteTable(
  'interview_interviewers',
  {
    id: text('id').primaryKey(),
    interviewId: text('interview_id')
      .notNull()
      .references(() => interviews.id, { onDelete: 'cascade' }),
    seq: integer('seq').notNull(),
    name: text('name').notNull(),
    title: text('title').notNull()
  },
  (t) => [index('idx_itv_people').on(t.interviewId, t.seq)]
)

// ---------------------------------------------------------------- 辅助

/** 岗位池的保存视图。条件存 JSON，命中数每次现算，不存快照 */
export const savedViews = sqliteTable('saved_views', {
  id: text('id').primaryKey(),
  nameKey: text('name_key').notNull(),
  filter: text('filter', { mode: 'json' })
    .$type<{
      remote?: boolean
      companies?: string[]
      minApplicants?: number
      visa?: boolean
      verdict?: Verdict
    }>()
    .notNull(),
  sort: integer('sort').notNull().default(0)
})

/** 大模型调用量按场景汇总。真实实现应由 llm_calls 明细表聚合，这里先存汇总 */
export const llmUsage = sqliteTable('llm_usage', {
  scene: text('scene').primaryKey(),
  model: text('model').notNull(),
  calls: integer('calls').notNull().default(0),
  /** 金额按分存，避免浮点误差 */
  costCents: integer('cost_cents').notNull().default(0),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull()
})

/** 应用级键值设置：当前求职者、自动化档位等。value 统一存 JSON */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).$type<unknown>().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull()
})
