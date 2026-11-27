import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrations } from './migrations'
import * as schema from './schema'

/**
 * 迁移执行器。
 *
 * 没用 drizzle 官方的 migrator：它需要 migrations 目录在磁盘上存在，
 * 而这里的迁移是内联进包的。逻辑很短，自己跑更可控：
 * 记一张 _migrations 表，已执行过的跳过，整批包在一个事务里。
 */
function applyMigrations(sqlite: Database.Database): void {
  sqlite.exec(
    'create table if not exists _migrations (id text primary key, applied_at integer not null)'
  )
  const done = new Set(
    sqlite
      .prepare('select id from _migrations')
      .all()
      .map((row) => (row as { id: string }).id)
  )
  const pending = migrations.filter((m) => !done.has(m.id))
  if (pending.length === 0) return

  const run = sqlite.transaction(() => {
    for (const m of pending) {
      for (const stmt of m.sql.split('--> statement-breakpoint')) {
        const sql = stmt.trim()
        if (sql) sqlite.exec(sql)
      }
      sqlite
        .prepare('insert into _migrations (id, applied_at) values (?, ?)')
        .run(m.id, Date.now())
    }
  })
  run()
}

export type DatabaseHandle = {
  sqlite: Database.Database
  db: BetterSQLite3Database<typeof schema>
}

export function openDatabase(file: string): DatabaseHandle {
  const sqlite = new Database(file)
  // WAL 让读写不互相阻塞；NORMAL 在 WAL 下已足够安全，且省一次 fsync
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('synchronous = NORMAL')
  // SQLite 默认不校验外键，必须每连接打开
  sqlite.pragma('foreign_keys = ON')
  applyMigrations(sqlite)

  return { sqlite, db: drizzle(sqlite, { schema }) }
}

export { schema }
