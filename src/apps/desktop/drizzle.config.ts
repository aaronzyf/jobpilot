import { defineConfig } from 'drizzle-kit'

// 只用于生成 SQL 迁移（drizzle-kit generate）。
// 运行时不读这个文件：迁移 SQL 由 ?raw 内联进主进程包，见 src/main/db/migrate.ts。
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/main/db/schema.ts',
  out: './drizzle',
  strict: true,
  verbose: true
})
