import { ipcMain, type IpcMainEvent, type IpcMainInvokeEvent, type WebContents } from 'electron'
import type {
  EventChannel,
  EventPayload,
  InvokeArgs,
  InvokeChannel,
  InvokeReq,
  InvokeRes,
  SendArgs,
  SendChannel,
  SendPayload
} from '@core'

/**
 * 主进程侧唯一的 IPC 注册入口。
 *
 * 通道名、参数、返回值全部来自 @core 的契约表：
 * - registerInvoke 的类型签名让 handler 自动拿到 req 的类型，返回值必须可赋给 res；
 * - registerSend 同理；
 * - emit 只允许推送契约里声明过的事件。
 *
 * 业务模块只管注册 handler，不再自己碰 ipcMain.handle/on，
 * 也不再手写 unknown 参数校验之外的通道字符串。
 */

type InvokeHandler<K extends InvokeChannel> = (
  event: IpcMainInvokeEvent,
  payload: InvokeReq<K>
) => InvokeRes<K> | Promise<InvokeRes<K>>

type SendHandler<K extends SendChannel> = (
  event: IpcMainEvent,
  payload: SendPayload<K>
) => void

/** 注册请求-响应通道。重复注册同一通道会覆盖，开发期只应调用一次 */
export function registerInvoke<K extends InvokeChannel>(channel: K, handler: InvokeHandler<K>): void {
  ipcMain.handle(channel, (event, ...args: InvokeArgs<K>) => handler(event, args[0] as InvokeReq<K>))
}

/** 注册单向通知通道 */
export function registerSend<K extends SendChannel>(channel: K, handler: SendHandler<K>): void {
  ipcMain.on(channel, (event, ...args: SendArgs<K>) => handler(event, args[0] as SendPayload<K>))
}

/** 主进程主动推送事件到指定窗口 */
export function emit<K extends EventChannel>(
  target: WebContents,
  channel: K,
  ...args: EventPayload<K> extends void ? [] : [payload: EventPayload<K>]
): void {
  if (target.isDestroyed()) return
  target.send(channel, ...args)
}
