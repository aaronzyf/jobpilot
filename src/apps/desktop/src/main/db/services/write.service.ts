import type { ApplicationStatus, InterviewStatus, LoadResult, ViewQuery } from '@core'
import type { DatabaseHandle } from '../index'
import { seedIfEmpty } from '../seed'
import {
  appendOutgoingMessage,
  bumpRevision,
  clearBusinessTables,
  getSetting,
  markAllConversationsRead,
  markConversationRead,
  setBookmark,
  setCandidateEnabled as updateCandidateEnabled,
  setSetting,
  updateApplicationStatus,
  updateInterviewStatus
} from '../repositories'
import { readAfterWrite } from './read.service'

/**
 * 写用例层：业务规则 + 读后回传。
 *
 * 每个用例都遵循「写库 → bumpRevision → 回传当前查询」三步；
 * 仓储层只管单条 SQL，不决定版本号，也不负责刷新界面数据。
 */

/** 写完之后统一回传侧栏 + 当前页 */
function after(handle: DatabaseHandle, query: ViewQuery, mutate: () => void): LoadResult {
  mutate()
  bumpRevision(handle)
  return readAfterWrite(handle, query)
}

export function markRead(
  handle: DatabaseHandle,
  query: ViewQuery,
  conversationId: string
): LoadResult {
  return after(handle, query, () => markConversationRead(handle, conversationId))
}

export function markAllRead(handle: DatabaseHandle, query: ViewQuery): LoadResult {
  return after(handle, query, () => markAllConversationsRead(handle))
}

export function sendMessage(
  handle: DatabaseHandle,
  query: ViewQuery,
  conversationId: string,
  text: string
): LoadResult {
  return after(handle, query, () => appendOutgoingMessage(handle, conversationId, text))
}

export function setInterview(
  handle: DatabaseHandle,
  query: ViewQuery,
  id: string,
  status: InterviewStatus
): LoadResult {
  return after(handle, query, () => updateInterviewStatus(handle, id, status))
}

export function setSaved(
  handle: DatabaseHandle,
  query: ViewQuery,
  jobId: string,
  saved: boolean
): LoadResult {
  return after(handle, query, () => setBookmark(handle, jobId, saved))
}

export function setApplication(
  handle: DatabaseHandle,
  query: ViewQuery,
  id: string,
  status: ApplicationStatus
): LoadResult {
  return after(handle, query, () => updateApplicationStatus(handle, id, status))
}

/** 切换求职者：落 settings 后要用新 id 重读当前页，否则筛选还挂在旧人身上 */
export function setActiveCandidate(
  handle: DatabaseHandle,
  query: ViewQuery,
  id: string
): LoadResult {
  setSetting(handle, 'active_candidate_id', id)
  bumpRevision(handle)
  return readAfterWrite(handle, { ...query, candidateId: id })
}

/** 启用 / 禁用档案：禁用只停后台调度，历史分数保留 */
export function setCandidateEnabled(
  handle: DatabaseHandle,
  query: ViewQuery,
  id: string,
  enabled: boolean
): LoadResult {
  // 当前档案必须始终可匹配，服务层再拦一道，避免绕过 UI 的调用把它禁掉
  if (!enabled && getSetting<string>(handle, 'active_candidate_id') === id) {
    return readAfterWrite(handle, query)
  }
  return after(handle, query, () => updateCandidateEnabled(handle, id, enabled))
}

/** 清空业务表并重新灌种子 */
export function resetData(handle: DatabaseHandle, query: ViewQuery): LoadResult {
  clearBusinessTables(handle)
  seedIfEmpty(handle)
  bumpRevision(handle)
  return readAfterWrite(handle, query)
}
