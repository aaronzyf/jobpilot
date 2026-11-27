import type {
  AppSnapshot,
  LoadResult,
  SidebarSnapshot,
  ViewQuery,
  ViewSnapshot
} from '@core'
import type { DatabaseHandle } from '../index'
import {
  EMPTY_METRICS,
  candidateStatsOf,
  lastDays,
  toApplicationViews,
  toCandidateViews,
  toConversationViews,
  toInterviewViews,
  toJobViews,
  toLlmUsageViews,
  toMatchRunViews,
  toMetrics,
  toSavedViewViews,
  toSourceViews
} from '../mappers'
import {
  countPendingInterviews,
  countUnreadMessages,
  getSetting,
  listApplicationLogs,
  listApplications,
  listAutoScores,
  listBookmarks,
  candidateApplicationRows,
  candidateInterviewRows,
  listCandidates,
  listConversations,
  listInterviewers,
  listInterviews,
  listJobDiscovery,
  listJobScores,
  listLlmUsage,
  listMatchRuns,
  listMessages,
  listMessagesSince,
  listSavedViews,
  listSources,
  listSubmissions,
  queryApplicationIds,
  queryConversationIds,
  queryInterviewIds,
  queryJobs
} from '../repositories'

/**
 * 读用例层。
 *
 * 职责是「编排」：决定每个页面要取哪几组仓储数据、按什么顺序拼成读模型。
 * SQL 在仓储层，行到 View 的转换在 mapper，这里只把两者接起来。
 */

/** 所有页面共用的岗位读模型：先取行，再交给 mapper 拼分数 / 来源 / 收藏 */
function jobViews(handle: DatabaseHandle) {
  const sources = listSources(handle)
  const names = new Map(sources.map((s) => [s.id, s.name]))
  return toJobViews(
    queryJobs(handle),
    listJobScores(handle),
    listBookmarks(handle),
    names
  )
}

function applicationViews(handle: DatabaseHandle) {
  return toApplicationViews(listApplications(handle), listApplicationLogs(handle))
}

function conversationViews(handle: DatabaseHandle) {
  return toConversationViews(listConversations(handle), listMessages(handle))
}

function interviewViews(handle: DatabaseHandle) {
  return toInterviewViews(listInterviews(handle), listInterviewers(handle))
}

function metricsOf(handle: DatabaseHandle) {
  const from = lastDays(7)[0].getTime()
  return toMetrics(
    listJobDiscovery(handle),
    listAutoScores(handle),
    listSubmissions(handle),
    listMessagesSince(handle, from)
  )
}

/**
 * 侧栏常驻数据：未读数和待确认邀约用 COUNT 直接查库，
 * 不依赖当前页列表——岗位页筛选时角标仍是全库真实数字。
 */
export function readSidebar(handle: DatabaseHandle): SidebarSnapshot {
  const stats = candidateStatsOf(
    candidateApplicationRows(handle),
    candidateInterviewRows(handle)
  )
  const candidates = toCandidateViews(listCandidates(handle), stats)
  const active = getSetting<string>(handle, 'active_candidate_id')
  return {
    candidates,
    sources: toSourceViews(listSources(handle)),
    activeCandidateId:
      active && candidates.some((c) => c.id === active) ? active : (candidates[0]?.id ?? ''),
    unreadTotal: countUnreadMessages(handle),
    pendingInterviews: countPendingInterviews(handle),
    matchRuns: toMatchRunViews(listMatchRuns(handle)),
    revision: getSetting<number>(handle, 'revision') ?? 0
  }
}

function emptyView(): ViewSnapshot {
  return {
    jobs: [],
    applications: [],
    conversations: [],
    interviews: [],
    savedViews: [],
    llmUsage: [],
    metrics: EMPTY_METRICS
  }
}

/** 按页面读取数据：只查当前页真正用得到的那几组 */
export function readView(handle: DatabaseHandle, query: ViewQuery): ViewSnapshot {
  const view = emptyView()
  switch (query.page) {
    case 'dashboard':
      return {
        ...view,
        jobs: jobViews(handle),
        applications: applicationViews(handle),
        conversations: conversationViews(handle),
        interviews: interviewViews(handle),
        metrics: metricsOf(handle)
      }
    case 'jobs': {
      const allJobs = jobViews(handle)
      const sources = listSources(handle)
      const names = new Map(sources.map((s) => [s.id, s.name]))
      return {
        ...view,
        jobs: toJobViews(
          queryJobs(handle, {
            ...query.jobs,
            candidateId: query.candidateId ?? query.jobs?.candidateId
          }),
          listJobScores(handle),
          listBookmarks(handle),
          names
        ),
        // 保存视图命中数按全量岗位算，不随列表筛选变化
        savedViews: toSavedViewViews(listSavedViews(handle), allJobs)
      }
    }
    case 'applications':
      return {
        ...view,
        applications: applicationViews(handle),
        jobs: jobViews(handle),
        filterIds: queryApplicationIds(handle, query)
      }
    case 'messages':
      return {
        ...view,
        conversations: conversationViews(handle),
        jobs: jobViews(handle),
        filterIds: queryConversationIds(handle, query)
      }
    case 'interviews':
      return {
        ...view,
        interviews: interviewViews(handle),
        jobs: jobViews(handle),
        filterIds: queryInterviewIds(handle, query)
      }
    case 'settings':
      return {
        ...view,
        jobs: jobViews(handle),
        applications: applicationViews(handle),
        llmUsage: toLlmUsageViews(listLlmUsage(handle))
      }
    case 'candidates':
    default:
      return view
  }
}

/** 写操作之后回传「侧栏 + 当前页」，避免界面读到过期筛选结果 */
export function readAfterWrite(handle: DatabaseHandle, query: ViewQuery): LoadResult {
  return { sidebar: readSidebar(handle), view: readView(handle, query) }
}

/** 一次读全。只给脚本 / 旧调用方用，界面已切到 readView */
export function readSnapshot(handle: DatabaseHandle): AppSnapshot {
  const jobs = jobViews(handle)
  const active = getSetting<string>(handle, 'active_candidate_id')
  const candidates = toCandidateViews(
    listCandidates(handle),
    candidateStatsOf(candidateApplicationRows(handle), candidateInterviewRows(handle))
  )
  return {
    candidates,
    jobs,
    applications: applicationViews(handle),
    sources: toSourceViews(listSources(handle)),
    conversations: conversationViews(handle),
    interviews: interviewViews(handle),
    savedViews: toSavedViewViews(listSavedViews(handle), jobs),
    llmUsage: toLlmUsageViews(listLlmUsage(handle)),
    metrics: metricsOf(handle),
    activeCandidateId:
      active && candidates.some((c) => c.id === active) ? active : (candidates[0]?.id ?? ''),
    matchRuns: toMatchRunViews(listMatchRuns(handle)),
    revision: getSetting<number>(handle, 'revision') ?? 0
  }
}
