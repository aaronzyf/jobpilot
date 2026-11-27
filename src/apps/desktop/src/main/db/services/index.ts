/**
 * 业务用例层统一出口。
 *
 * 它是主进程里唯一被 IPC 层调用的数据入口：上层只传查询条件与参数，
 * 下层自己去调仓储和 mapper。RPC 处理器不拼数据、不写 SQL。
 */
export * from './read.service'
export * from './write.service'
