import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
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
 * preload 只做一件事：把 IPC 的三个原语安全地暴露给渲染层。
 *
 * 这里不认识任何业务通道——通道名、参数、返回值都由 @core 的契约约束，
 * 新增通道时不用改这个文件。contextBridge 传的是函数，不是对象引用，
 * 渲染层拿不到 ipcRenderer 本体；on 返回的取消订阅函数也做了封口。
 */
const api = {
  platform: process.platform,

  invoke<K extends InvokeChannel>(
    channel: K,
    ...args: InvokeArgs<K>
  ): Promise<InvokeRes<K>> {
    return ipcRenderer.invoke(channel, ...args)
  },

  send<K extends SendChannel>(channel: K, ...args: SendArgs<K>): void {
    ipcRenderer.send(channel, ...args)
  },

  on<K extends EventChannel>(
    channel: K,
    cb: (payload: EventPayload<K>) => void
  ): () => void {
    // 去掉 Electron 的 event 对象，只把业务 payload 交给渲染层
    const listener = (_e: IpcRendererEvent, payload: EventPayload<K>) => cb(payload)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  }
}

export type JobpilotApi = typeof api

contextBridge.exposeInMainWorld('jobpilot', api)
