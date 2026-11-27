/** 读模型转换共用的时间工具。DB 里是毫秒整数，跨 IPC 统一用 ISO 字符串 */

export const iso = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null)
export const isoOf = (d: Date | null | undefined): string =>
  d ? d.toISOString() : new Date(0).toISOString()

/** 本地日期键，形如 2026-11-27 */
export const dayKey = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/** 近 n 天（含今天）的零点日期，升序 */
export function lastDays(n: number): Date[] {
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
