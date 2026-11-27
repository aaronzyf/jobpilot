import type { DatabaseHandle } from '../index'
import { schema } from '../index'

export type SourceRow = typeof schema.sources.$inferSelect

/** 招聘来源，按界面排序键 */
export function listSources(handle: DatabaseHandle): SourceRow[] {
  return handle.db.select().from(schema.sources).orderBy(schema.sources.sort).all()
}
