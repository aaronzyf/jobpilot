/**
 * 读模型转换层统一出口。
 *
 * 这一层是纯函数：输入仓储层的原始行，输出 @core 里的 View 类型。
 * 不碰数据库、不发 IPC，方便单独测试与复用。
 */
export * from './common'
export * from './candidates'
export * from './sources'
export * from './jobs'
export * from './applications'
export * from './conversations'
export * from './interviews'
export * from './analytics'
