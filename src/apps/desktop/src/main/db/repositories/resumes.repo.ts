import { eq } from 'drizzle-orm'
import type { DatabaseHandle } from '../index'
import { schema } from '../index'

export type ResumeDocumentRow = typeof schema.resumeDocuments.$inferSelect
export type ResumeItemRow = typeof schema.resumeItems.$inferSelect

/** 简历正文。档案没有上传简历时没有这一行 */
export function getResumeDocument(
  handle: DatabaseHandle,
  candidateId: string
): ResumeDocumentRow | null {
  return (
    handle.db
      .select()
      .from(schema.resumeDocuments)
      .where(eq(schema.resumeDocuments.candidateId, candidateId))
      .get() ?? null
  )
}

/** 时间线条目，按简历里的先后顺序返回 */
export function listResumeItems(handle: DatabaseHandle, candidateId: string): ResumeItemRow[] {
  return handle.db
    .select()
    .from(schema.resumeItems)
    .where(eq(schema.resumeItems.candidateId, candidateId))
    .orderBy(schema.resumeItems.position)
    .all()
}
