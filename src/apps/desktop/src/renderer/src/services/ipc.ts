import type {
  EventChannel,
  EventPayload,
  InvokeArgs,
  InvokeChannel,
  InvokeRes,
  SendArgs,
  SendChannel
} from '@core'

/**
 * 渲染层唯一的跨进程入口。
 *
 * 页面和状态层不直接碰 window.jobpilot，也不关心通道名怎么拼：
 * - ipc.call('db:load', query) 请求数据，类型由契约推导；
 * - ipc.emit('theme:set-mode', mode) 单向通知；
 * - ipc.on('sql-log:entry', cb) 订阅主进程推送，返回取消订阅函数。
 *
 * 想换传输方式（比如以后改成 WebSocket）只改这一层。
 */
export const ipc = {
  call<K extends InvokeChannel>(channel: K, ...args: InvokeArgs<K>): Promise<InvokeRes<K>> {
    return window.jobpilot.invoke(channel, ...args)
  },

  emit<K extends SendChannel>(channel: K, ...args: SendArgs<K>): void {
    window.jobpilot.send(channel, ...args)
  },

  on<K extends EventChannel>(
    channel: K,
    cb: (payload: EventPayload<K>) => void
  ): () => void {
    return window.jobpilot.on(channel, cb)
  }
}
