import type { SourceView } from '@core'
import type { SourceRow } from '../repositories/sources.repo'
import { iso } from './common'

export function toSourceViews(rows: SourceRow[]): SourceView[] {
  return rows.map((s) => ({
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
