/**
 * 端到端验证：建库 → 跑种子 → 读简历预览。
 * 走的是主进程同一套源码，不是另写一遍逻辑。
 */
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { openDatabase } from '../src/apps/desktop/src/main/db/index'
import { seedIfEmpty } from '../src/apps/desktop/src/main/db/seed'
import { readResume } from '../src/apps/desktop/src/main/db/services/read.service'

const file = '/tmp/jobpilot-resume-e2e.db'
const handle = openDatabase(file)

const seeded = seedIfEmpty(handle)
console.log('[e2e] seeded:', seeded)

const resume = readResume(handle, 'c1')
if (!resume) {
  console.error('[e2e] FAIL: c1 简历读不到')
  process.exit(1)
}
console.log('[e2e] file:', resume.file)
console.log('[e2e] pages:', resume.pages)
console.log('[e2e] profile length:', resume.profile.length)
console.log('[e2e] intent length:', resume.intent.length)
console.log('[e2e] skill groups:', resume.skills.map((s) => `${s.group}(${s.items.length})`).join(', '))
console.log('[e2e] contact:', JSON.stringify(resume.contact))
console.log('[e2e] items:', resume.items.length)
for (const item of resume.items) {
  console.log(`  - [${item.kind}] ${item.title} | ${item.subtitle} | ${item.period} | ${item.highlights.length} 条`)
}

const other = readResume(handle, 'c2')
console.log('[e2e] c2 items:', other?.items.length, 'skills:', other?.skills.length)
const missing = readResume(handle, 'nope')
console.log('[e2e] 不存在的档案返回:', missing)

handle.sqlite.close()
