import type { Verdict } from '@core'
import type { Job } from '@/lib/types'

/**
 * 匹配判定放在渲染层，是因为表里存的 score/verdict 是「上次算出来的结果」，
 * 而阈值是求职者身上可改的参数。改完阈值要立刻看到分档变化，
 * 不能在库里再跑一遍评分，所以这里按当前阈值现算，verdict 只作为兜底。
 */

/** 没有打分的岗位按 50 处理：既不算命中，也不至于掉进拒绝档 */
export function scoreFor(job: Job, candidateId: string): number {
  return job.matches[candidateId]?.score ?? 50
}

export function verdictFor(score: number, auto: number, reject: number): Verdict {
  if (score >= auto) return 'auto'
  if (score >= reject) return 'confirm'
  return 'reject'
}
