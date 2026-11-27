import { and, eq, isNull, sql } from 'drizzle-orm'
import type {
  AppSnapshot,
  ApplicationView,
  CandidateView,
  CommTrendPointView,
  ConversationView,
  HourlyPointView,
  InterviewStatus,
  InterviewView,
  JobMatchView,
  JobView,
  MetricsView,
  SourceView,
  TrendPointView
} from '@core'
import type { DatabaseHandle } from './index'
import { schema } from './index'

/**
 * 仓储层：把表里的行拼成渲染层直接能用的读模型。
 *
 * 这里做三件表结构里不该做的事：
 * 1. 聚合——统计数、未读数、收藏视图命中数，每次现算，不落冗余列
 * 2. 换算——毫秒时间戳转 ISO，跨 IPC 不用再处理 Date
 * 3. 分组——匹配分数按候选人收进 matches，页面不必自己 join
 */

const iso = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null)
const isoOf = (d: Date | null | undefined): string => (d ? d.toISOString() : new Date(0).toISOString())

/** 本地日期键，形如 2026-11-27 */
const dayKey = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/** 近 n 天（含今天）的日期键，升序 */
function lastDays(n: number): Date[] {
  const out: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    out.push(d)
  }
  return out
}

function metricsOf(handle: DatabaseHandle): MetricsView {
  const { db } = handle
  const days = lastDays(7)
  const from = days[0].getTime()

  const jobRows = db
    .select({ discoveredAt: schema.jobs.discoveredAt, id: schema.jobs.id })
    .from(schema.jobs)
    .all()

  const autoRows = db
    .select({ jobId: schema.jobScores.jobId, score: schema.jobScores.score })
    .from(schema.jobScores)
    .where(eq(schema.jobScores.verdict, 'auto'))
    .all()
  const autoJobIds = new Set(autoRows.map((r) => r.jobId))

  const appRows = db
    .select({ submittedAt: schema.applications.submittedAt })
    .from(schema.applications)
    .all()

  const trend: TrendPointView[] = days.map((d) => {
    const key = dayKey(d)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const inDay = (t: Date) => t >= d && t < next
    const jobsToday = jobRows.filter((r) => inDay(r.discoveredAt))
    return {
      day: key.slice(5),
      found: jobsToday.length,
      matched: jobsToday.filter((r) => autoJobIds.has(r.id)).length,
      sent: appRows.filter((r) => inDay(r.submittedAt)).length
    }
  })

  const msgRows = db
    .select({ at: schema.messages.at, dir: schema.messages.dir })
    .from(schema.messages)
    .where(sql`${schema.messages.at} >= ${from}`)
    .all()

  const commTrend: CommTrendPointView[] = days.map((d) => {
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const inDay = msgRows.filter((r) => r.at >= d && r.at < next)
    return {
      day: dayKey(d).slice(5),
      in: inDay.filter((r) => r.dir === 'in').length,
      out: inDay.filter((r) => r.dir === 'out').length
    }
  })

  // 今日按小时的抓取量。只取 08–18，与界面横轴对齐
  const todayKey = dayKey(new Date())
  const hourly: HourlyPointView[] = Array.from({ length: 11 }, (_, i) => {
    const h = i + 8
    const n = jobRows.filter(
      (r) => dayKey(r.discoveredAt) === todayKey && r.discoveredAt.getHours() === h
    ).length
    return { h: String(h).padStart(2, '0'), n }
  })

  return { trend, commTrend, hourly }
}

function candidateStats(handle: DatabaseHandle) {
  const { db } = handle
  const apps = db
    .select({
      candidateId: schema.applications.candidateId,
      status: schema.applications.status
    })
    .from(schema.applications)
    .all()

  const ivs = db
    .select({
      candidateId: schema.interviews.candidateId,
      status: schema.interviews.status,
      startsAt: schema.interviews.startsAt,
      durationMin: schema.interviews.durationMin
    })
    .from(schema.interviews)
    .all()

  const now = Date.now()
  const map = new Map<
    string,
    { applied: number; replied: number; pending: number; interview: number }
  >()
  const slot = (id: string) => {
    const cur = map.get(id) ?? { applied: 0, replied: 0, pending: 0, interview: 0 }
    map.set(id, cur)
    return cur
  }

  for (const a of apps) {
    const s = slot(a.candidateId)
    s.applied += 1
    if (a.status === 'replied') s.replied += 1
    if (a.status === 'pending_confirm') s.pending += 1
  }
  for (const i of ivs) {
    const end = i.startsAt.getTime() + i.durationMin * 60_000
    const open = i.status === 'invited' || i.status === 'accepted' || i.status === 'rescheduled'
    if (open && end > now) slot(i.candidateId).interview += 1
  }
  return map
}

function sourcesOf(handle: DatabaseHandle): SourceView[] {
  return handle.db
    .select()
    .from(schema.sources)
    .orderBy(schema.sources.sort)
    .all()
    .map((s) => ({
      id: s.id,
      name: s.name,
      region: s.region,
      intervalMin: s.intervalMin,
      lastRunAt: iso(s.lastRunAt),
      nextRunAt: iso(s.nextRunAt),
      found: s.foundCount,
      state: s.state,
      auth: s.auth,
      account: s.account,
      enabled: s.enabled,
      capabilities: s.capabilities
    }))
}

function jobsOf(handle: DatabaseHandle, sourceName: Map<string, string>): JobView[] {
  const { db } = handle
  const jobRows = db.select().from(schema.jobs).orderBy(schema.jobs.postedAt).all()
  const scoreRows = db.select().from(schema.jobScores).all()
  const bookmarks = new Set(db.select().from(schema.jobBookmarks).all().map((b) => b.jobId))

  const byJob = new Map<string, Record<string, JobMatchView>>()
  for (const s of scoreRows) {
    const bucket = byJob.get(s.jobId) ?? {}
    bucket[s.candidateId] = {
      score: s.score,
      verdict: s.verdict,
      reasons: s.reasons,
      gaps: s.gaps
    }
    byJob.set(s.jobId, bucket)
  }

  const now = Date.now()
  return jobRows.map((j) => ({
    id: j.id,
    company: j.company,
    hue: j.companyHue,
    title: j.title,
    city: j.city,
    country: j.country,
    workMode: j.workMode,
    employment: j.employmentType,
    salaryText: j.salaryText,
    sourceId: j.sourceId,
    sourceName: sourceName.get(j.sourceId) ?? j.sourceId,
    region: j.region,
    channel: j.submitChannel,
    postedAt: isoOf(j.postedAt),
    postedHours: Math.max(0, Math.floor((now - j.postedAt.getTime()) / 3_600_000)),
    matches: byJob.get(j.id) ?? {},
    tags: j.tags,
    jdSummary: j.jdSummary,
    responsibilities: j.responsibilities,
    requirements: j.requirements,
    contactEmail: j.contactEmail ?? undefined,
    subjectRule:
      j.subjectRuleRaw && j.subjectRuleTemplate && j.subjectRuleExample
        ? {
            raw: j.subjectRuleRaw,
            template: j.subjectRuleTemplate,
            example: j.subjectRuleExample
          }
        : undefined,
    companyMeta: {
      size: j.companySize,
      stage: j.companyStage,
      industry: j.companyIndustry,
      visa: j.companyVisa
    },
    applicants: j.applicants,
    saved: bookmarks.has(j.id)
  }))
}

function applicationsOf(handle: DatabaseHandle): ApplicationView[] {
  const { db } = handle
  const rows = db
    .select()
    .from(schema.applications)
    .orderBy(sql`${schema.applications.submittedAt} desc`)
    .all()
  const logs = db
    .select()
    .from(schema.applicationLogs)
    .orderBy(schema.applicationLogs.seq)
    .all()

  const byApp = new Map<string, typeof logs>()
  for (const l of logs) {
    const list = byApp.get(l.applicationId) ?? []
    list.push(l)
    byApp.set(l.applicationId, list)
  }

  return rows.map((a) => ({
    id: a.id,
    jobId: a.jobId,
    candidateId: a.candidateId,
    channel: a.channel,
    status: a.status,
    submittedAt: isoOf(a.submittedAt),
    score: a.score,
    resumeSnapshot: a.resumeSnapshot,
    subject: a.subject ?? undefined,
    body: a.body ?? undefined,
    to: a.toEmail ?? undefined,
    subjectRuleOk: a.subjectRuleOk ?? undefined,
    error: a.error ?? undefined,
    logs: (byApp.get(a.id) ?? []).map((l) => ({
      at: isoOf(l.at),
      label: l.label,
      detail: l.detail
    }))
  }))
}

function conversationsOf(handle: DatabaseHandle): ConversationView[] {
  const { db } = handle
  const convRows = db
    .select()
    .from(schema.conversations)
    .orderBy(sql`coalesce(${schema.conversations.lastMessageAt}, 0) desc`)
    .all()
  const msgRows = db.select().from(schema.messages).orderBy(schema.messages.seq).all()

  const byConv = new Map<string, typeof msgRows>()
  for (const m of msgRows) {
    const list = byConv.get(m.conversationId) ?? []
    list.push(m)
    byConv.set(m.conversationId, list)
  }

  return convRows.map((c) => {
    const list = byConv.get(c.id) ?? []
    return {
      id: c.id,
      jobId: c.jobId,
      candidateId: c.candidateId,
      sourceId: c.sourceId,
      peer: { name: c.peerName, title: c.peerTitle },
      stage: c.stage,
      unread: list.filter((m) => m.dir === 'in' && m.readAt === null).length,
      messages: list.map((m) => ({
        id: m.id,
        at: m.at.toISOString(),
        dir: m.dir,
        text: m.text
      }))
    }
  })
}

function interviewsOf(handle: DatabaseHandle): InterviewView[] {
  const { db } = handle
  const rows = db.select().from(schema.interviews).orderBy(schema.interviews.startsAt).all()
  const people = db
    .select()
    .from(schema.interviewInterviewers)
    .orderBy(schema.interviewInterviewers.seq)
    .all()

  const byItv = new Map<string, { name: string; title: string }[]>()
  for (const p of people) {
    const list = byItv.get(p.interviewId) ?? []
    list.push({ name: p.name, title: p.title })
    byItv.set(p.interviewId, list)
  }

  return rows.map((i) => ({
    id: i.id,
    jobId: i.jobId,
    candidateId: i.candidateId,
    sourceId: i.sourceId,
    conversationId: i.conversationId ?? undefined,
    round: i.round,
    roundIndex: i.roundIndex,
    roundTotal: i.roundTotal,
    status: i.status,
    startsAt: i.startsAt.toISOString(),
    durationMin: i.durationMin,
    format: i.format,
    place: i.place,
    interviewers: byItv.get(i.id) ?? [],
    invitedAt: i.invitedAt.toISOString(),
    replyBy: iso(i.replyBy),
    note: i.note
  }))
}

export function getSetting<T>(handle: DatabaseHandle, key: string): T | null {
  const row = handle.db.select().from(schema.settings).where(eq(schema.settings.key, key)).get()
  return row ? (row.value as T) : null
}

export function setSetting(handle: DatabaseHandle, key: string, value: unknown): void {
  handle.db
    .insert(schema.settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value, updatedAt: new Date() }
    })
    .run()
}

/** 一次读全。库小、页面多，逐页查询反而要处理十几处加载态 */
export function readSnapshot(handle: DatabaseHandle): AppSnapshot {
  const sources = sourcesOf(handle)
  const sourceName = new Map(sources.map((s) => [s.id, s.name]))
  const stats = candidateStats(handle)

  const candidates: CandidateView[] = handle.db
    .select()
    .from(schema.candidates)
    .where(eq(schema.candidates.archived, false))
    .orderBy(schema.candidates.createdAt)
    .all()
    .map((c) => ({
      id: c.id,
      name: c.name,
      headline: c.headline,
      years: c.years,
      location: c.location,
      hue: c.hue,
      resumeFile: c.resumeFile,
      resumeUpdatedAt: c.resumeUpdatedAt.toISOString(),
      resumePages: c.resumePages,
      email: c.email,
      smtp:
        c.smtpHost && c.smtpPort ? { host: c.smtpHost, port: c.smtpPort, verified: c.smtpVerified } : null,
      note: c.note,
      languages: c.languages,
      thresholds: { auto: c.thresholdAuto, reject: c.thresholdReject },
      dailyCap: c.dailyCap,
      stats: stats.get(c.id) ?? { applied: 0, replied: 0, pending: 0, interview: 0 },
      resumeFacts: {
        projects: c.factProjects,
        experiences: c.factExperiences,
        skills: c.factSkills
      }
    }))

  const jobs = jobsOf(handle, sourceName)

  const savedViews = handle.db
    .select()
    .from(schema.savedViews)
    .orderBy(schema.savedViews.sort)
    .all()
    .map((v) => ({
      id: v.id,
      nameKey: v.nameKey,
      count: countViewMatches(jobs, v.filter)
    }))

  const llmUsage = handle.db
    .select()
    .from(schema.llmUsage)
    .all()
    .map((u) => ({
      labelKey: u.scene,
      model: u.model,
      calls: u.calls,
      cost: `¥${(u.costCents / 100).toFixed(2)}`
    }))

  const active = getSetting<string>(handle, 'active_candidate_id')
  const revision = getSetting<number>(handle, 'revision') ?? 0

  return {
    candidates,
    jobs,
    applications: applicationsOf(handle),
    sources,
    conversations: conversationsOf(handle),
    interviews: interviewsOf(handle),
    savedViews,
    llmUsage,
    metrics: metricsOf(handle),
    activeCandidateId:
      active && candidates.some((c) => c.id === active) ? active : (candidates[0]?.id ?? ''),
    revision
  }
}

/** 收藏视图命中数：条件在 JSON 里，岗位最多百级，内存过滤比拼动态 SQL 好维护 */
function countViewMatches(
  jobs: JobView[],
  filter: {
    remote?: boolean
    companies?: string[]
    minApplicants?: number
    visa?: boolean
    verdict?: 'auto' | 'confirm' | 'reject'
  }
): number {
  return jobs.filter((j) => {
    if (filter.remote && j.workMode !== 'remote') return false
    if (filter.visa && !j.companyMeta.visa) return false
    if (filter.companies && !filter.companies.includes(j.company)) return false
    if (filter.minApplicants && j.applicants < filter.minApplicants) return false
    if (filter.verdict) {
      const verdicts = Object.values(j.matches).map((m) => m.verdict)
      if (!verdicts.includes(filter.verdict)) return false
    }
    return true
  }).length
}

// ---------------------------------------------------------------- 写操作

function bumpRevision(handle: DatabaseHandle): void {
  const cur = getSetting<number>(handle, 'revision') ?? 0
  setSetting(handle, 'revision', cur + 1)
}

/** 把会话里所有收到的消息标为已读。发出去的消息不需要读 */
export function markConversationRead(handle: DatabaseHandle, conversationId: string): void {
  handle.db
    .update(schema.messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(schema.messages.conversationId, conversationId),
        eq(schema.messages.dir, 'in'),
        isNull(schema.messages.readAt)
      )
    )
    .run()
  bumpRevision(handle)
}

export function markAllConversationsRead(handle: DatabaseHandle): void {
  handle.db
    .update(schema.messages)
    .set({ readAt: new Date() })
    .where(and(eq(schema.messages.dir, 'in'), isNull(schema.messages.readAt)))
    .run()
  bumpRevision(handle)
}

/** 追加一条发出的消息，同时把会话的排序键推到现在 */
export function appendOutgoingMessage(
  handle: DatabaseHandle,
  conversationId: string,
  text: string
): void {
  const { db, sqlite } = handle
  const last = db
    .select({ seq: schema.messages.seq })
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .orderBy(sql`${schema.messages.seq} desc`)
    .limit(1)
    .get()
  const seq = (last?.seq ?? 0) + 1
  const at = new Date()

  sqlite.transaction(() => {
    db.insert(schema.messages)
      .values({
        id: `${conversationId}-${seq}`,
        conversationId,
        seq,
        at,
        dir: 'out',
        text,
        readAt: at
      })
      .run()
    db.update(schema.conversations)
      .set({ lastMessageAt: at })
      .where(eq(schema.conversations.id, conversationId))
      .run()
  })()
  bumpRevision(handle)
}

export function setInterviewStatus(
  handle: DatabaseHandle,
  id: string,
  status: InterviewStatus
): void {
  handle.db.update(schema.interviews).set({ status }).where(eq(schema.interviews.id, id)).run()
  bumpRevision(handle)
}

export function setJobSaved(handle: DatabaseHandle, jobId: string, saved: boolean): void {
  const { db } = handle
  if (saved) {
    db.insert(schema.jobBookmarks)
      .values({ jobId, createdAt: new Date() })
      .onConflictDoNothing()
      .run()
  } else {
    db.delete(schema.jobBookmarks).where(eq(schema.jobBookmarks.jobId, jobId)).run()
  }
  bumpRevision(handle)
}

export function setApplicationStatus(
  handle: DatabaseHandle,
  id: string,
  status: ApplicationRowStatus
): void {
  handle.db
    .update(schema.applications)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.applications.id, id))
    .run()
  bumpRevision(handle)
}

type ApplicationRowStatus = ApplicationView['status']

export function setActiveCandidate(handle: DatabaseHandle, candidateId: string): void {
  setSetting(handle, 'active_candidate_id', candidateId)
  bumpRevision(handle)
}

/** 清空业务表并重新灌种子，用于「恢复示例数据」 */
export function resetDatabase(handle: DatabaseHandle): void {
  const { sqlite } = handle
  const tables = [
    'interview_interviewers',
    'interviews',
    'messages',
    'conversations',
    'application_logs',
    'applications',
    'job_bookmarks',
    'job_scores',
    'jobs',
    'sources',
    'saved_views',
    'llm_usage',
    'settings',
    'candidates'
  ]
  sqlite.transaction(() => {
    for (const t of tables) sqlite.exec(`delete from ${t}`)
  })()
}
