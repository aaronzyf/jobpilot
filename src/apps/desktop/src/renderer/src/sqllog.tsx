import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Check, Pause, Play, Search, Trash2 } from 'lucide-react'
import '@/index.css'

type Entry = Awaited<ReturnType<typeof window.jobpilot.sqlLog.list>>[number]

const clock = (at: number): string => {
  const d = new Date(at)
  const p = (n: number, width = 2) => String(n).padStart(width, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`
}

function SqlLogApp() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [enabled, setEnabled] = useState(true)
  const [query, setQuery] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const [copied, setCopied] = useState<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 主进程无窗口时也在采集，所以这里能拿到打开窗口之前的查询
    void Promise.all([window.jobpilot.sqlLog.list(), window.jobpilot.sqlLog.status()]).then(
      ([list, status]) => {
        setEntries(list)
        setEnabled(status.enabled)
      }
    )
    const offEntry = window.jobpilot.sqlLog.onEntry(({ entry }) => {
      setEntries((prev) => [...prev.slice(-499), entry])
    })
    const offCleared = window.jobpilot.sqlLog.onCleared(() => setEntries([]))
    return () => {
      offEntry()
      offCleared()
    }
  }, [])

  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [entries, autoScroll])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(
      (e) => e.sql.toLowerCase().includes(q) || e.params.some((p) => p.toLowerCase().includes(q))
    )
  }, [entries, query])

  const toggleCollect = () => {
    void window.jobpilot.sqlLog.setEnabled(!enabled).then((next) => setEnabled(next))
  }

  const clear = () => {
    void window.jobpilot.sqlLog.clear().then((list) => setEntries(list))
  }

  const copy = (entry: Entry) => {
    const text = entry.params.length
      ? `${entry.sql}\n-- params: ${entry.params.join(', ')}`
      : entry.sql
    void navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(entry.seq)
    setTimeout(() => setCopied(null), 1200)
  }

  return (
    <div className="flex h-screen flex-col bg-bg text-fg">
      <header className="drag win-inset flex h-11 shrink-0 items-center gap-3 border-b border-line px-4">
        <span className="text-[12.5px] font-medium">SQL 日志</span>
        <span className="tnum rounded bg-surface-3 px-1.5 py-0.5 text-[10px] text-fg-muted">
          {entries.length}
        </span>
        {!enabled && (
          <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] text-warning">
            已暂停
          </span>
        )}

        <div className="no-drag ml-auto flex items-center gap-1.5">
          <div className="flex h-7 w-[176px] items-center gap-1.5 rounded-md border border-line bg-surface-2 px-2">
            <Search size={12} strokeWidth={1.8} className="shrink-0 text-fg-subtle" />
            <input
              data-sql-filter
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="过滤 SQL / 参数"
              className="min-w-0 flex-1 bg-transparent text-[11px] text-fg outline-none placeholder:text-fg-subtle"
            />
          </div>

          <button
            data-sql-autoscroll
            onClick={() => setAutoScroll((v) => !v)}
            title="自动滚动到最新"
            className={`h-7 rounded-md border px-2 text-[10.5px] transition-colors ${
              autoScroll
                ? 'border-accent/40 bg-accent-soft text-accent-strong'
                : 'border-line bg-surface-2 text-fg-subtle hover:text-fg'
            }`}
          >
            跟随
          </button>
          <button
            data-sql-toggle
            onClick={toggleCollect}
            title={enabled ? '暂停采集' : '继续采集'}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface-2 text-fg-muted transition-colors hover:text-fg"
          >
            {enabled ? <Pause size={12.5} /> : <Play size={12.5} />}
          </button>
          <button
            data-sql-clear
            onClick={clear}
            title="清空日志"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface-2 text-fg-muted transition-colors hover:text-fg"
          >
            <Trash2 size={12.5} />
          </button>
        </div>
      </header>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        {rows.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[12px] text-fg-subtle">
            {entries.length === 0 ? '等待 SQL 查询…' : '没有匹配的日志'}
          </div>
        ) : (
          <div className="divide-y divide-line">
            {rows.map((entry) => (
              <div
                key={entry.seq}
                onClick={() => copy(entry)}
                title="点击复制"
                className="group grid grid-cols-[52px_92px_1fr] gap-3 px-4 py-2 transition-colors hover:bg-surface-2"
              >
                <span className="tnum pt-px text-[10px] text-fg-subtle">#{entry.seq}</span>
                <span className="tnum pt-px text-[10px] text-fg-subtle">{clock(entry.at)}</span>
                <div className="min-w-0">
                  <div className="flex items-start gap-2">
                    <code className="min-w-0 flex-1 whitespace-pre-wrap break-all font-mono text-[11.5px] leading-[1.55] text-fg-muted group-hover:text-fg">
                      {entry.sql}
                    </code>
                    {copied === entry.seq && (
                      <Check size={12} className="mt-0.5 shrink-0 text-success" />
                    )}
                  </div>
                  {entry.params.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {entry.params.map((p, i) => (
                        <span
                          key={i}
                          className="tnum max-w-[280px] truncate rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle"
                          title={p}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="drag win-inset flex h-7 shrink-0 items-center border-t border-line px-4 text-[10px] text-fg-subtle">
        采集自主进程 · 保留最近 500 条 · 点击任意一行复制 SQL
      </footer>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<SqlLogApp />)
