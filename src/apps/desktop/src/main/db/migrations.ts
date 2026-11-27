import init0000 from '../../../drizzle/0000_smiling_zuras.sql?raw'

/**
 * 迁移清单。
 *
 * 迁移 SQL 由 `pnpm --filter @jobpilot/desktop db:generate`（drizzle-kit）生成，
 * 再用 ?raw 内联进主进程包：这样打包后不需要额外拷贝 migrations 目录，
 * 也不用约定 asar 之外的资源路径。新增迁移时在末尾追加一项，顺序即执行顺序。
 */
export const migrations: { id: string; sql: string }[] = [
  { id: '0000_smiling_zuras', sql: init0000 }
]
