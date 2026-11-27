import type { ResumeItemView, ResumeView } from '@core'
import type { ResumeDocumentRow, ResumeItemRow } from '../repositories/resumes.repo'

/**
 * 简历读模型转换。
 *
 * 文件元信息（文件名、页数、更新时间）来自候选人档案，
 * 正文来自解析结果；两者拼成一屏能直接渲染的形状。
 */

/** 时间线条目：仓储行 → View */
export function toResumeItemViews(rows: ResumeItemRow[]): ResumeItemView[] {
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    subtitle: r.subtitle,
    period: r.period,
    stack: r.stack,
    highlights: r.highlights
  }))
}

/**
 * 拼出简历预览。
 * 没有解析结果时返回 null：界面据此提示「这份简历还没解析」。
 */
export function toResumeView(
  doc: ResumeDocumentRow | null,
  items: ResumeItemRow[],
  meta: { file: string; pages: number; updatedAt: Date }
): ResumeView | null {
  if (!doc) return null
  return {
    candidateId: doc.candidateId,
    file: meta.file,
    pages: meta.pages,
    updatedAt: meta.updatedAt.toISOString(),
    profile: doc.profile,
    intent: doc.intent,
    skills: doc.skills,
    contact: doc.contact,
    items: toResumeItemViews(items)
  }
}
