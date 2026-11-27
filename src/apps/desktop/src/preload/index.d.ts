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
 * 暴露给渲染层的桥。只有 invoke / send / on 三个通用函数，
 * 具体通道及其类型全部来自 @core 的 IPC 契约。
 */
export interface JobpilotApi {
  platform: string
  invoke<K extends InvokeChannel>(channel: K, ...args: InvokeArgs<K>): Promise<InvokeRes<K>>
  send<K extends SendChannel>(channel: K, ...args: SendArgs<K>): void
  on<K extends EventChannel>(channel: K, cb: (payload: EventPayload<K>) => void): () => void
}

declare global {
  interface Window {
    jobpilot: JobpilotApi
  }
}
