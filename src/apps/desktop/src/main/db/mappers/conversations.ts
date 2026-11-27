import type { ConversationView } from '@core'
import type { ConversationRow, MessageRow } from '../repositories/conversations.repo'

/** 会话 + 消息 → 读模型。未读数由收到的消息里 readAt 为空的条数现算 */
export function toConversationViews(
  rows: ConversationRow[],
  messages: MessageRow[]
): ConversationView[] {
  const byConv = new Map<string, typeof messages>()
  for (const m of messages) {
    const list = byConv.get(m.conversationId) ?? []
    list.push(m)
    byConv.set(m.conversationId, list)
  }

  return rows.map((c) => {
    const list = byConv.get(c.id) ?? []
    return {
      id: c.id,
      jobId: c.jobId,
      candidateId: c.candidateId,
      sourceId: c.sourceId,
      peer: { name: c.peerName, title: c.peerTitle },
      stage: c.stage,
      unread: list.filter((m) => m.dir === 'in' && m.readAt === null).length,
      messages: list.map((m) => ({
        id: m.id,
        at: m.at.toISOString(),
        dir: m.dir,
        text: m.text
      }))
    }
  })
}
