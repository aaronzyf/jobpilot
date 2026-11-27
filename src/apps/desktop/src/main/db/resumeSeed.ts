import type { ResumeContact, ResumeEntryKind, ResumeSkillGroup } from '@core'

/**
 * 简历正文的种子内容。
 *
 * 这份内容取自一份真实的全栈工程师简历（PDF 解析结果），
 * 用来演示「点简历 → 看预览」的完整链路：个人简介、求职意向、
 * 技术栈分组，以及一条条按时间排的工作经历与项目。
 *
 * 结构与真正的解析产物一致：正文段落进 resume_documents，
 * 时间线上的每条经历进 resume_items。
 */

export interface ResumeItemSeed {
  id: string
  candidateId: string
  kind: ResumeEntryKind
  title: string
  subtitle: string
  period: string
  stack: string
  highlights: string[]
  position: number
}

export interface ResumeDocumentSeed {
  candidateId: string
  profile: string
  intent: string
  skills: ResumeSkillGroup[]
  contact: ResumeContact
}

/** 求职档案 c1：全栈工程师 / 前端架构师 */
const c1Skills: ResumeSkillGroup[] = [
  {
    group: '语言',
    items: ['TypeScript（严格类型体系、类型推导与校验）', 'JavaScript', 'Java', 'PHP', 'SQL']
  },
  {
    group: '前端',
    items: [
      'React',
      'Next.js',
      'React Native',
      'Vue',
      'Taro',
      'Ant Design / Pro',
      'NextUI',
      'Redux',
      'Webpack',
      '微前端'
    ]
  },
  {
    group: '移动端',
    items: [
      'React Native',
      'Flutter',
      'Ant Design RN',
      'CodePush 热更新',
      'SQLite',
      'TypeORM',
      'iOS / Android 双端发布',
      '原生库封装'
    ]
  },
  {
    group: '数据 / 接口',
    items: ['Express', 'Sequelize', 'MySQL', 'SQLite', 'TypeORM', 'MQTT', 'RESTful API 与接口文档设计']
  },
  {
    group: '后端',
    items: ['NestJS', 'Node.js', 'Java', 'Spring 全家桶', 'PHP', 'Yii', 'Drupal', 'ASP']
  },
  {
    group: '工程 / 协作',
    items: [
      '组件库与工具库建设',
      'TypeScript 规范与代码评审',
      'AWS S3',
      'Git',
      '需求评审',
      '任务分配与进度跟进',
      '团队招聘与带教'
    ]
  }
]

const c1Profile = [
  '18 年研发经验，横跨服务端与前端：2008 年正式入行，早期以 PHP（Drupal / Yii）、Java（Spring 全家桶）从 0 交付完整后端系统，近 7 年聚焦前端架构与 React Native 移动端。',
  '全栈实战：独立或主导交付过 P2P 理财借贷平台、地方门户、CRM 与 WebSocket 服务端、资金链路（提现上链）等系统，可独立完成数据建模、接口设计到前端实现的全链路工作。',
  '前端架构：主导数字货币交易所 Web / App / 管理后台三端重构，擅长组件库与工具库抽象、数据通讯层设计、TypeScript 严格类型体系与团队工程规范建设。',
  '移动端：React Native（TypeScript）从 0 到 1 交付即时通讯 App（MQTT 自研通讯 + SQLite 本地存储 + CodePush 热更新）；兼具 Flutter 维护与跨端技术选型经验。',
  '工程化与平台建设：自建多语言翻译管理平台（版本构建、S3 分发、增量差异、所见即所得预览）；以低代码配置化方案重构十余个异构子项目，并设计细粒度权限体系，长期负责团队招聘与带教。',
  '自学与思维方式：非科班、自学出身，多年持续跟进前沿技术；善于思考，习惯观察日常应用背后的产品设计逻辑，并在开发中主动把交互体验纳入技术决策。',
  '团队与技术管理：负责前端团队任务分配、进度跟进、方案制定与需求评审，并参与招聘与绩效管理。'
].join('\n\n')

const c1Intent =
  '全栈工程师 / 前端架构师 / 大前端负责人 / React Native 高级开发；期望城市南京，可远程协作，亦可面议 relocate。技术取向：早年做全栈与后端，近年专注前端；对代码质量有要求，倾向通过抽象公共方法、类与组件让整体代码更简洁，习惯从产品与交互设计视角反推技术实现。'

const c1Items: Omit<ResumeItemSeed, 'candidateId'>[] = [
  {
    id: 'r1-1',
    kind: 'experience',
    title: 'UbitEx（数字货币交易所 CEX）',
    subtitle: '前端负责人 / 全栈',
    period: '2024.01 – 2025.04',
    stack: 'TypeScript · React · Next.js · React Native · Node.js / Express · Ant Design Pro · NextUI · WebSocket',
    highlights: [
      '前端架构：主导数字货币交易所 Web / App / 管理后台三端重构，擅长组件库与工具库抽象、数据通讯层设计、TypeScript 严格类型体系与团队工程规范建设',
      '管理后台重构：将原先以微前端拼接的十余个技术栈各异的子项目，重构为基于数据模型的 JSON 配置化低代码方案，动态生成查询表格、CRUD 表单与校验，大幅降低多技术栈并行的维护成本',
      '统一权限体系：设计细粒度权限识别机制，精确控制到按钮级的功能可见性，替代原有分散的权限判断逻辑',
      'Web 端重构：制定 TypeScript 开发规范（明确杜绝 any script 写法）；与 UI 团队共建标准化基础组件与业务组件；将数据通讯层抽离为独立模块，使 Web 与 React Native 手机站复用同一套接口与数据逻辑',
      '自建多语言翻译管理平台：替代 Lokalise 并统一 Web / 移动端此前各自维护的两套翻译 key；支持构建版本管理、词条资源自动上传 AWS S3、版本间差异词条生成，Web 侧边栏与 App 扫码均可实时预览当前页面词条'
    ],
    position: 0
  },
  {
    id: 'r1-2',
    kind: 'experience',
    title: '南京龙门电子科技有限公司',
    subtitle: '大前端 / 全栈开发',
    period: '2023.09 – 2023.12',
    stack: 'TypeScript · React Native · Node.js · Sequelize · MySQL · SQLite · TypeORM · MQTT · CodePush · Ant Design Pro',
    highlights: [
      '业绩：管理后台从 0 推进至正式上线；App 从 0 推进至内测阶段',
      '移动端重构（Flutter → React Native）：基于迭代节奏与热更新能力做技术选型，将 App 与手机站迁移至 React Native + TypeScript 并接入热更新，解除迭代受应用商店审核钳制的瓶颈，接口与数据通讯代码与 PC Web 完全共用'
    ],
    position: 1
  },
  {
    id: 'r1-3',
    kind: 'experience',
    title: '南京安杰信息科技有限公司 · Fairdesk（数字货币交易所 CEX）',
    subtitle: '前端开发工程师',
    period: '2021.09 – 2023.09',
    stack: 'TypeScript · React · React Native · Flutter · Java · Ant Design Pro · Ant Design RN · Taro',
    highlights: [
      '职责与技术演进：负责 fairdesk.com 交易所 Web 端功能开发、App 从 0 开发及配套运营工具；初期维护 Flutter 版本 App，后续主导使用 React Native 完成重构',
      '组件库与工程结构：基于 Ant Design RN 结合业务场景封装整套组件库，并负责项目结构设计与代码规范设计，提升团队复用效率',
      '严格类型体系：服务端数据先行校验再进入后续流程，确保下游类型均由校验后的类型推导得出，从源头消除类型转换错误；方法入参与返回值均有明确类型定义',
      '后端协作：客串两个月 Java 后端开发，参与服务端业务实现'
    ],
    position: 2
  },
  {
    id: 'r1-4',
    kind: 'experience',
    title: '南京诺迈特网络科技有限公司',
    subtitle: '前端经理',
    period: '2019 – 2021',
    stack: 'TypeScript · React · React Native · Taro · Ant Design / Pro · Redux · Webpack · HTML / CSS',
    highlights: [
      '背景与职责：在南京与两位合伙人承接政企外包项目，三人中只有具备前端经验，由此转为专职前端并负责全部前端工作',
      '平罗工业园区运营管理系统：承接当地政府单位项目，负责物料管理、访客管理、办公 App 与指挥中心大屏等模块，基于 React Native 开发 App、基于 Ant Design Pro 开发 PC 端功能',
      '指尖牧匠：宁夏线上农产品商城与领养家畜项目，基于 React Native 开发 App，并封装支付宝登录、支付等 React Native 原生库',
      '书山有林：在线教育产品，覆盖 App、小程序与公众平台，独立负责前端部分，基于 Taro（React）开发小程序'
    ],
    position: 3
  },
  {
    id: 'r1-5',
    kind: 'experience',
    title: '99财富（徐州欧信电子商务有限公司南京分公司）',
    subtitle: '负责人 / 架构师',
    period: '2017 – 2019',
    stack: 'PHP · Yii · Java · Spring 全家桶 · React · MySQL',
    highlights: [
      '第一版（从 0 到 1）：入职时公司使用的是采购来的商业程序，老旧、bug 多；在旧项目稳定维护后，改用 PHP 的 Yii 框架重写，前端基于 React',
      '第二版：负责新版本技术选型与底层开发，基于 Java Spring 全家桶从零搭建；主持新版本需求调研，制定详细开发计划与实施方案，并编写核心业务代码',
      '前后端协作：负责非核心业务的接口文档定义，与后端协同推进日常业务迭代与线上维护',
      '团队建设：第一次带超过 10 人的团队从头开发一个项目；公司招聘薪资预算有限，成员以学习能力强、经验较浅的为主，采用边培训边开发的方式推进'
    ],
    position: 4
  },
  {
    id: 'r1-6',
    kind: 'experience',
    title: '中舞网 wudao.com（南京舞之道企业管理有限公司）',
    subtitle: '全栈工程师',
    period: '2016 – 2017',
    stack: 'PHP · Node.js · WebSocket · MySQL',
    highlights: [
      '业绩：主持开发 App 与网站，并负责人员招聘与需求分析',
      '银行资金存管：因监管要求资金必须银行存管，配合合作方太原城区农村信用联社完成资金存管相关开发',
      'CRM 系统：负责公司 CRM 系统的开发工作，以及 ERP 中涉及 CRM 部分的开发',
      'App 服务端：负责 App 接口开发，以及基于 Node.js 的 WebSocket 服务端功能开发',
      '技术探索：负责新项目的技术探索与选型工作'
    ],
    position: 5
  },
  {
    id: 'r1-7',
    kind: 'project',
    title: 'HiClub 即时通讯 App',
    subtitle: '独立开发，0 → 1',
    period: '',
    stack: 'React Native · TypeScript · MQTT · SQLite · TypeORM · CodePush',
    highlights: [
      '依据设计稿抽象出设计规范并落地为完整 UI 组件库；未采用第三方 IM SDK，通讯与本地存储全部自研，功能覆盖私聊、群聊与群内 AI 助理',
      '通讯与数据存储：自研 MQTT 封装实现实时消息收发；参照主流 IM 思路将大部分业务数据落地客户端 SQLite（TypeORM 做 CRUD）并按消息内容增量更新，弱网与离线体验稳定',
      '内存与性能治理：摒弃全局状态管理库，仅在必要场景使用 React Context + Hooks；自研工具库统一编排本地数据 / 实时推送数据 / React state 的读取与落库，显著降低内存占用',
      '热更新：接入 CodePush，原生代码未变更时对 JS Bundle 热重载，支撑高频迭代'
    ],
    position: 6
  },
  {
    id: 'r1-8',
    kind: 'project',
    title: '提现管理系统',
    subtitle: 'Node 服务端，独立交付',
    period: '',
    stack: 'Node.js · Sequelize · MySQL',
    highlights: [
      '实现订单拉取、交易处理与链上提交的完整资金链路服务',
      '管理后台：基于 Ant Design Pro 从 0 搭建并推动上线'
    ],
    position: 7
  },
  {
    id: 'r1-9',
    kind: 'experience',
    title: '早期经历',
    subtitle: '2004 – 2015',
    period: '',
    stack: 'Drupal · ASP · PHP CMS · Node.js · JavaScript',
    highlights: [
      '2014 – 2015：基于 Drupal 从 0 开发 P2P 理财借贷平台「丁丁贷」第一个版本，全公司仅一名程序员，独立承担前后端全部开发工作',
      '2011 – 2012：上海天天财富网，开发炒股软件（内嵌网页的伪 C/S 客户端）',
      '2008.08 – 2010.12：戴文信息科技（上海）有限公司，基于 Drupal 交付各类网站项目，并向 Drupal 社区贡献开源模块',
      '2004 – 2008：初三至高二在 anpy（自助建站平台）、网易（收费空间）、6to23 中国学生网（免费 10M 空间）上做个人网站；随后模仿 Alexa 全球排名前 500 的徐州地方门户「彭城视窗」，做成地方门户「沛县视窗」，基于 PHP CMS 实现并承接本地商户广告'
    ],
    position: 8
  }
]

/** 求职档案 c2：产品设计师 */
const c2Items: Omit<ResumeItemSeed, 'candidateId'>[] = [
  {
    id: 'r2-1',
    kind: 'experience',
    title: '某 B 端 SaaS 服务商',
    subtitle: '产品设计师',
    period: '2021 – 至今',
    stack: 'Figma · Sketch · Axure · 设计系统',
    highlights: [
      '负责企业后台从 0 到 1 的产品设计，覆盖风控工作台与数据看板两条主线',
      '沉淀跨产品线的设计规范与组件库，新页面设计交付周期缩短约四成',
      '与前端、研发一起做走查，把交互问题挡在上线前'
    ],
    position: 0
  },
  {
    id: 'r2-2',
    kind: 'project',
    title: '风控工作台改版',
    subtitle: '主导设计',
    period: '',
    stack: 'Figma · 原型 · 用户访谈',
    highlights: [
      '梳理 200+ 条审核流程，把高频操作从七步压缩到三步',
      '通过 6 场用户访谈确认信息层级，避免了整套表单的重做'
    ],
    position: 1
  },
  {
    id: 'r2-3',
    kind: 'experience',
    title: '某互联网公司',
    subtitle: '交互设计师',
    period: '2019 – 2021',
    stack: 'Figma · 交互原型 · 可用性测试',
    highlights: [
      '负责 C 端活动与会员体系的设计与落地',
      '推动可用性测试常态化，每个版本上线前至少跑一轮'
    ],
    position: 2
  }
]

/** 求职档案 c3：全栈工程师 */
const c3Items: Omit<ResumeItemSeed, 'candidateId'>[] = [
  {
    id: 'r3-1',
    kind: 'experience',
    title: '某电商中台',
    subtitle: '全栈工程师',
    period: '2022 – 至今',
    stack: 'Go · Node.js · PostgreSQL · Redis · Kafka',
    highlights: [
      '负责订单与库存服务的接口设计与实现，接口 P99 稳定在 120ms 以内',
      '用 Redis 幂等键挡住重复下单，把大促期间的资损降到零'
    ],
    position: 0
  },
  {
    id: 'r3-2',
    kind: 'project',
    title: '实时数据看板',
    subtitle: '主力开发',
    period: '',
    stack: 'Vue · WebSocket · Node.js',
    highlights: [
      '用 WebSocket 推送增量数据，前端只做局部更新，避免整页刷新',
      '服务端做多级缓存，百万级明细的聚合查询稳定在 400ms 内'
    ],
    position: 1
  },
  {
    id: 'r3-3',
    kind: 'experience',
    title: '某 SaaS 公司',
    subtitle: '后端工程师',
    period: '2018 – 2022',
    stack: 'Java · Spring · MySQL · Docker',
    highlights: [
      '从零搭建多租户账号体系与权限模型，支撑上百家企业客户',
      '把核心服务容器化，发布从「停机窗口」变成滚动更新'
    ],
    position: 2
  }
]

export const resumeDocumentSeeds: ResumeDocumentSeed[] = [
  {
    candidateId: 'c1',
    profile: c1Profile,
    intent: c1Intent,
    skills: c1Skills,
    contact: {
      phone: '133-8277-2137',
      telegram: 'aaronzyf'
    }
  },
  {
    candidateId: 'c2',
    profile:
      '4 年 B 端产品设计经验，专注企业服务与风控方向。擅长把复杂业务流程拆成清晰的操作路径，用设计系统把一次性的方案沉淀成可复用的规范。习惯先做用户访谈再动手画稿，交付后一定跟到上线走查。',
    intent:
      '产品设计师 / B 端体验设计；期望城市上海或远程，接受合同制；偏好有真实业务复杂度的企业级产品，不做纯展示类设计。',
    skills: [
      { group: '设计工具', items: ['Figma', 'Sketch', 'Axure', 'Framer'] },
      { group: '专业能力', items: ['设计系统', '交互原型', '可用性测试', '信息架构'] },
      { group: '协作', items: ['需求评审', '设计走查', '用户访谈'] }
    ],
    contact: {
      telegram: 'linshan_design'
    }
  },
  {
    candidateId: 'c3',
    profile:
      '8 年后端与全栈经验，长期做订单、库存与实时数据方向。熟悉 Java / Go / Node.js 三套栈，能独立完成接口设计、数据库建模与前端页面落地。关注稳定性与可观测性，习惯用压测和监控数据说话。',
    intent:
      '全栈工程师 / 后端架构；期望杭州或上海坐班，也可接受混合办公；看重工程规范与代码质量，倾向技术驱动、迭代节奏稳定的团队。',
    skills: [
      { group: '后端', items: ['Go', 'Java', 'Spring', 'Node.js', 'NestJS'] },
      { group: '数据', items: ['PostgreSQL', 'MySQL', 'Redis', 'Kafka', 'ClickHouse'] },
      { group: '前端', items: ['Vue', 'React', 'WebSocket', 'ECharts'] },
      { group: '工程', items: ['Docker', 'Kubernetes', 'CI/CD', '监控告警', '性能压测'] }
    ],
    contact: {
      phone: '186****3308'
    }
  }
]

export const resumeItemSeeds: ResumeItemSeed[] = [
  ...c1Items.map((item) => ({ ...item, candidateId: 'c1' })),
  ...c2Items.map((item) => ({ ...item, candidateId: 'c2' })),
  ...c3Items.map((item) => ({ ...item, candidateId: 'c3' }))
]
