/**
 * 渠道标识：色块 + 缩写。
 *
 * 各招聘站点的商标不能直接取用，这里用「品牌色 + 首字母」做可辨识的占位标识，
 * 视觉上能一眼分清是哪条渠道，等接入真实渠道适配器后再替换成官方素材。
 */
export interface ChannelBrand {
  /** 色块里的缩写文字 */
  short: string
  /** 色块底色 */
  color: string
}

const BRANDS: Record<string, ChannelBrand> = {
  boss: { short: 'B', color: '#00a3a3' },
  linkedin: { short: 'in', color: '#0a66c2' },
  greenhouse: { short: 'G', color: '#2e9e63' },
  ashby: { short: 'A', color: '#6b5bd2' },
  liepin: { short: 'L', color: '#ff5c00' }
}

const FALLBACK: ChannelBrand = { short: '?', color: '#66666f' }

/** 按渠道 id 取标识；未知渠道退回首字母 */
export function channelBrand(sourceId: string, name: string): ChannelBrand {
  const hit = BRANDS[sourceId]
  if (hit) return hit
  const initial = name.trim().slice(0, 1).toUpperCase()
  return initial ? { ...FALLBACK, short: initial } : FALLBACK
}
