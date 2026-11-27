import { and, eq, isNull, like, or, sql, type SQL } from 'drizzle-orm'
import type { ViewQuery } from '@core'
import type { DatabaseHandle } from '../index'
import { schema } from '../index'

export type ConversationRow = typeof schema.conversations.$inferSelect
export type MessageRow = typeof schema.messages.$inferSelect

/** 会话按最后消息时间倒序 */
export function listConversations(handle: DatabaseHandle): ConversationRow[] {
  return handle.db
    .select()
    .from(schema.conversations)
    .orderBy(sql`coalesce(${schema.conversations.lastMessageAt}, 0) desc`)
    .all()
}

/** 消息按会话内序号升序，mapper 依此还原时间线 */
export function listMessages(handle: DatabaseHandle): MessageRow[] {
  return handle.db.select().from(schema.messages).orderBy(schema.messages.seq).all()
}

/** 沟通页筛选：未读用消息明细判断，不依赖内存里的 readIds */
export function queryConversationIds(
  handle: DatabaseHandle,
  query: ViewQuery
): string[] | undefined {
  const conds: SQL[] = []
  if (query.tab === 'unread') {
    conds.push(sql`exists (select 1 from messages where messages.conversation_id = ${schema.conversations.id} and messages.dir = 'in' and messages.read_at is null)`)
  }
  if (query.tab === 'interview') conds.push(eq(schema.conversations.stage, 'interview'))
  if (query.q?.trim()) {
    const kw = `%${query.q.trim()}%`
    conds.push(
      or(
        like(schema.conversations.peerName, kw),
        sql`exists (select 1 from jobs where jobs.id = ${schema.conversations.jobId} and (jobs.title like ${kw} or jobs.company like ${kw}))`,
        sql`exists (select 1 from messages where messages.conversation_id = ${schema.conversations.id} and messages.text like ${kw})`
      ) as SQL
    )
  }
  if (conds.length === 0) return undefined
  return handle.db
    .select({ id: schema.conversations.id })
    .from(schema.conversations)
    .where(and(...conds))
    .all()
    .map((r) => r.id)
}

/** 把某会话收到的未读消息标为已读；发出的消息本来就不需要读 */
export function markConversationRead(handle: DatabaseHandle, conversationId: string): void {
  handle.db
    .update(schema.messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(schema.messages.conversationId, conversationId),
        eq(schema.messages.dir, 'in'),
        isNull(schema.messages.readAt)
      )
    )
    .run()
}

export function markAllConversationsRead(handle: DatabaseHandle): void {
  handle.db
    .update(schema.messages)
    .set({ readAt: new Date() })
    .where(and(eq(schema.messages.dir, 'in'), isNull(schema.messages.readAt)))
    .run()
}

/** 追加发出的消息，同时把会话排序键推到现在。两条写在一个事务里 */
export function appendOutgoingMessage(
  handle: DatabaseHandle,
  conversationId: string,
  text: string
): void {
  const { db, sqlite } = handle
  const last = db
    .select({ seq: schema.messages.seq })
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .orderBy(sql`${schema.messages.seq} desc`)
    .limit(1)
    .get()
  const seq = (last?.seq ?? 0) + 1
  const at = new Date()

  sqlite.transaction(() => {
    db.insert(schema.messages)
      .values({
        id: `${conversationId}-${seq}`,
        conversationId,
        seq,
        at,
        dir: 'out',
        text,
        readAt: at
      })
      .run()
    db.update(schema.conversations)
      .set({ lastMessageAt: at })
      .where(eq(schema.conversations.id, conversationId))
      .run()
  })()
}
