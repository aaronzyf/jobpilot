import { cn } from '@/lib/utils'

/** 公司与求职者的字母头像：用色相区分，避免引入真实 logo 资源 */
export function Mark({
  text,
  hue,
  size = 28,
  className
}: {
  text: string
  hue: number
  size?: number
  className?: string
}) {
  const letter = text.trim().slice(0, 1).toUpperCase()
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-[7px] font-medium',
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        color: `hsl(${hue} 78% 74%)`,
        background: `hsl(${hue} 42% 22%)`,
        boxShadow: `inset 0 0 0 1px hsl(${hue} 40% 30%)`
      }}
    >
      {letter}
    </div>
  )
}

export function PersonAvatar({
  name,
  hue,
  size = 28
}: {
  name: string
  hue: number
  size?: number
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-medium"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        color: `hsl(${hue} 72% 80%)`,
        background: `hsl(${hue} 34% 24%)`,
        boxShadow: `inset 0 0 0 1px hsl(${hue} 36% 32%)`
      }}
    >
      {name.slice(0, 1)}
    </div>
  )
}
