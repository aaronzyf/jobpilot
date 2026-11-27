import type { MatchRunView } from '@core'
import type { MatchRunRow } from '../repositories/matching.repo'

/** 运行摘要按候选人 id 索引，渲染层直接按档案取值 */
export function toMatchRunViews(rows: MatchRunRow[]): Record<string, MatchRunView> {
  return Object.fromEntries(
    rows.map((row) => [
      row.candidateId,
      { at: row.at.getTime(), scanned: row.scanned, added: row.added }
    ])
  )
}
