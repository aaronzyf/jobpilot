import { BrowserWindow } from 'electron'
import type { Verdict } from '@core'
import type { DatabaseHandle } from '../db'
import { toMatchRunViews } from '../db/mappers'
import {
  bumpRevision,
  insertJobScore,
  listEnabledCandidates,
  listJobScores,
  listMatchRuns,
  listOpenJobs,
  upsertMatchRun
} from '../db/repositories'
import { emit } from '../ipc'

/**
 * 后台匹配调度。
 *
 * 只活在主进程：窗口关掉、切页、换筛选都不影响它。每轮扫描全部「启用」的档案，
 * 与当前选中的人无关；禁用的人直接跳过，历史分数保留但不再更新。
 *
 * 打分目前是本地确定性启发式——真实的简历语义匹配要接 LLM 网关（见 TODO），
 * 这里先把调度、去重、运行摘要与事件通知跑通。已有分数不覆盖，避免每次启动
 * 都把种子数据里的详细理由冲掉。
 */

const INTERVAL_MS = 30_000
const MODEL = 'heuristic-v1'

type Reason = { label: string; weight: number; detail: string }
type Draft = { score: number; verdict: Verdict; reasons: Reason[]; gaps: string[] }

type Candidate = ReturnType<typeof listEnabledCandidates>[number]
type Job = ReturnType<typeof listOpenJobs>[number]

const clamp = (n: number) => Math.max(15, Math.min(97, n))

/** 从档案与岗位文本里取重合的技术关键词 */
function sharedSkills(candidate: Candidate, job: Job): string[] {
  const profile = `${candidate.headline} ${candidate.note}`.toLowerCase()
  const text = `${job.title} ${job.tags.join(' ')} ${job.jdSummary}`.toLowerCase()
  const tokens = [
    'react',
    'typescript',
    'javascript',
    'electron',
    'node',
    'go',
    'java',
    'python',
    'vue',
    '设计',
    '产品',
    '全栈',
    '前端',
    '架构'
  ]
  return tokens.filter((token) => profile.includes(token) && text.includes(token))
}

function draftOf(candidate: Candidate, job: Job): Draft {
  const reasons: Reason[] = []
  const gaps: string[] = []
  let points = 52
  const note = candidate.note.toLowerCase()

  const skills = sharedSkills(candidate, job)
  if (skills.length) {
    const bonus = Math.min(18, skills.length * 6)
    points += bonus
    reasons.push({
      label: '技术栈重合',
      weight: Number((bonus / 18).toFixed(2)),
      detail: skills.slice(0, 3).join(' / ')
    })
  } else {
    gaps.push('技术栈重合度低')
  }

  if (job.workMode === 'remote') {
    points += 12
    reasons.push({ label: '远程岗位', weight: 0.8, detail: job.workMode })
  } else if (job.city === candidate.location) {
    points += 14
    reasons.push({ label: '地点匹配', weight: 0.9, detail: `${job.city} · ${candidate.location}` })
  } else if (note.includes(job.city.toLowerCase())) {
    points += 10
    reasons.push({ label: '地点可接受', weight: 0.7, detail: job.city })
  } else {
    gaps.push(`${job.city} 不在期望地点`)
  }

  if (candidate.years >= 6 && /senior|资深|架构|lead/i.test(job.title)) {
    points += 8
    reasons.push({ label: '资历匹配', weight: 0.6, detail: `${candidate.years} 年经验` })
  }

  if (note.includes('签证')) {
    if (job.companyVisa) {
      points += 6
      reasons.push({ label: '签证赞助', weight: 0.5, detail: job.company })
    } else {
      gaps.push('岗位未提供签证赞助')
    }
  }

  if (note.includes('外包') && /外包|驻场/.test(job.tags.join(' '))) {
    points -= 25
    gaps.push('外包或驻场岗位')
  }

  if (note.includes('远程') && job.workMode !== 'remote' && job.city !== candidate.location) {
    points -= 6
    gaps.push('不满足远程偏好')
  }

  const score = clamp(points)
  const verdict: Verdict =
    score >= candidate.thresholdAuto
      ? 'auto'
      : score >= candidate.thresholdReject
        ? 'confirm'
        : 'reject'
  return { score, verdict, reasons, gaps }
}

let timer: NodeJS.Timeout | null = null
let current: DatabaseHandle | null = null
let running = false

async function runOnce(handle: DatabaseHandle): Promise<void> {
  if (running) return
  running = true
  try {
    const candidates = listEnabledCandidates(handle)
    const jobs = listOpenJobs(handle)
    const existing = new Set(
      listJobScores(handle).map((score) => `${score.jobId}|${score.candidateId}`)
    )
    const at = Date.now()
    let addedTotal = 0

    for (const candidate of candidates) {
      let added = 0
      for (const job of jobs) {
        const key = `${job.id}|${candidate.id}`
        if (existing.has(key)) continue
        const draft = draftOf(candidate, job)
        insertJobScore(handle, {
          jobId: job.id,
          candidateId: candidate.id,
          score: draft.score,
          verdict: draft.verdict,
          reasons: draft.reasons,
          gaps: draft.gaps,
          model: MODEL,
          scoredAt: new Date(at)
        })
        existing.add(key)
        added += 1
      }
      upsertMatchRun(handle, candidate.id, jobs.length, added)
      addedTotal += added
    }

    if (addedTotal > 0) bumpRevision(handle)
    const runs = toMatchRunViews(listMatchRuns(handle))
    for (const win of BrowserWindow.getAllWindows()) {
      emit(win.webContents, 'match:run', { at, runs })
    }
    console.log(
      `[matching] ${candidates.length} profile(s) scanned, ${jobs.length} job(s) each, ${addedTotal} new score(s)`
    )
  } catch (error) {
    console.error('[matching]', error)
  } finally {
    running = false
  }
}

/** 启动调度：立即跑一轮，之后按固定间隔扫描。窗口还没开也能跑 */
export function startMatching(handle: DatabaseHandle): void {
  stopMatching()
  current = handle
  void runOnce(handle)
  timer = setInterval(() => {
    if (current) void runOnce(current)
  }, INTERVAL_MS)
  timer.unref?.()
}

export function stopMatching(): void {
  if (timer) clearInterval(timer)
  timer = null
  current = null
}

/** 写操作（启用/禁用、重置）后立即补一轮，不必等下一个定时器 */
export function requestMatching(): void {
  if (current) void runOnce(current)
}
