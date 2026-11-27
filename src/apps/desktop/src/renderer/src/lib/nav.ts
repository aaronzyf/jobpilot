import {
  Briefcase,
  CalendarClock,
  LayoutDashboard,
  MessagesSquare,
  Send,
  Settings,
  Users,
  type LucideIcon
} from 'lucide-react'
import type { TKey } from '@/i18n'

export type NavKey =
  | 'dashboard'
  | 'jobs'
  | 'applications'
  | 'messages'
  | 'interviews'
  | 'candidates'
  | 'settings'


export interface NavItem {
  key: NavKey
  /** i18n key 而非文案，渲染时才翻译 */
  labelKey: TKey
  icon: LucideIcon
  badge?: string
  shortcut: string
}

export const navItems: NavItem[] = [
  { key: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, shortcut: '1' },
  { key: 'jobs', labelKey: 'nav.jobs', icon: Briefcase, badge: '128', shortcut: '2' },
  { key: 'applications', labelKey: 'nav.applications', icon: Send, badge: '3', shortcut: '3' },
  {
    key: 'messages',
    labelKey: 'nav.messages',
    icon: MessagesSquare,
    shortcut: '4'
  },
  { key: 'interviews', labelKey: 'nav.interviews', icon: CalendarClock, shortcut: '5' },
  { key: 'candidates', labelKey: 'nav.candidates', icon: Users, shortcut: '6' },
  { key: 'settings', labelKey: 'nav.settings', icon: Settings, shortcut: '7' }
]

export const pageInfo: Record<NavKey, { titleKey: TKey; hintKey: TKey }> = {
  dashboard: { titleKey: 'page.dashboardTitle', hintKey: 'page.dashboardHint' },
  jobs: { titleKey: 'page.jobsTitle', hintKey: 'page.jobsHint' },
  applications: { titleKey: 'page.applicationsTitle', hintKey: 'page.applicationsHint' },
  messages: { titleKey: 'page.messagesTitle', hintKey: 'page.messagesHint' },
  interviews: { titleKey: 'page.interviewsTitle', hintKey: 'page.interviewsHint' },
  candidates: { titleKey: 'page.candidatesTitle', hintKey: 'page.candidatesHint' },
  settings: { titleKey: 'page.settingsTitle', hintKey: 'page.settingsHint' }
}
