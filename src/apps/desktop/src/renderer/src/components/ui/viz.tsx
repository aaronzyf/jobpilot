import { cn } from '@/lib/utils'
import { useT } from '@/i18n'

export function Bar({
  value,
  max = 100,
  className,
  trackClassName,
  height = 'h-1'
}: {
  value: number
  max?: number
  className?: string
  trackClassName?: string
  height?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-surface-3', height, trackClassName)}>
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', className)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/** 匹配度环形：比进度条更适合放在详情面板顶部 */
export function ScoreRing({
  score,
  size = 64,
  auto,
  reject
}: {
  score: number
  size?: number
  auto: number
  reject: number
}) {
  const t = useT()
  const stroke = size >= 60 ? 5 : 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color =
    score >= auto ? 'var(--accent)' : score >= reject ? 'var(--warning)' : 'var(--muted-bar)'
  const dash = (Math.min(100, score) / 100) * c

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: 'stroke-dasharray 600ms cubic-bezier(0.22,0.61,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="tnum font-medium leading-none text-fg"
          style={{ fontSize: size >= 60 ? 17 : 13 }}
        >
          {score}
        </span>
        {size >= 60 ? (
          <span className="mt-0.5 text-[9px] uppercase tracking-wider text-fg-subtle">
            {t('meta.scoreShort')}
          </span>
        ) : null}
      </div>
    </div>
  )
}

/** 迷你折线：放进指标卡里，不占额外空间 */
export function Sparkline({
  data,
  color = 'var(--accent)',
  width = 72,
  height = 22
}: {
  data: number[]
  color?: string
  width?: number
  height?: number
}) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const step = width / (data.length - 1)
  const pts = data.map((v, i) => `${i * step},${height - ((v - min) / span) * (height - 3) - 1.5}`)
  const line = pts.join(' ')
  const area = `0,${height} ${line} ${width},${height}`

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polygon points={area} fill={color} opacity="0.1" />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
