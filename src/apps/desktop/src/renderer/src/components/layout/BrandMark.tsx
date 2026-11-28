import { cn } from '@/lib/utils'

/**
 * 品牌标识：环形准星 + 贯穿横线 + 中心命中点。
 *
 * 几何构造而不是渐变方块套字母 —— 后者在小尺寸下会糊成一团，也撑不起产品名。
 * 这里三段都是硬边：外环半透明做「取景框」，横线是横扫过来的扫描线，
 * 中心实心点是命中的那一个岗位。
 */
export function BrandMark({
  size = 16,
  className
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <circle
        cx="12"
        cy="12"
        r="7.2"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.5"
      />
      <path
        d="M1.8 12h4.4M17.8 12h4.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  )
}
