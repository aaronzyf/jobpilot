import type { Verdict } from '@core'
import { schema, type DatabaseHandle } from './index'

/**
 * 开发期种子数据。
 *
 * 来源是原来渲染层的 mock.ts：界面先照着它做的，现在原样搬进库里，
 * 免得「改了数据库就看不到内容」。时间字段在写入时按「相对此刻」生成，
 * 所以第一次启动时列表、日程、倒计时都是活的。
 *
 * 只在空库时执行一次（看 candidates 是否为空）。
 */

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

type Maker = (base: number) => {
  minutesAgo: (m: number) => Date
  hoursAgo: (h: number) => Date
  daysAgo: (d: number) => Date
  atDay: (offset: number, hh: number, mm?: number) => Date
  soon: (min: number) => Date
}

const make: Maker = (base) => {
  const atDay = (offset: number, hh: number, mm = 0) => {
    const d = new Date(base)
    d.setDate(d.getDate() + offset)
    d.setHours(hh, mm, 0, 0)
    return d
  }
  return {
    minutesAgo: (m) => new Date(base - m * MIN),
    hoursAgo: (h) => new Date(base - h * HOUR),
    daysAgo: (d) => new Date(base - d * DAY),
    atDay,
    soon: (min) => new Date(base + min * MIN)
  }
}

/** 三档判定与 mock 里的 verdictFor 一致：分数对上该求职者的阈值 */
function verdictOf(score: number, auto: number, reject: number): Verdict {
  if (score >= auto) return 'auto'
  if (score >= reject) return 'confirm'
  return 'reject'
}

export function seedIfEmpty(handle: DatabaseHandle): boolean {
  const { sqlite, db } = handle
  const count = sqlite.prepare('select count(*) as n from candidates').get() as { n: number }
  if (count.n > 0) return false

  const base = Date.now()
  const t = make(base)

  type CandidateSeed = Omit<typeof schema.candidates.$inferInsert, 'createdAt' | 'updatedAt'>

  const candidateSeeds: CandidateSeed[] = [
    {
      id: 'c1',
      name: 'Aaron',
      headline: '前端工程师 · React / Electron',
      years: 6,
      location: '深圳',
      hue: 228,
      email: 'aaron.zyf@gmail.com',
      languages: ['中文', 'English'],
      note: '只考虑远程或深圳；不看外包与驻场；薪资不低于 40K。海外岗位需要签证赞助。',
      thresholdAuto: 85,
      thresholdReject: 40,
      dailyCap: 12,
      enabled: true,
      resumeFile: 'aaron-frontend-2026.pdf',
      resumeUpdatedAt: t.daysAgo(3),
      resumePages: 2,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 465,
      smtpVerified: true,
      pop3Host: 'pop.gmail.com',
      pop3Port: 995,
      pop3Enabled: true,
      factProjects: 7,
      factExperiences: 3,
      factSkills: 24
    },
    {
      id: 'c2',
      name: '林珊',
      headline: '产品设计师 · B 端 SaaS',
      years: 4,
      location: '上海',
      hue: 292,
      email: 'linshan.design@outlook.com',
      languages: ['中文', 'English'],
      note: '优先海外远程岗位，需要签证赞助；接受合同制；不投 996 团队。求职信用英文。',
      thresholdAuto: 88,
      thresholdReject: 45,
      dailyCap: 8,
      enabled: true,
      resumeFile: 'linshan-product-designer.pdf',
      resumeUpdatedAt: t.daysAgo(7),
      resumePages: 3,
      smtpHost: null,
      smtpPort: null,
      smtpVerified: false,
      pop3Host: null,
      pop3Port: null,
      pop3Enabled: false,
      factProjects: 5,
      factExperiences: 2,
      factSkills: 18
    },
    {
      id: 'c3',
      name: '陈默',
      headline: '全栈工程师 · Node / Go',
      years: 8,
      location: '杭州',
      hue: 168,
      email: 'chenmo.dev@163.com',
      languages: ['中文'],
      note: '期望带团队的技术岗或平台架构方向；可接受杭州、上海两地坐班。',
      thresholdAuto: 82,
      thresholdReject: 38,
      dailyCap: 15,
      enabled: true,
      resumeFile: 'chenmo-fullstack.pdf',
      resumeUpdatedAt: t.hoursAgo(2),
      resumePages: 2,
      smtpHost: 'smtp.163.com',
      smtpPort: 465,
      smtpVerified: false,
      pop3Host: 'pop.163.com',
      pop3Port: 995,
      pop3Enabled: false,
      factProjects: 9,
      factExperiences: 4,
      factSkills: 31
    }
  ]

  const candidateRows = candidateSeeds.map((row) => ({
    ...row,
    createdAt: t.daysAgo(30),
    updatedAt: t.daysAgo(1)
  }))

  const sourceRows = [
    {
      id: 'boss',
      name: 'BOSS直聘',
      region: 'cn' as const,
      intervalMin: 30,
      lastRunAt: t.minutesAgo(12),
      nextRunAt: new Date(base + 18 * MIN),
      foundCount: 46,
      state: 'ok' as const,
      auth: 'cookie' as const,
      account: '138****6721',
      capabilities: ['列表', '详情', '站内消息'],
      sort: 0
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      region: 'global' as const,
      intervalMin: 120,
      lastRunAt: t.minutesAgo(38),
      nextRunAt: new Date(base + 82 * MIN),
      foundCount: 22,
      state: 'running' as const,
      auth: 'cookie' as const,
      account: 'aaron.zyf@gmail.com',
      capabilities: ['列表', '详情', '外部链接'],
      sort: 1
    },
    {
      id: 'greenhouse',
      name: 'Greenhouse',
      region: 'global' as const,
      intervalMin: 360,
      lastRunAt: t.hoursAgo(1),
      nextRunAt: new Date(base + 5 * HOUR),
      foundCount: 31,
      state: 'ok' as const,
      auth: 'none' as const,
      account: '公开列表页',
      capabilities: ['列表', '详情', '表单投递'],
      sort: 2
    },
    {
      id: 'ashby',
      name: 'Ashby',
      region: 'global' as const,
      intervalMin: 360,
      lastRunAt: t.hoursAgo(2),
      nextRunAt: new Date(base + 4 * HOUR),
      foundCount: 18,
      state: 'ok' as const,
      auth: 'none' as const,
      account: '公开列表页',
      capabilities: ['列表', '详情', '表单投递'],
      sort: 3
    },
    {
      id: 'liepin',
      name: '猎聘',
      region: 'cn' as const,
      intervalMin: 60,
      lastRunAt: t.minutesAgo(24),
      nextRunAt: new Date(base + 36 * MIN),
      foundCount: 14,
      state: 'ok' as const,
      auth: 'password' as const,
      account: '186****3308',
      capabilities: ['列表', '详情', '邮件线索'],
      sort: 4
    },
    {
      id: 'zhilian',
      name: '智联招聘',
      region: 'cn' as const,
      intervalMin: 60,
      lastRunAt: t.hoursAgo(3),
      nextRunAt: null,
      foundCount: 0,
      state: 'error' as const,
      auth: 'password' as const,
      account: '186****3308',
      capabilities: ['列表', '详情'],
      sort: 5
    }
  ]

  // ------------------------------------------------------------ 岗位
  // postedHours 换算成真实时间；discoveredAt 取略晚于发布时间的时刻
  type JobSeed = Omit<typeof schema.jobs.$inferInsert, 'createdAt' | 'status'>

  const jobSeeds: JobSeed[] = [
    {
      id: 'j1',
      sourceId: 'greenhouse',
      externalId: 'gh-anthropic-88213',
      company: 'Anthropic',
      companyHue: 24,
      title: 'Senior Frontend Engineer, Console',
      city: '远程',
      country: '美国',
      workMode: 'remote',
      employmentType: 'fulltime',
      salaryText: '$180k – $240k',
      salaryMin: 180000,
      salaryMax: 240000,
      salaryCurrency: 'USD',
      region: 'global',
      submitChannel: 'ats-form',
      postedAt: new Date(base - 2 * HOUR),
      discoveredAt: new Date(base - 2 * HOUR + 6 * MIN),
      tags: ['React', 'TypeScript', '设计系统', '远程', '签证赞助'],
      jdSummary:
        '负责 Console 产品的前端架构与交互实现，Console 是客户管理模型、用量与账单的核心界面。团队规模小、迭代快，要求能独立负责一个产品面的端到端实现。',
      responsibilities: [
        '设计并实现 Console 的核心交互，从原型到上线全流程负责',
        '与设计、后端紧密协作，定义前后端接口契约',
        '沉淀可复用的组件与设计系统，提升团队交付速度',
        '参与前端基础设施建设：构建、测试、可观测性'
      ],
      requirements: [
        '5 年以上前端开发经验，React + TypeScript 熟练',
        '有复杂 B 端产品或开发者工具的落地经验',
        '对交互细节、可访问性与性能有较高标准',
        '英语可作为工作语言'
      ],
      contactEmail: null,
      subjectRuleRaw: null,
      subjectRuleTemplate: null,
      subjectRuleExample: null,
      companySize: '1000+',
      companyStage: '已上市',
      companyIndustry: 'AI / 大模型',
      companyVisa: true,
      applicants: 340
    },
    {
      id: 'j2',
      sourceId: 'boss',
      externalId: 'boss-feishu-3391',
      company: '字节跳动',
      companyHue: 210,
      title: '资深前端开发工程师 · 飞书',
      city: '深圳',
      country: '中国',
      workMode: 'onsite',
      employmentType: 'fulltime',
      salaryText: '35 – 60K · 15 薪',
      salaryMin: 35,
      salaryMax: 60,
      salaryCurrency: 'CNY',
      region: 'cn',
      submitChannel: 'email',
      postedAt: new Date(base - 4 * HOUR),
      discoveredAt: new Date(base - 4 * HOUR + 11 * MIN),
      tags: ['React', '协同编辑', '性能优化', '深圳'],
      jdSummary:
        '飞书文档与多维表格前端团队，负责协同编辑器的性能与稳定性。岗位要求在超大规模文档场景下做渲染优化，简历请发送至 HR 邮箱，主题需按约定格式。',
      responsibilities: [
        '负责协同编辑器核心模块的架构与实现',
        '优化大文档场景下的渲染性能与内存占用',
        '建设前端质量体系：单测、E2E、性能基线'
      ],
      requirements: [
        '5 年以上前端经验，精通 React 与浏览器渲染原理',
        '有编辑器、富文本或 Canvas 相关经验优先',
        '有大型项目性能优化实战案例'
      ],
      contactEmail: 'fe-hr@bytedance.com',
      subjectRuleRaw: '邮件主题请按「姓名+应聘岗位+工作年限」格式填写',
      subjectRuleTemplate: '{姓名}+{岗位}+{年限}',
      subjectRuleExample: '张三+资深前端开发工程师+6年',
      companySize: '1000+',
      companyStage: '已上市',
      companyIndustry: '企业服务',
      companyVisa: false,
      applicants: 512
    },
    {
      id: 'j3',
      sourceId: 'ashby',
      externalId: 'ashby-linear-pe',
      company: 'Linear',
      companyHue: 262,
      title: 'Product Engineer',
      city: '远程',
      country: '欧盟',
      workMode: 'remote',
      employmentType: 'fulltime',
      salaryText: '€90k – €130k',
      salaryMin: 90000,
      salaryMax: 130000,
      salaryCurrency: 'EUR',
      region: 'global',
      submitChannel: 'ats-form',
      postedAt: new Date(base - 6 * HOUR),
      discoveredAt: new Date(base - 6 * HOUR + 8 * MIN),
      tags: ['TypeScript', '产品感', '远程', '小团队'],
      jdSummary:
        'Linear 的产品工程师同时负责设计与实现，一个人推动一个功能从想法到上线。看重对细节的偏执和对产品方向的判断力。',
      responsibilities: [
        '独立负责功能模块的产品设计和技术实现',
        '参与产品方向讨论，提出并验证想法',
        '维护高标准的前端质量与交互一致性'
      ],
      requirements: [
        '4 年以上产品级前端开发经验',
        '有从 0 到 1 交付产品的完整经历',
        '英语流利，能参与异步产品讨论'
      ],
      contactEmail: null,
      subjectRuleRaw: null,
      subjectRuleTemplate: null,
      subjectRuleExample: null,
      companySize: '50-200',
      companyStage: 'B 轮',
      companyIndustry: '生产力工具',
      companyVisa: false,
      applicants: 210
    },
    {
      id: 'j4',
      sourceId: 'boss',
      externalId: 'boss-xhs-7712',
      company: '小红书',
      companyHue: 350,
      title: '前端工程师 · 商业化',
      city: '上海',
      country: '中国',
      workMode: 'onsite',
      employmentType: 'fulltime',
      salaryText: '30 – 50K · 14 薪',
      salaryMin: 30,
      salaryMax: 50,
      salaryCurrency: 'CNY',
      region: 'cn',
      submitChannel: 'platform-message',
      postedAt: new Date(base - 8 * HOUR),
      discoveredAt: new Date(base - 8 * HOUR + 5 * MIN),
      tags: ['React', '数据可视化', '广告平台'],
      jdSummary:
        '商业化前端团队，负责广告投放平台与数据看板。业务节奏快，需求量大，重视工程效率与可视化能力。',
      responsibilities: [
        '负责广告投放平台的前端开发与迭代',
        '建设数据看板与图表体系',
        '沉淀业务组件库，提升交付效率'
      ],
      requirements: ['3 年以上前端经验', '熟悉 React 生态与可视化库', '能承受较快业务节奏'],
      contactEmail: null,
      subjectRuleRaw: null,
      subjectRuleTemplate: null,
      subjectRuleExample: null,
      companySize: '1000+',
      companyStage: '已上市',
      companyIndustry: '内容社区',
      companyVisa: false,
      applicants: 188
    },
    {
      id: 'j5',
      sourceId: 'greenhouse',
      externalId: 'gh-vercel-de',
      company: 'Vercel',
      companyHue: 200,
      title: 'Design Engineer',
      city: '远程',
      country: '全球',
      workMode: 'remote',
      employmentType: 'fulltime',
      salaryText: '$150k – $200k',
      salaryMin: 150000,
      salaryMax: 200000,
      salaryCurrency: 'USD',
      region: 'global',
      submitChannel: 'ats-form',
      postedAt: new Date(base - 11 * HOUR),
      discoveredAt: new Date(base - 11 * HOUR + 9 * MIN),
      tags: ['Next.js', 'CSS', '动效', '远程'],
      jdSummary:
        '负责 Vercel 官网、Dashboard 与设计系统的交互动效实现。岗位介于设计与工程之间，需要能读写设计稿并直接落地。',
      responsibilities: [
        '实现官网与 Dashboard 的高质量交互',
        '维护设计系统与组件文档',
        '与设计团队共同定义动效规范'
      ],
      requirements: ['前端工程能力强，精通 CSS 与动效', '有设计系统建设经验', '英语流利'],
      contactEmail: null,
      subjectRuleRaw: null,
      subjectRuleTemplate: null,
      subjectRuleExample: null,
      companySize: '200-1000',
      companyStage: 'D 轮',
      companyIndustry: '开发者工具',
      companyVisa: true,
      applicants: 460
    },
    {
      id: 'j6',
      sourceId: 'linkedin',
      externalId: 'li-bank-fe-contract',
      company: '某外资银行',
      companyHue: 190,
      title: 'Frontend Developer (Contract)',
      city: '广州',
      country: '中国',
      workMode: 'hybrid',
      employmentType: 'contract',
      salaryText: '面议',
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      region: 'global',
      submitChannel: 'email',
      postedAt: new Date(base - 26 * HOUR),
      discoveredAt: new Date(base - 26 * HOUR + 14 * MIN),
      tags: ['Angular', '金融', '合同制', '英语'],
      jdSummary:
        '外资银行内部系统前端开发，合同制 12 个月，可续签。技术栈以 Angular 为主，需英文沟通。简历投递请使用英文主题。',
      responsibilities: ['维护内部交易系统前端', '与伦敦团队对接需求', '编写单元测试与文档'],
      requirements: ['3 年以上 Angular 经验', '英文书面与口语流利', '金融行业背景优先'],
      contactEmail: 'apacta.recruit@example-bank.com',
      subjectRuleRaw: 'Please use the subject line: Application - [Job Title] - [Your Name]',
      subjectRuleTemplate: 'Application - {Job Title} - {Your Name}',
      subjectRuleExample: 'Application - Frontend Developer (Contract) - San Zhang',
      companySize: '1000+',
      companyStage: '已上市',
      companyIndustry: '金融',
      companyVisa: false,
      applicants: 74
    },
    {
      id: 'j7',
      sourceId: 'liepin',
      externalId: 'lp-mihoyo-growth',
      company: '米哈游',
      companyHue: 320,
      title: 'Web 前端工程师 · 增长',
      city: '上海',
      country: '中国',
      workMode: 'onsite',
      employmentType: 'fulltime',
      salaryText: '28 – 45K · 16 薪',
      salaryMin: 28,
      salaryMax: 45,
      salaryCurrency: 'CNY',
      region: 'cn',
      submitChannel: 'email',
      postedAt: new Date(base - 30 * HOUR),
      discoveredAt: new Date(base - 30 * HOUR + 7 * MIN),
      tags: ['Vue', 'Node', '活动页', '高并发'],
      jdSummary:
        '增长团队前端，负责官网、活动页与投放落地页，要求能扛住大促级别流量。技术栈 Vue 为主，同时有 Node BFF 开发。',
      responsibilities: ['开发高并发的活动落地页', '维护官网与多语言站点', '参与 BFF 层接口设计'],
      requirements: ['3 年以上前端经验', '熟悉 Vue 或 React 其一', '有高流量页面优化经验'],
      contactEmail: 'hr-web@mihoyo.com',
      subjectRuleRaw: '邮件标题格式：【社招】岗位名称-姓名-工作年限',
      subjectRuleTemplate: '【社招】{岗位名称}-{姓名}-{工作年限}',
      subjectRuleExample: '【社招】Web 前端工程师-张三-6年',
      companySize: '1000+',
      companyStage: '已上市',
      companyIndustry: '游戏',
      companyVisa: false,
      applicants: 236
    },
    {
      id: 'j8',
      sourceId: 'linkedin',
      externalId: 'li-shopify-checkout',
      company: 'Shopify',
      companyHue: 140,
      title: 'Senior Frontend Developer, Checkout',
      city: '远程',
      country: '加拿大',
      workMode: 'remote',
      employmentType: 'fulltime',
      salaryText: 'CA$140k – CA$180k',
      salaryMin: 140000,
      salaryMax: 180000,
      salaryCurrency: 'CAD',
      region: 'global',
      submitChannel: 'ats-form',
      postedAt: new Date(base - 48 * HOUR),
      discoveredAt: new Date(base - 48 * HOUR + 20 * MIN),
      tags: ['React', '支付', '远程', '时区'],
      jdSummary:
        '结账流程前端团队，负责全球商家的支付体验。要求对可靠性和可访问性有极高标准，需与美东时区重叠。',
      responsibilities: ['维护结账流程核心模块', '优化多地区支付适配', '建设可访问性标准'],
      requirements: ['5 年以上前端经验', '有支付或交易系统经验', '需美东时区重叠 4 小时以上'],
      contactEmail: null,
      subjectRuleRaw: null,
      subjectRuleTemplate: null,
      subjectRuleExample: null,
      companySize: '1000+',
      companyStage: '已上市',
      companyIndustry: '电商',
      companyVisa: false,
      applicants: 390
    },
    {
      id: 'j9',
      sourceId: 'boss',
      externalId: 'boss-ant-exp',
      company: '蚂蚁集团',
      companyHue: 205,
      title: '前端技术专家 · 体验技术部',
      city: '杭州',
      country: '中国',
      workMode: 'onsite',
      employmentType: 'fulltime',
      salaryText: '45 – 70K · 16 薪',
      salaryMin: 45,
      salaryMax: 70,
      salaryCurrency: 'CNY',
      region: 'cn',
      submitChannel: 'platform-message',
      postedAt: new Date(base - 50 * HOUR),
      discoveredAt: new Date(base - 50 * HOUR + 16 * MIN),
      tags: ['架构', '低代码', 'Node', '杭州'],
      jdSummary:
        '体验技术部负责低代码引擎与前端基础设施，岗位偏架构方向，需要有技术方案设计与跨团队推动能力。',
      responsibilities: ['设计低代码引擎的核心架构', '推动前端基础设施在业务团队落地', '培养团队技术梯队'],
      requirements: ['7 年以上前端经验', '有基础设施或框架级项目经验', '有技术团队管理经验'],
      contactEmail: null,
      subjectRuleRaw: null,
      subjectRuleTemplate: null,
      subjectRuleExample: null,
      companySize: '1000+',
      companyStage: '已上市',
      companyIndustry: '金融科技',
      companyVisa: false,
      applicants: 268
    },
    {
      id: 'j10',
      sourceId: 'greenhouse',
      externalId: 'gh-figma-ds',
      company: 'Figma',
      companyHue: 10,
      title: 'Software Engineer, Design Systems',
      city: '远程',
      country: '美国',
      workMode: 'remote',
      employmentType: 'fulltime',
      salaryText: '$170k – $220k',
      salaryMin: 170000,
      salaryMax: 220000,
      salaryCurrency: 'USD',
      region: 'global',
      submitChannel: 'ats-form',
      postedAt: new Date(base - 72 * HOUR),
      discoveredAt: new Date(base - 72 * HOUR + 25 * MIN),
      tags: ['设计系统', 'Canvas', 'WebGL', '签证赞助'],
      jdSummary:
        '设计系统团队，负责 Figma 编辑器的组件模型与协作能力。要求有图形或编辑器底层经验。',
      responsibilities: ['实现组件与样式系统的核心能力', '优化 Canvas 渲染性能', '推动设计-开发协作流程'],
      requirements: ['5 年以上工程经验', '有图形渲染或编辑器经验', '英语流利'],
      contactEmail: null,
      subjectRuleRaw: null,
      subjectRuleTemplate: null,
      subjectRuleExample: null,
      companySize: '1000+',
      companyStage: '已上市',
      companyIndustry: '设计工具',
      companyVisa: true,
      applicants: 520
    },
    {
      id: 'j11',
      sourceId: 'ashby',
      externalId: 'ashby-zapier-pe',
      company: 'Zapier',
      companyHue: 32,
      title: 'Product Engineer, Automation',
      city: '远程',
      country: '全球',
      workMode: 'remote',
      employmentType: 'fulltime',
      salaryText: '$130k – $165k',
      salaryMin: 130000,
      salaryMax: 165000,
      salaryCurrency: 'USD',
      region: 'global',
      submitChannel: 'ats-form',
      postedAt: new Date(base - 76 * HOUR),
      discoveredAt: new Date(base - 76 * HOUR + 33 * MIN),
      tags: ['TypeScript', '远程优先', '异步协作', '签证赞助'],
      jdSummary:
        '自动化产品线，负责工作流编辑器与集成体验。全远程团队，强调书面沟通与异步协作。',
      responsibilities: ['开发工作流编辑器的交互能力', '与集成团队共建触发器模型', '参与产品方向决策'],
      requirements: ['4 年以上产品级前端经验', '英文书面表达强', '适应全远程异步协作'],
      contactEmail: null,
      subjectRuleRaw: null,
      subjectRuleTemplate: null,
      subjectRuleExample: null,
      companySize: '200-1000',
      companyStage: 'C 轮',
      companyIndustry: 'SaaS',
      companyVisa: true,
      applicants: 300
    },
    {
      id: 'j12',
      sourceId: 'zhilian',
      externalId: 'zl-outsource-vue',
      company: '某外包服务商',
      companyHue: 0,
      title: 'Vue 开发（驻场银行项目）',
      city: '杭州',
      country: '中国',
      workMode: 'onsite',
      employmentType: 'fulltime',
      salaryText: '18 – 25K',
      salaryMin: 18,
      salaryMax: 25,
      salaryCurrency: 'CNY',
      region: 'cn',
      submitChannel: 'platform-message',
      postedAt: new Date(base - 28 * HOUR),
      discoveredAt: new Date(base - 28 * HOUR + 12 * MIN),
      tags: ['Vue', '驻场', '外包'],
      jdSummary: '外包驻场岗位，银行内部系统维护，技术栈 Vue 2，工作内容以需求修改为主。',
      responsibilities: ['维护银行内部管理系统', '按需求单修改页面'],
      requirements: ['2 年以上 Vue 经验', '可接受驻场'],
      contactEmail: null,
      subjectRuleRaw: null,
      subjectRuleTemplate: null,
      subjectRuleExample: null,
      companySize: '200-1000',
      companyStage: '未知',
      companyIndustry: 'IT 外包',
      companyVisa: false,
      applicants: 96
    },
    {
      id: 'j13',
      sourceId: 'zhilian',
      externalId: 'zl-manufacture-web',
      company: '某传统制造企业',
      companyHue: 40,
      title: '网站维护工程师',
      city: '东莞',
      country: '中国',
      workMode: 'onsite',
      employmentType: 'fulltime',
      salaryText: '8 – 12K',
      salaryMin: 8,
      salaryMax: 12,
      salaryCurrency: 'CNY',
      region: 'cn',
      submitChannel: 'manual',
      postedAt: new Date(base - 46 * HOUR),
      discoveredAt: new Date(base - 46 * HOUR + 18 * MIN),
      tags: ['PHP', '维护', '传统行业'],
      jdSummary: '负责公司官网与内部 OA 的日常维护，技术要求较低，以维护为主。',
      responsibilities: ['维护官网与 OA 系统', '处理日常故障'],
      requirements: ['熟悉 PHP 与常见 CMS'],
      contactEmail: null,
      subjectRuleRaw: null,
      subjectRuleTemplate: null,
      subjectRuleExample: null,
      companySize: '200-1000',
      companyStage: '未知',
      companyIndustry: '制造业',
      companyVisa: false,
      applicants: 41
    },
    {
      id: 'j14',
      sourceId: 'greenhouse',
      externalId: 'gh-notion-editor',
      company: 'Notion',
      companyHue: 250,
      title: 'Frontend Engineer, Editor',
      city: '远程',
      country: '美国',
      workMode: 'hybrid',
      employmentType: 'fulltime',
      salaryText: '$160k – $210k',
      salaryMin: 160000,
      salaryMax: 210000,
      salaryCurrency: 'USD',
      region: 'global',
      submitChannel: 'ats-form',
      postedAt: new Date(base - 5 * HOUR),
      discoveredAt: new Date(base - 5 * HOUR + 4 * MIN),
      tags: ['React', '编辑器', '纽约混合', '签证赞助'],
      jdSummary:
        '编辑器前端团队，负责块编辑器与实时协作能力。团队在纽约，混合办公，需每周到岗 3 天。',
      responsibilities: ['实现块编辑器核心交互', '优化协作冲突处理', '建设编辑器测试体系'],
      requirements: ['5 年以上前端经验', '有编辑器或富文本经验', '能在纽约混合办公'],
      contactEmail: null,
      subjectRuleRaw: null,
      subjectRuleTemplate: null,
      subjectRuleExample: null,
      companySize: '200-1000',
      companyStage: 'C 轮',
      companyIndustry: '生产力工具',
      companyVisa: true,
      applicants: 610
    }
  ]

  const jobRows: (typeof schema.jobs.$inferInsert)[] = jobSeeds.map((row) => ({
    ...row,
    createdAt: row.discoveredAt,
    status: 'open'
  }))

  const scoreMatrix: Record<string, Record<string, number>> = {
    j1: { c1: 92, c2: 41, c3: 66 },
    j2: { c1: 88, c2: 36, c3: 71 },
    j3: { c1: 81, c2: 58, c3: 54 },
    j4: { c1: 74, c2: 44, c3: 69 },
    j5: { c1: 71, c2: 66, c3: 47 },
    j6: { c1: 64, c2: 39, c3: 72 },
    j7: { c1: 79, c2: 33, c3: 58 },
    j8: { c1: 68, c2: 52, c3: 61 },
    j9: { c1: 77, c2: 30, c3: 84 },
    j10: { c1: 59, c2: 81, c3: 42 },
    j11: { c1: 63, c2: 47, c3: 70 },
    j12: { c1: 24, c2: 18, c3: 31 },
    j13: { c1: 18, c2: 12, c3: 22 },
    j14: { c1: 86, c2: 44, c3: 62 }
  }

  // 只有 Aaron 有完整的判定理由：这些理由本来就是「以他的简历为基准」写的
  const reasonMatrix: Record<
    string,
    { reasons: { label: string; weight: number; detail: string }[]; gaps: string[] }
  > = {
    j1: {
      reasons: [
        { label: '技术栈重合度', weight: 0.96, detail: 'React / TypeScript / 构建工具链完全对口' },
        { label: '复杂 B 端经验', weight: 0.9, detail: '6 年企业级后台与桌面端经验' },
        { label: '远程协作能力', weight: 0.84, detail: '有 3 年跨时区远程协作记录' },
        { label: '英语沟通', weight: 0.78, detail: '可作为工作语言，但无海外团队长期协作' }
      ],
      gaps: ['无大模型产品前端经验', '缺少公开的技术影响力材料']
    },
    j2: {
      reasons: [
        { label: '技术栈重合度', weight: 0.94, detail: 'React 深度使用，熟悉渲染性能调优' },
        { label: '编辑器相关经验', weight: 0.86, detail: '做过基于 ProseMirror 的富文本模块' },
        { label: '地点匹配', weight: 1, detail: '期望城市包含深圳' },
        { label: '团队规模经验', weight: 0.72, detail: '管理经验较弱，岗位偏个人贡献者' }
      ],
      gaps: ['无超大规模文档的性能数据']
    },
    j3: {
      reasons: [
        { label: '产品工程能力', weight: 0.88, detail: '有独立负责桌面端产品的完整经历' },
        { label: '技术栈重合度', weight: 0.9, detail: 'TypeScript + React 深度匹配' },
        { label: '交互与细节标准', weight: 0.8, detail: '作品集体现较强交互敏感度' },
        { label: '时区重叠', weight: 0.66, detail: '与欧洲团队重叠约 4 小时' }
      ],
      gaps: ['缺少面向海外用户的产品经验', '岗位不提供签证赞助']
    },
    j4: {
      reasons: [
        { label: '技术栈重合度', weight: 0.86, detail: 'React + 可视化经验匹配' },
        { label: '业务领域', weight: 0.62, detail: '无广告或商业化系统经验' },
        { label: '地点匹配', weight: 0.4, detail: '期望深圳或远程，上海不在首选' }
      ],
      gaps: ['地点不符', '无广告投放业务背景']
    },
    j5: {
      reasons: [
        { label: '设计系统经验', weight: 0.82, detail: '主导过内部组件库建设' },
        { label: '动效实现', weight: 0.6, detail: '动效作品较少' },
        { label: '技术栈重合度', weight: 0.88, detail: 'React / Next.js 熟练' }
      ],
      gaps: ['动效与视觉作品集偏弱', '岗位竞争激烈，需作品集支撑']
    },
    j6: {
      reasons: [
        { label: '技术栈重合度', weight: 0.42, detail: '主技术栈为 React，Angular 仅有少量经验' },
        { label: '英语沟通', weight: 0.8, detail: '可英文会议沟通' },
        { label: '合同制接受度', weight: 0.3, detail: '更倾向正式雇员岗位' }
      ],
      gaps: ['Angular 经验不足', '合同制与期望不符']
    },
    j7: {
      reasons: [
        { label: '技术栈重合度', weight: 0.78, detail: 'React 熟练，Vue 可快速上手' },
        { label: '性能优化', weight: 0.85, detail: '有首屏优化与 CDN 治理经验' },
        { label: '地点匹配', weight: 0.38, detail: '上海非首选城市' }
      ],
      gaps: ['无游戏行业经验', '地点不符']
    },
    j8: {
      reasons: [
        { label: '技术栈重合度', weight: 0.84, detail: 'React 深度使用' },
        { label: '支付领域', weight: 0.35, detail: '无支付系统经验' },
        { label: '时区重叠', weight: 0.28, detail: '与美东重叠仅 1 小时' }
      ],
      gaps: ['时区不满足', '无支付领域经验']
    },
    j9: {
      reasons: [
        { label: '架构能力', weight: 0.85, detail: '主导过构建工具链与组件库' },
        { label: '经验年限', weight: 0.7, detail: '6 年，略低于岗位要求的 7 年' },
        { label: '地点匹配', weight: 0.35, detail: '杭州非期望城市' }
      ],
      gaps: ['年限略低', '地点不符']
    },
    j10: {
      reasons: [
        { label: '设计系统经验', weight: 0.72, detail: '有组件库建设经验但无设计工具背景' },
        { label: '图形渲染', weight: 0.2, detail: '缺 Canvas / WebGL 实战' }
      ],
      gaps: ['缺图形渲染经验', '岗位要求较高']
    },
    j11: {
      reasons: [
        { label: '技术栈重合度', weight: 0.86, detail: 'TypeScript + React 匹配' },
        { label: '异步协作', weight: 0.75, detail: '有远程团队协作经验' },
        { label: '业务领域', weight: 0.5, detail: '无 SaaS 集成平台经验' }
      ],
      gaps: ['行业经验空白']
    },
    j12: {
      reasons: [{ label: '岗位偏好', weight: 0.1, detail: '外包驻场，已被候选人明确排除' }],
      gaps: ['外包驻场', '薪资低于期望下限', '技术栈老旧']
    },
    j13: {
      reasons: [{ label: '岗位层级', weight: 0.08, detail: '岗位层级与技术方向均不匹配' }],
      gaps: ['技术方向不符', '薪资差距过大']
    },
    j14: {
      reasons: [
        { label: '编辑器经验', weight: 0.9, detail: 'ProseMirror 富文本模块经验' },
        { label: '技术栈重合度', weight: 0.94, detail: 'React + TypeScript 高度匹配' },
        { label: '办公方式', weight: 0.15, detail: '要求纽约每周到岗 3 天，无法满足' }
      ],
      gaps: ['需在纽约混合办公，不满足', '无实时协作底层经验']
    }
  }

  const thresholds: Record<string, { auto: number; reject: number }> = {
    c1: { auto: 85, reject: 40 },
    c2: { auto: 88, reject: 45 },
    c3: { auto: 82, reject: 38 }
  }

  const scoreRows: (typeof schema.jobScores.$inferInsert)[] = []
  for (const job of jobRows) {
    for (const cand of candidateRows) {
      const score = scoreMatrix[job.id][cand.id]
      const { auto, reject } = thresholds[cand.id]
      const detail = cand.id === 'c1' ? reasonMatrix[job.id] : undefined
      scoreRows.push({
        jobId: job.id,
        candidateId: cand.id,
        score,
        verdict: verdictOf(score, auto, reject),
        reasons: detail?.reasons ?? [],
        gaps: detail?.gaps ?? [],
        // 真实实现由匹配模型写入；种子数据里标成同一次离线打分
        model: detail ? 'deepseek-chat' : '',
        scoredAt: new Date(job.discoveredAt.getTime() + 60_000)
      })
    }
  }

  type ApplicationSeed = Omit<typeof schema.applications.$inferInsert, 'createdAt' | 'updatedAt'>

  const applicationSeeds: ApplicationSeed[] = [
    {
      id: 'a1',
      jobId: 'j1',
      candidateId: 'c1',
      channel: 'ats-form',
      status: 'sent',
      submittedAt: t.atDay(0, 9, 42),
      score: 92,
      resumeSnapshot: 'aaron-frontend-2026.pdf · 版本 7',
      toEmail: null,
      subject: null,
      body: null,
      subjectRuleOk: null,
      error: null
    },
    {
      id: 'a2',
      jobId: 'j2',
      candidateId: 'c1',
      channel: 'email',
      status: 'sent',
      submittedAt: t.atDay(0, 9, 15),
      score: 88,
      resumeSnapshot: 'aaron-frontend-2026.pdf · 版本 7',
      toEmail: 'fe-hr@bytedance.com',
      subject: 'Aaron+资深前端开发工程师+6年',
      body:
        '您好，\n\n我在 BOSS 直聘上看到贵司「资深前端开发工程师 · 飞书」的岗位，希望应聘。\n\n我目前有 6 年前端开发经验，长期负责企业级产品的前端架构，主导过基于 ProseMirror 的富文本编辑器模块，对超长文档的渲染性能做过系统性优化（首屏渲染从 1.8s 降到 640ms）。这些经历与岗位要求的协同编辑器与性能优化方向高度一致。\n\n随信附上简历，期待有机会进一步沟通。\n\n此致\nAaron',
      subjectRuleOk: true,
      error: null
    },
    {
      id: 'a3',
      jobId: 'j5',
      candidateId: 'c2',
      channel: 'ats-form',
      status: 'replied',
      submittedAt: t.atDay(-1, 16, 20),
      score: 89,
      resumeSnapshot: 'linshan-product-designer.pdf · 版本 3',
      toEmail: null,
      subject: null,
      body: null,
      subjectRuleOk: null,
      error: null
    },
    {
      id: 'a4',
      jobId: 'j4',
      candidateId: 'c1',
      channel: 'platform-message',
      status: 'pending_confirm',
      submittedAt: t.atDay(0, 8, 50),
      score: 74,
      resumeSnapshot: 'aaron-frontend-2026.pdf · 版本 7',
      toEmail: null,
      subject: null,
      body: null,
      subjectRuleOk: null,
      error: null
    },
    {
      id: 'a5',
      jobId: 'j10',
      candidateId: 'c2',
      channel: 'email',
      status: 'failed',
      submittedAt: t.atDay(-1, 11, 3),
      score: 81,
      resumeSnapshot: 'linshan-product-designer.pdf · 版本 3',
      toEmail: 'design-recruit@figma.com',
      subject: 'Application - Software Engineer, Design Systems - Lin Shan',
      body: null,
      subjectRuleOk: true,
      error: 'SMTP 未配置：该求职者尚未填写邮箱授权码'
    },
    {
      id: 'a6',
      jobId: 'j3',
      candidateId: 'c1',
      channel: 'ats-form',
      status: 'queued',
      submittedAt: t.atDay(0, 8, 12),
      score: 81,
      resumeSnapshot: 'aaron-frontend-2026.pdf · 版本 7',
      toEmail: null,
      subject: null,
      body: null,
      subjectRuleOk: null,
      error: null
    },
    {
      id: 'a7',
      jobId: 'j6',
      candidateId: 'c3',
      channel: 'email',
      status: 'sent',
      submittedAt: t.atDay(-1, 18, 40),
      score: 72,
      resumeSnapshot: 'chenmo-fullstack.pdf · 版本 2',
      toEmail: 'apacta.recruit@example-bank.com',
      subject: 'Application - Frontend Developer (Contract) - Mo Chen',
      body:
        'Dear Hiring Team,\n\nI am writing to apply for the Frontend Developer (Contract) position. I have 8 years of experience building internal systems, with strong TypeScript and Node.js background.\n\nPlease find my resume attached.\n\nBest regards,\nMo Chen',
      subjectRuleOk: true,
      error: null
    },
    {
      id: 'a8',
      jobId: 'j9',
      candidateId: 'c3',
      channel: 'platform-message',
      status: 'pending_confirm',
      submittedAt: t.atDay(0, 7, 30),
      score: 78,
      resumeSnapshot: 'chenmo-fullstack.pdf · 版本 2',
      toEmail: null,
      subject: null,
      body: null,
      subjectRuleOk: null,
      error: null
    },
    {
      id: 'a9',
      jobId: 'j11',
      candidateId: 'c3',
      channel: 'ats-form',
      status: 'rejected',
      submittedAt: t.daysAgo(3),
      score: 70,
      resumeSnapshot: 'chenmo-fullstack.pdf · 版本 1',
      toEmail: null,
      subject: null,
      body: null,
      subjectRuleOk: null,
      error: '对方反馈：岗位已关闭'
    }
  ]

  const applicationRows: (typeof schema.applications.$inferInsert)[] = applicationSeeds.map(
    (row) => ({ ...row, createdAt: row.submittedAt, updatedAt: row.submittedAt })
  )

  const logRows: (typeof schema.applicationLogs.$inferInsert)[] = [
    { id: 'a1-1', applicationId: 'a1', seq: 1, at: t.atDay(0, 9, 40), label: '通道探测', detail: '识别为 Greenhouse 表单，字段 14 个，已映射 13 个' },
    { id: 'a1-2', applicationId: 'a1', seq: 2, at: t.atDay(0, 9, 41), label: '表单填充', detail: '自动填充完成，留痕截图已保存' },
    { id: 'a1-3', applicationId: 'a1', seq: 3, at: t.atDay(0, 9, 42), label: '提交成功', detail: '收到确认页，申请编号 GH-88213' },
    { id: 'a2-1', applicationId: 'a2', seq: 1, at: t.atDay(0, 9, 12), label: '主题渲染', detail: '按 JD 约定模板渲染主题，校验通过' },
    { id: 'a2-2', applicationId: 'a2', seq: 2, at: t.atDay(0, 9, 14), label: 'SMTP 发送', detail: 'smtp.gmail.com:465，投递成功' },
    { id: 'a2-3', applicationId: 'a2', seq: 3, at: t.atDay(0, 9, 15), label: '记录归档', detail: '简历快照与邮件正文已写入本地库' },
    { id: 'a3-1', applicationId: 'a3', seq: 1, at: t.atDay(-1, 16, 10), label: '表单提交', detail: 'Ashby 表单，附件上传成功' },
    { id: 'a3-2', applicationId: 'a3', seq: 2, at: t.atDay(-1, 16, 20), label: '已投递', detail: '等待对方处理' },
    { id: 'a3-3', applicationId: 'a3', seq: 3, at: t.atDay(0, 10, 2), label: '收到回复', detail: '对方通过 IMAP 回信，已标记为「已回复」' },
    { id: 'a4-1', applicationId: 'a4', seq: 1, at: t.atDay(0, 8, 49), label: '生成求职信', detail: '按 JD 与补充要求生成，等待人工确认' },
    { id: 'a4-2', applicationId: 'a4', seq: 2, at: t.atDay(0, 8, 50), label: '进入待确认队列', detail: '匹配度 74，低于自动阈值 85' },
    { id: 'a5-1', applicationId: 'a5', seq: 1, at: t.atDay(-1, 11, 2), label: '主题渲染', detail: '按英文模板渲染，校验通过' },
    { id: 'a5-2', applicationId: 'a5', seq: 2, at: t.atDay(-1, 11, 3), label: '发送失败', detail: '该求职者未配置 SMTP，邮件通道不可用' },
    { id: 'a6-1', applicationId: 'a6', seq: 1, at: t.atDay(0, 8, 12), label: '进入队列', detail: '目标时区窗口为当地 09:00 开始，暂缓发送' },
    { id: 'a7-1', applicationId: 'a7', seq: 1, at: t.atDay(-1, 18, 38), label: '主题渲染', detail: '英文模板渲染完成' },
    { id: 'a7-2', applicationId: 'a7', seq: 2, at: t.atDay(-1, 18, 40), label: 'SMTP 发送', detail: 'smtp.163.com:465，投递成功' },
    { id: 'a8-1', applicationId: 'a8', seq: 1, at: t.atDay(0, 7, 30), label: '进入待确认队列', detail: '匹配度 78，低于自动阈值 82' },
    { id: 'a9-1', applicationId: 'a9', seq: 1, at: t.daysAgo(3), label: '提交成功', detail: 'Ashby 表单' },
    { id: 'a9-2', applicationId: 'a9', seq: 2, at: t.daysAgo(3), label: '收到拒信', detail: '自动归类为「已拒绝」，不计入失败' }
  ]

  // ------------------------------------------------------------ 沟通
  const conversationRows: (typeof schema.conversations.$inferInsert)[] = [
    { id: 'cv1', jobId: 'j2', candidateId: 'c1', sourceId: 'boss', peerName: '林曦', peerTitle: 'HRBP · 飞书', stage: 'interview', lastMessageAt: t.minutesAgo(18), createdAt: t.daysAgo(2) },
    { id: 'cv2', jobId: 'j4', candidateId: 'c2', sourceId: 'boss', peerName: '周颖', peerTitle: '招聘专员 · 商业化', stage: 'chatting', lastMessageAt: t.daysAgo(1), createdAt: t.daysAgo(2) },
    { id: 'cv3', jobId: 'j1', candidateId: 'c1', sourceId: 'greenhouse', peerName: 'Emily Chen', peerTitle: 'Technical Recruiter', stage: 'screening', lastMessageAt: t.minutesAgo(52), createdAt: t.daysAgo(1) },
    { id: 'cv4', jobId: 'j9', candidateId: 'c3', sourceId: 'boss', peerName: '王倩', peerTitle: '技术招聘 · 体验技术部', stage: 'offer', lastMessageAt: t.daysAgo(2), createdAt: t.daysAgo(3) },
    { id: 'cv5', jobId: 'j3', candidateId: 'c1', sourceId: 'ashby', peerName: 'Marcus Lee', peerTitle: 'Hiring Manager', stage: 'closed', lastMessageAt: t.daysAgo(6), createdAt: t.daysAgo(7) },
    { id: 'cv6', jobId: 'j7', candidateId: 'c2', sourceId: 'liepin', peerName: '刘洋', peerTitle: '招聘经理 · 增长', stage: 'chatting', lastMessageAt: t.hoursAgo(3), createdAt: t.hoursAgo(5) }
  ]

  // readAt 有值表示已读。cv2 / cv4 / cv5 已读完，其余保留未读
  const msg = (
    id: string,
    conversationId: string,
    seq: number,
    at: Date,
    dir: 'in' | 'out',
    text: string,
    readAt: Date | null
  ) => ({ id, conversationId, seq, at, dir, text, readAt })

  const messageRows: (typeof schema.messages.$inferInsert)[] = [
    msg('cv1-1', 'cv1', 1, t.daysAgo(2), 'in', '你好，看到你投的飞书前端岗位，简历我看了，经历挺匹配的。方便先电话聊 15 分钟吗？', t.daysAgo(2)),
    msg('cv1-2', 'cv1', 2, t.daysAgo(2), 'out', '可以的，明天下午 3 点之后我都有空，您看哪个时间段方便？', t.daysAgo(2)),
    msg('cv1-3', 'cv1', 3, t.daysAgo(2), 'in', '那就明天下午 4 点，我打你留的号码。', t.daysAgo(2)),
    msg('cv1-4', 'cv1', 4, t.daysAgo(2), 'out', '好的，届时我在线。', t.daysAgo(2)),
    msg('cv1-5', 'cv1', 5, t.hoursAgo(3), 'in', '刚和技术负责人同步了一下，想约这周四下午两点做技术面，线上，大概 60 分钟。', null),
    msg('cv1-6', 'cv1', 6, t.minutesAgo(18), 'in', '另外先确认一下：深圳办公室每周到岗 3 天，你这边能接受吗？', null),
    msg('cv2-1', 'cv2', 1, t.daysAgo(2), 'in', '你好，看到你的简历，商业化这边在招前端，想了解一下你目前看机会的节奏？', t.daysAgo(2)),
    msg('cv2-2', 'cv2', 2, t.daysAgo(2), 'out', '你好，我这边在看机会，远程或者深圳都可以，主要看团队和业务方向。', t.daysAgo(2)),
    msg('cv2-3', 'cv2', 3, t.daysAgo(1), 'in', '明白，我们是深圳坐班，做商业化增长方向。方便发一份最近的作品集吗？', t.hoursAgo(20)),
    msg('cv3-1', 'cv3', 1, t.daysAgo(1), 'in', 'Hi Aaron — thanks for applying to the Console team. Your editor work looks close to what we are building. Are you open to a 30-minute intro call this week?', t.daysAgo(1)),
    msg('cv3-2', 'cv3', 2, t.hoursAgo(22), 'out', 'Hi Emily, thanks for reaching out. I am open to it — I am in GMT+8, so mornings your time work best for me.', t.hoursAgo(22)),
    msg('cv3-3', 'cv3', 3, t.minutesAgo(52), 'in', 'Great. I have sent a scheduling link for Thursday 9:00–11:00 PT. Also, are you authorized to work in the US, or would you need sponsorship?', null),
    msg('cv4-1', 'cv4', 1, t.daysAgo(3), 'in', '面试反馈出来了，两位面试官评价都不错。', t.daysAgo(3)),
    msg('cv4-2', 'cv4', 2, t.daysAgo(3), 'out', '谢谢，辛苦帮忙推进。', t.daysAgo(3)),
    msg('cv4-3', 'cv4', 3, t.daysAgo(2), 'in', '这边在走 offer 审批，职级 P7。薪资范围先口头同步：月薪 45–52K，16 薪，你看是否在预期内？', t.daysAgo(2)),
    msg('cv4-4', 'cv4', 4, t.daysAgo(2), 'out', '这个范围可以接受，具体等正式 offer 再谈细节。', t.daysAgo(2)),
    msg('cv5-1', 'cv5', 1, t.daysAgo(7), 'in', 'Thanks for the time today — the team enjoyed the conversation.', t.daysAgo(7)),
    msg('cv5-2', 'cv5', 2, t.daysAgo(7), 'out', 'Thanks Marcus, it was a pleasure.', t.daysAgo(7)),
    msg('cv5-3', 'cv5', 3, t.daysAgo(6), 'in', 'We decided to move forward with another candidate whose design-systems depth is a closer fit. Really appreciated your time.', t.daysAgo(6)),
    msg('cv6-1', 'cv6', 1, t.hoursAgo(5), 'in', '你好，看到你在 React 与 Electron 方面的经验，我们增长团队有个岗位比较合适，方便聊聊吗？', t.hoursAgo(5)),
    msg('cv6-2', 'cv6', 2, t.hoursAgo(4), 'out', '方便的，可以先说说团队目前在做的方向。', t.hoursAgo(4)),
    msg('cv6-3', 'cv6', 3, t.hoursAgo(3), 'in', '主要是官网与活动页的性能优化，还有一部分内部工具。薪资 35–50K，16 薪，你看合适吗？', null)
  ]

  // ------------------------------------------------------------ 面试
  const interviewRows: (typeof schema.interviews.$inferInsert)[] = [
    {
      id: 'it1', jobId: 'j2', candidateId: 'c1', sourceId: 'boss', conversationId: 'cv1',
      round: 'technical', roundIndex: 2, roundTotal: 3, status: 'invited',
      startsAt: t.atDay(1, 10, 0), durationMin: 60, format: 'video',
      place: 'https://vc.feishu.cn/j/882314907', invitedAt: t.minutesAgo(96),
      replyBy: t.soon(70),
      note: '技术面 60 分钟，含 15 分钟项目深挖。想听你讲一个自己主导的性能优化案例，最好有量化结果。',
      createdAt: t.minutesAgo(96)
    },
    {
      id: 'it2', jobId: 'j1', candidateId: 'c1', sourceId: 'greenhouse', conversationId: 'cv3',
      round: 'phone', roundIndex: 1, roundTotal: 3, status: 'invited',
      startsAt: t.atDay(1, 14, 0), durationMin: 60, format: 'video',
      place: 'https://meet.google.com/xkv-rmtq-abc', invitedAt: t.minutesAgo(52),
      replyBy: t.atDay(1, 9, 0),
      note: '30-minute intro plus 30 minutes with the hiring manager. We will also cover work authorization and timezone overlap.',
      createdAt: t.minutesAgo(52)
    },
    {
      id: 'it3', jobId: 'j5', candidateId: 'c1', sourceId: 'greenhouse', conversationId: null,
      round: 'final', roundIndex: 3, roundTotal: 3, status: 'accepted',
      startsAt: t.atDay(1, 14, 30), durationMin: 90, format: 'video',
      place: 'https://vercel.zoom.us/j/97120043321', invitedAt: t.daysAgo(2),
      replyBy: null,
      note: 'Final round: 45 min portfolio walkthrough, 30 min craft exercise, 15 min Q&A. Screen share is fine.',
      createdAt: t.daysAgo(2)
    },
    {
      id: 'it4', jobId: 'j9', candidateId: 'c3', sourceId: 'boss', conversationId: 'cv4',
      round: 'technical', roundIndex: 2, roundTotal: 4, status: 'accepted',
      startsAt: t.atDay(1, 14, 30), durationMin: 45, format: 'onsite',
      place: '杭州 · 蚂蚁 A 空间 B 座 12F，前台登记后联系 HR', invitedAt: t.daysAgo(1),
      replyBy: null,
      note: '现场面请带身份证登记；45 分钟技术面 + 15 分钟部门介绍。',
      createdAt: t.daysAgo(1)
    },
    {
      id: 'it5', jobId: 'j4', candidateId: 'c2', sourceId: 'boss', conversationId: 'cv2',
      round: 'manager', roundIndex: 2, roundTotal: 3, status: 'invited',
      startsAt: t.atDay(2, 10, 0), durationMin: 60, format: 'video',
      place: 'https://vc.feishu.cn/j/550128846', invitedAt: t.hoursAgo(6),
      replyBy: t.atDay(1, 20, 0),
      note: '业务负责人想聊一下增长方向的判断，可以准备一两个你对小红书商业化的观察。',
      createdAt: t.hoursAgo(6)
    },
    {
      id: 'it6', jobId: 'j8', candidateId: 'c1', sourceId: 'linkedin', conversationId: null,
      round: 'design', roundIndex: 2, roundTotal: 3, status: 'accepted',
      startsAt: t.atDay(4, 9, 0), durationMin: 60, format: 'video',
      place: 'https://shopify.zoom.us/j/8842013377', invitedAt: t.daysAgo(3),
      replyBy: t.atDay(2, 12, 0),
      note: 'System design: walk us through designing a checkout flow that survives flash sales.',
      createdAt: t.daysAgo(3)
    },
    {
      id: 'it7', jobId: 'j7', candidateId: 'c2', sourceId: 'liepin', conversationId: 'cv6',
      round: 'hr', roundIndex: 1, roundTotal: 2, status: 'rescheduled',
      startsAt: t.atDay(7, 11, 0), durationMin: 45, format: 'onsite',
      place: '上海 · 漕河泾开发区 米哈游 A 栋', invitedAt: t.daysAgo(2),
      replyBy: t.atDay(5, 18, 0),
      note: '原定本周四下午，因面试官出差改到这个时间，已确认。',
      createdAt: t.daysAgo(2)
    },
    {
      id: 'it8', jobId: 'j9', candidateId: 'c3', sourceId: 'boss', conversationId: null,
      round: 'technical', roundIndex: 1, roundTotal: 4, status: 'done',
      startsAt: t.atDay(-3, 15, 0), durationMin: 60, format: 'onsite',
      place: '杭州 · 蚂蚁 A 空间 B 座 12F', invitedAt: t.daysAgo(6),
      replyBy: null,
      note: '一面已通过，反馈在两天内给出。',
      createdAt: t.daysAgo(6)
    },
    {
      id: 'it9', jobId: 'j6', candidateId: 'c3', sourceId: 'linkedin', conversationId: null,
      round: 'phone', roundIndex: 1, roundTotal: 3, status: 'declined',
      startsAt: t.atDay(-5, 11, 0), durationMin: 30, format: 'phone',
      place: '+86 21 6088 2210', invitedAt: t.daysAgo(7),
      replyBy: null,
      note: '合同制岗位，求职者已婉拒。',
      createdAt: t.daysAgo(7)
    }
  ]

  const interviewerRows: (typeof schema.interviewInterviewers.$inferInsert)[] = [
    { id: 'it1-1', interviewId: 'it1', seq: 1, name: '陈默', title: '前端负责人' },
    { id: 'it1-2', interviewId: 'it1', seq: 2, name: '林曦', title: 'HRBP' },
    { id: 'it2-1', interviewId: 'it2', seq: 1, name: 'Emily Chen', title: 'Technical Recruiter' },
    { id: 'it3-1', interviewId: 'it3', seq: 1, name: 'Rauno Freiberg', title: 'Design Engineer' },
    { id: 'it3-2', interviewId: 'it3', seq: 2, name: 'Guillermo Rauch', title: 'CEO' },
    { id: 'it4-1', interviewId: 'it4', seq: 1, name: '王倩', title: '技术招聘' },
    { id: 'it4-2', interviewId: 'it4', seq: 2, name: '徐斌', title: '体验技术部 · 前端专家' },
    { id: 'it5-1', interviewId: 'it5', seq: 1, name: '周颖', title: '招聘专员 · 商业化' },
    { id: 'it6-1', interviewId: 'it6', seq: 1, name: 'Dana Whitfield', title: 'Engineering Manager, Checkout' },
    { id: 'it7-1', interviewId: 'it7', seq: 1, name: '刘洋', title: '招聘经理 · 增长' },
    { id: 'it8-1', interviewId: 'it8', seq: 1, name: '徐斌', title: '体验技术部 · 前端专家' },
    { id: 'it9-1', interviewId: 'it9', seq: 1, name: 'Grace Lam', title: 'Talent Acquisition' }
  ]

  const savedViewRows: (typeof schema.savedViews.$inferInsert)[] = [
    { id: 'v1', nameKey: 'jobs.viewRemoteHigh', filter: { remote: true, verdict: 'auto' }, sort: 0 },
    { id: 'v2', nameKey: 'jobs.viewBigTech', filter: { companies: ['字节跳动', '蚂蚁集团', '小红书', 'Anthropic', 'Figma', 'Notion'] }, sort: 1 },
    { id: 'v3', nameKey: 'jobs.viewVisa', filter: { visa: true }, sort: 2 }
  ]

  const llmRows: (typeof schema.llmUsage.$inferInsert)[] = [
    { scene: 'settings.sceneJd', model: 'deepseek-chat', calls: 1284, costCents: 192, updatedAt: t.hoursAgo(1) },
    { scene: 'settings.sceneMatch', model: 'deepseek-chat', calls: 3840, costCents: 306, updatedAt: t.hoursAgo(1) },
    { scene: 'settings.sceneLetter', model: 'claude-sonnet', calls: 34, costCents: 428, updatedAt: t.hoursAgo(2) },
    { scene: 'settings.sceneField', model: 'deepseek-chat', calls: 96, costCents: 14, updatedAt: t.hoursAgo(3) }
  ]

  const settingRows: (typeof schema.settings.$inferInsert)[] = [
    { key: 'active_candidate_id', value: 'c1', updatedAt: new Date(base) },
    { key: 'automation_level', value: 'B', updatedAt: new Date(base) },
    { key: 'data_seeded_at', value: new Date(base).toISOString(), updatedAt: new Date(base) }
  ]

  // 收藏：mock 里只有 j2 被收藏
  const bookmarkRows = [{ jobId: 'j2', createdAt: t.daysAgo(1) }]

  const insertAll = sqlite.transaction(() => {
    db.insert(schema.candidates).values(candidateRows).run()
    db.insert(schema.sources).values(sourceRows).run()
    db.insert(schema.jobs).values(jobRows).run()
    db.insert(schema.jobScores).values(scoreRows).run()
    db.insert(schema.jobBookmarks).values(bookmarkRows).run()
    db.insert(schema.applications).values(applicationRows).run()
    db.insert(schema.applicationLogs).values(logRows).run()
    db.insert(schema.conversations).values(conversationRows).run()
    db.insert(schema.messages).values(messageRows).run()
    db.insert(schema.interviews).values(interviewRows).run()
    db.insert(schema.interviewInterviewers).values(interviewerRows).run()
    db.insert(schema.savedViews).values(savedViewRows).run()
    db.insert(schema.llmUsage).values(llmRows).run()
    db.insert(schema.settings).values(settingRows).run()
  })
  insertAll()

  return true
}
