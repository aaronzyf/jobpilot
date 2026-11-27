import type { MatchRunView } from '@core'
import { ipc } from './ipc'

/**
 * 后台匹配事件的渲染层入口。
 * 主进程每轮扫完就推一次，这里只做订阅；数据仍在数据库，事件仅用于刷新界面状态。
 */
export function subscribeMatchRuns(
  cb: (runs: Record<string, MatchRunView>) => void
): () => void {
  return ipc.on('match:run', ({ runs }) => cb(runs))
}
