import type {
  ListQuery,
  NormalizedJob,
  RawJobDetail,
  RawJobSummary,
  SourceMeta
} from '../domain/types'

// ---------------------------------------------------------------- 运行时上下文

export interface SourceConfig {
  sourceId: string
  enabled: boolean
  refreshIntervalMin: number
  /** 已解密的凭据，仅在内存中短暂存在 */
  credentials: Record<string, string>
}

export interface Logger {
  info(message: string, meta?: unknown): void
  warn(message: string, meta?: unknown): void
  error(message: string, meta?: unknown): void
}

export interface SourceContext {
  config: SourceConfig
  logger: Logger
  signal: AbortSignal
  /** 浏览器型渠道通过它拿到 worker 里的 page，非浏览器渠道为 undefined */
  browser?: BrowserBridge
}

export interface BrowserBridge {
  openContext(sourceId: string): Promise<BrowserPage>
}

export interface BrowserPage {
  goto(url: string): Promise<void>
  evaluate<T>(script: string): Promise<T>
  close(): Promise<void>
}

// ---------------------------------------------------------------- 登录（R1）

export interface CredentialField {
  key: string
  label: string
  type: 'text' | 'password'
  placeholder?: string
  required: boolean
}

export interface Session {
  /** 不存密码，只存可复用的会话标识 */
  cookieRef: string
  expiresAt?: Date
}

export interface QrState {
  status: 'waiting' | 'scanned' | 'expired' | 'confirmed'
  imageDataUrl?: string
}

/**
 * 登录需求的显式建模。'none' 是合法状态 ——
 * 不需要登录的渠道（公开列表页、RSS）只需写成 { kind: 'none' }，不实现任何方法。
 */
export type AuthRequirement =
  | { kind: 'none' }
  | {
      kind: 'credentials'
      fields: CredentialField[]
      login(ctx: SourceContext, credentials: Record<string, string>): Promise<Session>
    }
  | {
      kind: 'qrcode'
      start(ctx: SourceContext): AsyncIterable<QrState>
    }
  | {
      kind: 'browser-manual'
      /** 打开登录页，用户在窗口里自己登录，程序只等 cookie 落地 */
      openLogin(ctx: SourceContext): Promise<Session>
    }

// ---------------------------------------------------------------- 能力接口

/** R1：取列表。异步迭代器天然支持分页与断点续爬 */
export interface ListProvider {
  fetchList(ctx: SourceContext, query: ListQuery): AsyncIterable<RawJobSummary>
}

/** R1：取详情。JD 全文、联系方式、投递线索 */
export interface DetailProvider {
  fetchDetail(ctx: SourceContext, ref: { externalId: string }): Promise<RawJobDetail>
}

/**
 * 归一化。单独拆出来是因为渠道原始字段差异最大
 * （薪资常是 "15-25K·14薪" 这种串），最需要脱离网络单独单测。
 */
export interface JobNormalizer {
  normalize(raw: RawJobSummary | RawJobDetail): NormalizedJob
}

export interface ApplyRequest {
  externalId: string
  /** 已渲染好的材料，由上层准备，渠道侧不负责生成内容 */
  resumeFilePath: string
  coverLetter: string
}

export interface ApplyResult {
  ok: boolean
  evidencePath?: string
  error?: string
}

/** 站内投递能力。只有站内沟通型渠道才实现 */
export interface ApplyProvider {
  apply(ctx: SourceContext, req: ApplyRequest): Promise<ApplyResult>
}

// ---------------------------------------------------------------- 组合

/**
 * 渠道 = 元信息 + 登录 + 若干可选能力 + 必填的归一化。
 * 用组合而不是一个大接口：没有的能力在类型层面就不存在，调用方无从误用。
 */
export interface JobSource {
  readonly meta: SourceMeta
  readonly auth: AuthRequirement
  readonly list?: ListProvider
  readonly detail?: DetailProvider
  readonly normalizer: JobNormalizer
  readonly apply?: ApplyProvider
}

// ---------------------------------------------------------------- 启动自检

/**
 * 把「声明了某能力但没实现」从运行时静默失败，提前到启动期显式报错。
 * 这是拆接口最实际的收益。
 */
export function assertSourceContract(source: JobSource): void {
  const declared = source.meta.capabilities
  const missing: string[] = []

  if (declared.list && !source.list) missing.push('list')
  if (declared.detail && !source.detail) missing.push('detail')
  if (declared.apply !== 'none' && !source.apply) missing.push('apply')

  if (missing.length > 0) {
    throw new Error(
      `[${source.meta.id}] 声明了能力但未实现：${missing.join(', ')}`
    )
  }
}
