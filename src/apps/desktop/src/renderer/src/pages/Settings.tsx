import { useEffect, useState, type ReactNode } from 'react'
import {
  Check,
  Cpu,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Palette,
  Plug,
  RefreshCw,
  Send,
  ShieldCheck,
  TriangleAlert
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { ThemeChoices } from '@/components/layout/ThemeSwitch'
import { useI18n, type TKey } from '@/i18n'
import { authMeta, relativeLabel, sourceStateMeta } from '@/lib/meta'
import { useApp } from '@/lib/store'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { ipc } from '@/services/ipc'

type Section = 'model' | 'sources' | 'delivery' | 'mail' | 'appearance' | 'data'

const nav: { key: Section; labelKey: TKey; icon: typeof Cpu }[] = [
  { key: 'model', labelKey: 'settings.navModel', icon: Cpu },
  { key: 'sources', labelKey: 'settings.navSources', icon: Plug },
  { key: 'delivery', labelKey: 'settings.navDelivery', icon: Send },
  { key: 'mail', labelKey: 'settings.navMail', icon: Mail },
  { key: 'appearance', labelKey: 'settings.navAppearance', icon: Palette },
  { key: 'data', labelKey: 'settings.navData', icon: Database }
]

function Row({
  label,
  desc,
  children
}: {
  label: ReactNode
  desc?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-fg">{label}</div>
        {desc ? <div className="mt-0.5 text-[10.5px] leading-relaxed text-fg-subtle">{desc}</div> : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  )
}

function Block({
  title,
  desc,
  action,
  children
}: {
  title: string
  desc?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 px-4 pb-2.5 pt-3">
        <div>
          <div className="text-[12.5px] font-medium">{title}</div>
          {desc ? <div className="mt-0.5 text-[10.5px] text-fg-subtle">{desc}</div> : null}
        </div>
        {action}
      </div>
      {children}
    </Card>
  )
}

const providers: {
  id: string
  name?: string
  nameKey?: TKey
  noteKey: TKey
  models: string
}[] = [
  { id: 'deepseek', name: 'DeepSeek', noteKey: 'settings.providerDeepseekNote', models: 'deepseek-chat / reasoner' },
  { id: 'anthropic', name: 'Anthropic', noteKey: 'settings.providerAnthropicNote', models: 'claude-sonnet-4.6' },
  { id: 'openai', name: 'OpenAI', noteKey: 'settings.providerOpenaiNote', models: 'gpt-5.2 / o4-mini' },
  { id: 'ollama', nameKey: 'settings.providerNameOllama', noteKey: 'settings.providerOllamaNote', models: 'qwen3:14b' }
]

export function Settings() {
  const { toast, candidates, sources, llmUsage, jobs, applications, resetData } = useApp()
  const { theme } = useTheme()
  const { t, lang } = useI18n()
  const [section, setSection] = useState<Section>('model')
  const [provider, setProvider] = useState('deepseek')
  const [showKey, setShowKey] = useState(false)
  const [autoSend, setAutoSend] = useState(false)
  const [auto, setAuto] = useState(85)
  const [reject, setReject] = useState(40)
  // 库里文件的实际位置由主进程给出，不在前端拼路径
  const [dbPath, setDbPath] = useState('')

  useEffect(() => {
    void ipc.call('app:info').then((info) => setDbPath(`${info.dataDir}/jobpilot.db`))
  }, [])

  return (
    <div className="flex h-full min-h-0">
      <div className="w-[172px] shrink-0 border-r border-line px-2 py-3">
        <div className="mb-1 px-2 text-[10px] uppercase tracking-wider text-fg-subtle">
          {t('settings.sideTitle')}
        </div>
        {nav.map((n) => {
          const Icon = n.icon
          const active = section === n.key
          return (
            <button
              key={n.key}
              data-section={n.key}
              onClick={() => setSection(n.key)}
              className={cn(
                'flex h-7 w-full items-center gap-2 rounded-md px-2 text-[12px] transition-colors',
                active ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
              )}
            >
              <Icon size={13} strokeWidth={1.7} className={active ? 'text-accent-strong' : 'text-fg-subtle'} />
              {t(n.labelKey)}
            </button>
          )
        })}
        <div className="mt-4 rounded-md border border-line bg-surface px-2.5 py-2 text-[10px] leading-relaxed text-fg-subtle">
          {t('settings.sideNote')}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        <div className="mx-auto w-full max-w-[760px] px-5 py-4">
          {section === 'model' ? (
            <div className="space-y-2.5">
              <Block title={t('settings.providerTitle')} desc={t('settings.providerDesc')}>
                <div className="grid grid-cols-4 gap-2 px-4 pb-3.5">
                  {providers.map((p) => {
                    const active = provider === p.id
                    return (
                      <button
                        key={p.id}
                        onClick={() => setProvider(p.id)}
                        className={cn(
                          'relative rounded-md border px-2.5 py-2 text-left transition-colors',
                          active
                            ? 'border-accent/50 bg-accent/[0.07]'
                            : 'border-line bg-surface-2 hover:border-line-strong'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-fg">
                            {p.nameKey ? t(p.nameKey) : p.name}
                          </span>
                          {active ? <Check size={11} className="text-accent" /> : null}
                        </div>
                        <div className="mt-1 text-[9.5px] leading-tight text-fg-subtle">
                          {t(p.noteKey)}
                        </div>
                        <div className="mt-1 truncate font-mono text-[9px] text-fg-subtle">
                          {p.models}
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div className="border-t border-line px-4 py-3">
                  <Field label="API Key" hint={t('settings.apiKeyHint')}>
                    <div className="flex gap-1.5">
                      <div className="relative flex-1">
                        <Input
                          type={showKey ? 'text' : 'password'}
                          defaultValue="sk-1f8c9d2e4b7a6c3d5e8f0a2b4c6d8e0f"
                          className="pr-8 font-mono text-[11px]"
                        />
                        <button
                          onClick={() => setShowKey((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg"
                        >
                          {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => toast(t('settings.toastConnect'), 'success')}
                      >
                        <RefreshCw size={11} />
                        {t('settings.testConnection')}
                      </Button>
                    </div>
                  </Field>
                </div>
              </Block>

              <Block title={t('settings.sceneTitle')} desc={t('settings.sceneDesc')}>
                <div className="divide-y divide-line border-t border-line">
                  {([
                    ['settings.sceneJd', 'deepseek-chat', 'settings.sceneJdNote'],
                    ['settings.sceneMatch', 'deepseek-chat', 'settings.sceneMatchNote'],
                    ['settings.sceneLetter', 'claude-sonnet-4.6', 'settings.sceneLetterNote'],
                    ['settings.sceneField', 'deepseek-chat', 'settings.sceneFieldNote']
                  ] as const
                ).map(([label, model, note]) => (
                    <div key={label} className="flex items-center gap-3 px-4 py-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[11.5px] text-fg">{t(label)}</div>
                        <div className="text-[10px] text-fg-subtle">{t(note)}</div>
                      </div>
                      <Select defaultValue={model} className="h-7 w-[168px] text-[11px]">
                        <option value={model}>{model}</option>
                        <option value="deepseek-reasoner">deepseek-reasoner</option>
                        <option value="qwen3:14b">{t('settings.localModel', { v: 'qwen3:14b' })}</option>
                      </Select>
                    </div>
                  ))}
                </div>
              </Block>

              <Block title={t('settings.usageTitle')} desc={t('settings.usageDesc')}>
                <div className="border-t border-line">
                  {llmUsage.map((u) => (
                    <div key={u.labelKey} className="flex items-center gap-3 px-4 py-1.5 text-[11px]">
                      <span className="w-[110px] shrink-0 truncate text-fg-muted">
                        {t(u.labelKey as TKey)}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-fg-subtle">
                        {u.model}
                      </span>
                      <span className="tnum w-14 shrink-0 text-right text-fg-subtle">
                        {t('settings.usageCalls', { n: u.calls })}
                      </span>
                      <span className="tnum w-12 shrink-0 text-right text-fg">{u.cost}</span>
                    </div>
                  ))}
                </div>
              </Block>
            </div>
          ) : null}

          {section === 'sources' ? (
            <div className="space-y-2.5">
              <Card className="flex items-center gap-3 px-4 py-2.5">
                <Plug size={13} className="shrink-0 text-fg-subtle" />
                <div className="min-w-0 flex-1 text-[10.5px] leading-relaxed text-fg-subtle">
                  {t('settings.sourcesDesc')}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => toast(t('settings.toastAddSource'), 'default')}
                >
                  <Plug size={11} />
                  {t('settings.addSource')}
                </Button>
              </Card>

              {sources.map((s) => {
                const meta = sourceStateMeta[s.state]
                return (
                  <Card key={s.id} className="px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12.5px] font-medium text-fg">{s.name}</span>
                          <Badge tone={s.region === 'cn' ? 'neutral' : 'accent'}>
                            {s.region === 'cn' ? t('meta.regionCn') : t('meta.regionGlobal')}
                          </Badge>
                          <Badge tone={meta.tone} dot>
                            {t(meta.labelKey)}
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10.5px] text-fg-subtle">
                          <span>{t('settings.authMethod', { v: t(authMeta[s.auth]) })}</span>
                          <span>{t('settings.account', { v: s.account })}</span>
                          <span>{t('settings.detailCap', { v: s.capabilities.join(' / ') })}</span>
                        </div>
                      </div>
                      <Switch
                        checked={s.state !== 'paused'}
                        onChange={(v) =>
                          toast(
                            v
                              ? t('settings.toastEnabled', { name: s.name })
                              : t('settings.toastPaused', { name: s.name }),
                            'default'
                          )
                        }
                      />
                    </div>

                    <div className="mt-2.5 flex items-end gap-2">
                      <Field label={t('settings.refresh')} className="w-[132px]">
                        <Select defaultValue={String(s.intervalMin)} className="h-7 text-[11px]">
                          <option value="15">{t('settings.every15')}</option>
                          <option value="30">{t('settings.every30')}</option>
                          <option value="60">{t('settings.every1h')}</option>
                          <option value="120">{t('settings.every2h')}</option>
                          <option value="360">{t('settings.every6h')}</option>
                        </Select>
                      </Field>
                      <Field label={t('settings.limitLabel')} className="w-[92px]">
                        <Input defaultValue="100" className="h-7 text-[11px]" />
                      </Field>
                      <div className="flex-1 pb-0.5 text-[10px] leading-relaxed text-fg-subtle">
                        {t('settings.runSummary', {
                          last: s.lastRunAt ? relativeLabel(lang, s.lastRunAt) : '—',
                          next: s.nextRunAt ? relativeLabel(lang, s.nextRunAt) : t('settings.relogin'),
                          n: s.found
                        })}
                      </div>
                      <Button
                        variant={s.state === 'error' ? 'primary' : 'outline'}
                        size="sm"
                        className="gap-1.5"
                        onClick={() =>
                          toast(
                            s.state === 'error'
                              ? t('settings.toastRelogin', { name: s.name })
                              : t('settings.toastSavedSource', { name: s.name }),
                            'success'
                          )
                        }
                      >
                        {s.state === 'error' ? <KeyRound size={11} /> : null}
                        {s.state === 'error' ? t('settings.relogin') : t('settings.config')}
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : null}

          {section === 'delivery' ? (
            <div className="space-y-2.5">
              <Block
                title={t('settings.autoApplyTitle')}
                desc={t('settings.autoApplyDesc')}
                action={<Switch checked={autoSend} onChange={setAutoSend} />}
              >
                <div
                  className={cn(
                    'mx-4 mb-3 flex items-start gap-2 rounded-md border px-2.5 py-2 text-[10.5px] leading-relaxed',
                    autoSend
                      ? 'border-warning/30 bg-warning/8 text-warning/90'
                      : 'border-line bg-surface-2 text-fg-subtle'
                  )}
                >
                  <TriangleAlert size={11} className="mt-0.5 shrink-0" />
                  {autoSend ? t('settings.autoOnNote') : t('settings.autoOffNote')}
                </div>
                <Row label={t('settings.dailyCapTitle')} desc={t('settings.dailyCapDesc')}>
                  <div className="flex items-center gap-1.5">
                    <Input defaultValue="30" className="h-7 w-16 text-right text-[11px]" />
                    <span className="text-[10.5px] text-fg-subtle">{t('settings.perChannel')}</span>
                  </div>
                </Row>
                <Row label={t('settings.windowTitle')} desc={t('settings.windowDesc')}>
                  <Select defaultValue="work" className="h-7 w-[168px] text-[11px]">
                    <option value="work">{t('settings.windowWork')}</option>
                    <option value="morning">{t('settings.windowMorning')}</option>
                    <option value="any">{t('settings.windowAny')}</option>
                  </Select>
                </Row>
                <Row
                  label={t('settings.subjectCheckTitle')}
                  desc={t('settings.subjectCheckDesc')}
                >
                  <Switch
                    checked
                    onChange={() => toast(t('settings.protectionLocked'), 'warning')}
                  />
                </Row>
                <Row label={t('settings.truthCheckTitle')} desc={t('settings.truthCheckDesc')}>
                  <Switch
                    checked
                    onChange={() => toast(t('settings.protectionLocked'), 'warning')}
                  />
                </Row>
              </Block>

              <Block
                title={t('settings.defaultThresholdTitle')}
                desc={t('settings.defaultThresholdDesc')}
              >
                <div className="space-y-3 border-t border-line px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-[92px] shrink-0 text-[11px] text-fg-muted">
                      {t('candidates.auto')}
                    </span>
                    <input
                      type="range"
                      min={reject + 5}
                      max={99}
                      value={auto}
                      onChange={(e) => setAuto(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="tnum w-7 text-right text-[11.5px] text-accent">{auto}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-[92px] shrink-0 text-[11px] text-fg-muted">
                      {t('candidates.reject')}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={auto - 5}
                      value={reject}
                      onChange={(e) => setReject(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="tnum w-7 text-right text-[11.5px] text-warning">{reject}</span>
                  </div>
                  <div className="ml-[104px] flex h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="bg-soft-bar-hover" style={{ width: `${reject}%` }} />
                    <div className="bg-warning/70" style={{ width: `${auto - reject}%` }} />
                    <div className="bg-accent/80" style={{ width: `${100 - auto}%` }} />
                  </div>
                  <div className="ml-[104px] flex justify-between text-[9.5px] text-fg-subtle">
                    <span>{t('settings.distribLow')}</span>
                    <span>{t('settings.distribMid')}</span>
                    <span>{t('settings.distribHigh')}</span>
                  </div>
                </div>
              </Block>
            </div>
          ) : null}

          {section === 'mail' ? (
            <div className="space-y-2.5">
              <Card className="flex items-start gap-2 px-3.5 py-2.5">
                <ShieldCheck size={12} className="mt-0.5 shrink-0 text-fg-subtle" />
                <div className="text-[10.5px] leading-relaxed text-fg-subtle">
                  {t('settings.mailNote')}
                </div>
              </Card>

              {candidates.map((c) => (
                <Card key={c.id} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-fg">{c.name}</span>
                    {c.smtp ? (
                      <Badge tone={c.smtp.verified ? 'success' : 'warning'} dot>
                        {c.smtp.verified ? t('settings.smtpVerified') : t('settings.smtpUnverified')}
                      </Badge>
                    ) : (
                      <Badge tone="danger" dot>
                        {t('common.notConfigured')}
                      </Badge>
                    )}
                    <span className="ml-auto text-[10px] text-fg-subtle">
                      {t('settings.sentToday', { sent: c.stats.applied, cap: c.dailyCap })}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-[1.4fr_0.8fr_0.7fr] gap-2">
                    <Field label={t('settings.smtpServer')}>
                      <Input
                        defaultValue={c.smtp?.host ?? ''}
                        placeholder="smtp.example.com"
                        className="h-7 text-[11px]"
                      />
                    </Field>
                    <Field label={t('settings.port')}>
                      <Input
                        defaultValue={c.smtp ? String(c.smtp.port) : '465'}
                        className="h-7 text-[11px]"
                      />
                    </Field>
                    <Field label={t('settings.encryption')}>
                      <Select defaultValue="ssl" className="h-7 text-[11px]">
                        <option value="ssl">SSL</option>
                        <option value="starttls">STARTTLS</option>
                      </Select>
                    </Field>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Field label={t('settings.fromAddress')}>
                      <Input defaultValue={c.email} className="h-7 text-[11px]" />
                    </Field>
                    <Field label={t('settings.authCode')} hint={t('settings.authCodeHint')}>
                      <Input
                        type="password"
                        defaultValue={c.smtp ? '••••••••••••' : ''}
                        placeholder={t('common.notConfigured')}
                        className="h-7 text-[11px]"
                      />
                    </Field>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={!c.smtp}
                      onClick={() => toast(t('settings.toastTest', { email: c.email }), 'success')}
                    >
                      <Send size={11} />
                      {t('settings.sendTest')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast(t('settings.toastSaved'), 'success')}
                    >
                      {t('common.save')}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : null}

          {section === 'appearance' ? (
            <div className="space-y-2.5">
              <Block title={t('settings.appearanceTitle')} desc={t('settings.appearanceDesc')}>
                <ThemeChoices />
                <div className="flex items-start gap-2 border-t border-line px-4 py-2.5">
                  <Palette size={11} className="mt-0.5 shrink-0 text-fg-subtle" />
                  <div className="text-[10.5px] leading-relaxed text-fg-subtle">
                    <div className="text-fg-muted">
                      {t('settings.appearanceEffective', {
                        v: t(theme === 'light' ? 'theme.light' : 'theme.dark')
                      })}
                    </div>
                    <div className="mt-0.5">{t('settings.appearanceNote')}</div>
                  </div>
                </div>
              </Block>
            </div>
          ) : null}

          {section === 'data' ? (
            <div className="space-y-2.5">
              <Block title={t('settings.localDbTitle')} desc={t('settings.localDbDesc')}>
                <Row label={t('settings.filePath')} desc={dbPath}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast(t('settings.toastOpenDir'), 'default')}
                  >
                    {t('settings.openDir')}
                  </Button>
                </Row>
                <Row label={t('settings.sizeTitle')} desc={t('settings.sizeDesc')}>
                  <span className="tnum text-[11px] text-fg-muted">
                    {t('settings.dataCounts', { jobs: jobs.length, apps: applications.length })}
                  </span>
                </Row>
                <Row label={t('settings.resetSeed')} desc={t('settings.resetSeedDesc')}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      resetData()
                      toast(t('settings.toastReset'), 'success')
                    }}
                  >
                    {t('settings.resetSeed')}
                  </Button>
                </Row>
                <Row label={t('settings.retentionTitle')} desc={t('settings.retentionDesc')}>
                  <Select defaultValue="90" className="h-7 w-[120px] text-[11px]">
                    <option value="30">{t('settings.days30')}</option>
                    <option value="90">{t('settings.days90')}</option>
                    <option value="180">{t('settings.days180')}</option>
                    <option value="0">{t('settings.forever')}</option>
                  </Select>
                </Row>
              </Block>

              <Block title={t('settings.backupTitle')} desc={t('settings.backupDesc')}>
                <div className="flex gap-1.5 border-t border-line px-4 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast(t('settings.toastBackup'), 'success')}
                  >
                    {t('settings.backupNow')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast(t('settings.toastExportApps'), 'success')}
                  >
                    {t('settings.exportApps')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast(t('settings.toastExportJobs'), 'success')}
                  >
                    {t('settings.exportJobs')}
                  </Button>
                </div>
              </Block>

              <Card className="px-4 py-3">
                <div className="mb-1 flex items-center gap-1.5 text-[11.5px] font-medium">
                  <ShieldCheck size={12} className="text-fg-subtle" />
                  {t('settings.privacy')}
                </div>
                <ul className="space-y-1 text-[10.5px] leading-relaxed text-fg-subtle">
                  <li>· {t('settings.privacy1')}</li>
                  <li>· {t('settings.privacy2')}</li>
                  <li>· {t('settings.privacy3')}</li>
                </ul>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
