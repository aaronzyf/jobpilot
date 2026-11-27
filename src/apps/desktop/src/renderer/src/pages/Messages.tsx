import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, CheckCheck, Send, Sparkles } from 'lucide-react'
import { Mark, PersonAvatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form'
import { Empty } from '@/components/ui/misc'
import { Segmented } from '@/components/ui/switch'
import { useI18n } from '@/i18n'
import { clockLabel, dayDiff, dayLabel, relativeLabel, stageMeta } from '@/lib/meta'
import { useApp } from '@/lib/store'
import { cn } from '@/lib/utils'

type Tab = 'all' | 'unread' | 'interview'

export function Messages() {
  const {
    go,
    toast,
    readIds,
    markRead,
    markAllRead,
    focusConvId,
    conversations,
    jobs,
    candidates,
    sources,
    sendMessage,
    setViewFilter,
    filterIds
  } = useApp()
  const { lang, t } = useI18n()

  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id ?? null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const bodyRef = useRef<HTMLDivElement>(null)

  const sourceName = (id: string) => sources.find((s) => s.id === id)?.name ?? id
  const unreadOf = (id: string, n: number) => (readIds.includes(id) ? 0 : n)

  // 工具条条件变化 → 重新查库；SQL 命中集只收窄列表，标签计数仍看全量
  useEffect(() => {
    setViewFilter({ tab, q })
  }, [tab, q, setViewFilter])

  // 会话按最近一条消息排序，与是否被筛选无关
  const ordered = useMemo(() => {
    return [...conversations]
      .map((c) => ({ conv: c, last: c.messages[c.messages.length - 1] }))
      .sort((a, b) => new Date(b.last?.at ?? 0).getTime() - new Date(a.last?.at ?? 0).getTime())
  }, [conversations])

  const rows = ordered.filter(({ conv, last }) => {
    if (filterIds !== null && !filterIds.includes(conv.id)) return false
    if (tab === 'unread' && unreadOf(conv.id, conv.unread) === 0) return false
    if (tab === 'interview' && conv.stage !== 'interview') return false
    if (q.trim()) {
      const job = jobs.find((j) => j.id === conv.jobId)
      const cand = candidates.find((c) => c.id === conv.candidateId)
      const hay =
        `${job?.title ?? ''} ${job?.company ?? ''} ${conv.peer.name} ${cand?.name ?? ''} ${last?.text ?? ''}`.toLowerCase()
      if (!hay.includes(q.trim().toLowerCase())) return false
    }
    return true
  })

  const totalUnread = conversations.reduce((n, c) => n + unreadOf(c.id, c.unread), 0)
  const selected = conversations.find((c) => c.id === selectedId) ?? null
  const selectedJob = selected ? jobs.find((j) => j.id === selected.jobId) ?? null : null
  const selectedCand = selected ? candidates.find((c) => c.id === selected.candidateId) ?? null : null
  const thread = selected ? selected.messages : []

  // 从别的页面（比如面试邀约）跳过来时，直接打开指定的会话
  useEffect(() => {
    if (focusConvId && conversations.some((c) => c.id === focusConvId)) {
      setSelectedId(focusConvId)
    }
  }, [focusConvId])

  // 选中会话即视为读过（readIds 在 store 里，侧栏未读数会同步减）
  useEffect(() => {
    if (selected && selected.unread > 0) markRead([selected.id])
  }, [selected, markRead])

  // 切换会话或发出新消息时贴到底部
  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [selectedId, thread.length])

  const draftText = selected ? draft[selected.id] ?? '' : ''

  const send = () => {
    if (!selected || !draftText.trim()) return
    // 先清输入框再落库：写库是异步的，等回来再清会看到文字闪一下
    sendMessage(selected.id, draftText.trim())
    setDraft((prev) => ({ ...prev, [selected.id]: '' }))
    toast(t('messages.sendToast', { name: selected.peer.name }), 'success')
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* 工具条 */}
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-5 py-2">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'all', label: t('messages.tabAll'), badge: conversations.length },
            { value: 'unread', label: t('messages.tabUnread'), badge: totalUnread },
            {
              value: 'interview',
              label: t('messages.tabInterview'),
              badge: conversations.filter((c) => c.stage === 'interview').length
            }
          ]}
        />

        <div className="ml-auto flex items-center gap-1.5">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('messages.searchPlaceholder')}
            className="h-7 w-[208px] text-[11.5px]"
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={totalUnread === 0}
            onClick={() => {
              markAllRead()
              toast(t('messages.readAllDone'), 'success')
            }}
          >
            <CheckCheck size={12} />
            {t('messages.markAllRead')}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* 左：会话列表 */}
        <div className="flex w-[300px] shrink-0 flex-col border-r border-line">
          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
            {rows.map(({ conv, last }) => {
              const job = jobs.find((j) => j.id === conv.jobId)
              const cand = candidates.find((c) => c.id === conv.candidateId)
              const unread = unreadOf(conv.id, conv.unread)
              const active = conv.id === selectedId
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={cn(
                    'block w-full border-b border-line/70 px-3 py-2.5 text-left transition-colors',
                    active ? 'bg-accent/[0.07]' : 'hover:bg-surface-2/70'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <Mark text={job?.company ?? '?'} hue={job?.hue ?? 220} size={26} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span
                          className={cn(
                            'truncate text-[11.5px]',
                            unread ? 'font-medium text-fg' : 'text-fg'
                          )}
                        >
                          {job?.title}
                        </span>
                        <span className="ml-auto shrink-0 text-[9.5px] text-fg-subtle">
                          {last ? relativeLabel(lang, last.at) : ''}
                        </span>
                      </div>

                      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-fg-subtle">
                        <span className="truncate">{job?.company}</span>
                        <span className="shrink-0">·</span>
                        <PersonAvatar name={cand?.name ?? '?'} hue={cand?.hue ?? 220} size={13} />
                        <span className="truncate">{cand?.name}</span>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="min-w-0 flex-1 truncate text-[10.5px] leading-tight text-fg-muted">
                          {last?.dir === 'out' ? `${t('messages.sentYou')}: ` : ''}
                          {last?.text}
                        </span>
                        {unread > 0 ? (
                          <span className="tnum flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-accent px-1 text-[9.5px] font-medium text-white">
                            {unread}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}

            {rows.length === 0 ? (
              <Empty
                title={conversations.length === 0 ? t('messages.emptyTitle') : t('messages.noMatchTitle')}
                hint={conversations.length === 0 ? t('messages.emptyHint') : t('messages.noMatchHint')}
              />
            ) : null}
          </div>

          <div className="flex h-7 shrink-0 items-center gap-2 border-t border-line px-3 text-[10px] text-fg-subtle">
            <span className="truncate">{t('messages.footerCount', { n: rows.length })}</span>
            {totalUnread > 0 ? (
              <span className="ml-auto shrink-0 whitespace-nowrap">
                {t('messages.footerUnread', { n: totalUnread })}
              </span>
            ) : null}
          </div>
        </div>

        {/* 右：对话 */}
        <div className="flex min-w-0 flex-1 flex-col">
          {selected && selectedJob && selectedCand ? (
            <>
              <div className="flex shrink-0 items-start gap-2.5 border-b border-line px-4 py-2.5">
                <Mark text={selectedJob.company} hue={selectedJob.hue} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[12.5px] font-medium">{selectedJob.title}</span>
                    <Badge tone={stageMeta[selected.stage].tone} dot>
                      {t(stageMeta[selected.stage].labelKey)}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[10.5px] text-fg-subtle">
                    <span className="truncate">{selectedJob.company}</span>
                    <span className="shrink-0">·</span>
                    <span className="truncate">
                      {selected.peer.name} · {selected.peer.title}
                    </span>
                    <span className="shrink-0">·</span>
                    <PersonAvatar name={selectedCand.name} hue={selectedCand.hue} size={13} />
                    <span className="shrink-0">{selectedCand.name}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  className="gap-1"
                  onClick={() => go('jobs', selectedJob.id)}
                >
                  {t('messages.openJob')}
                  <ArrowUpRight size={11} />
                </Button>
              </div>

              <div
                ref={bodyRef}
                className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overflow-x-hidden px-4 py-3 [scrollbar-gutter:stable]"
              >
                {thread.map((m, i) => {
                  const prev = thread[i - 1]
                  const showDay = !prev || dayDiff(prev.at) !== dayDiff(m.at)
                  const diff = dayDiff(m.at)
                  return (
                    <div key={m.id}>
                      {showDay ? (
                        <div className="my-2 flex items-center gap-2 text-[9.5px] text-fg-subtle">
                          <span className="h-px flex-1 bg-line" />
                          <span className="shrink-0">
                            {diff === 0
                              ? t('messages.dayToday')
                              : diff === 1
                                ? t('messages.dayYesterday')
                                : dayLabel(lang, m.at)}
                          </span>
                          <span className="h-px flex-1 bg-line" />
                        </div>
                      ) : null}
                      <div className={cn('flex', m.dir === 'out' ? 'justify-end' : 'justify-start')}>
                        <div
                          className={cn(
                            'max-w-[76%] rounded-lg px-3 py-2 text-[11.5px] leading-relaxed',
                            m.dir === 'out'
                              ? 'rounded-br-sm bg-accent text-white'
                              : 'rounded-bl-sm border border-line bg-bubble text-fg'
                          )}
                        >
                          <div className="whitespace-pre-wrap break-words">{m.text}</div>
                          <div
                            className={cn(
                              'mt-1 text-[9px]',
                              m.dir === 'out' ? 'text-white/65' : 'text-fg-subtle'
                            )}
                          >
                            {clockLabel(lang, m.at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 回复框 */}
              <div className="shrink-0 border-t border-line px-3 py-2.5">
                <div className="rounded-md border border-line bg-surface-2 px-2.5 py-2 transition-colors focus-within:border-line-strong">
                  <textarea
                    value={draftText}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, [selected.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        send()
                      }
                    }}
                    rows={2}
                    placeholder={t('messages.composerPlaceholder')}
                    className="block w-full resize-none bg-transparent text-[11.5px] leading-relaxed text-fg placeholder:text-fg-subtle focus:outline-none"
                  />
                  <div className="mt-1 flex items-center gap-1.5">
                    <Button
                      size="xs"
                      variant="ghost"
                      className="gap-1"
                      onClick={() => toast(t('messages.draftToast'), 'default')}
                    >
                      <Sparkles size={10} />
                      {t('messages.draft')}
                    </Button>
                    <span className="ml-auto truncate text-[9.5px] text-fg-subtle">
                      {t('messages.sendHint', { source: sourceName(selected.sourceId) })}
                    </span>
                    <Button
                      size="xs"
                      variant="primary"
                      className="gap-1"
                      disabled={!draftText.trim()}
                      onClick={send}
                    >
                      <Send size={10} />
                      {t('messages.send')}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Empty title={t('messages.selectTitle')} hint={t('messages.selectHint')} />
          )}
        </div>
      </div>
    </div>
  )
}
