/**
 * 仓储层统一出口。
 *
 * 约定：这里（以及 repositories/ 下的文件）只做 SQL 与原始行的读写，
 * 不认识 @core 的读模型，也不做跨表拼装——那是 mapper 与 service 的职责。
 */
export * from './settings.repo'
export * from './candidates.repo'
export * from './sources.repo'
export * from './jobs.repo'
export * from './applications.repo'
export * from './conversations.repo'
export * from './interviews.repo'
export * from './analytics.repo'
