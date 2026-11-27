# jobpilot

求职助手桌面应用：自动发现工作机会、按 JD 定制投递材料、辅助完成投递并全程留痕。

技术栈：Electron 45 + React 19 + TypeScript + Tailwind 4 + SQLite（better-sqlite3）+ Drizzle ORM，交付 Windows / macOS 双端。

## 快速开始

```bash
pnpm install
pnpm dev          # 启动 Vite + Electron
pnpm typecheck    # 主进程 + 渲染层双配置类型检查
pnpm build        # 构建到 src/apps/desktop/out
```

本机 shell 若带 `ELECTRON_RUN_AS_NODE=1`（例如在 WorkBuddy 内运行 Electron 脚本），需先 `unset ELECTRON_RUN_AS_NODE`。

## 目录约定

```
src/        源代码
  apps/     可运行的应用（Electron 壳、渲染进程）
  packages/ 可独立测试、可独立演进的领域模块
docs/       设计文档：需求、数据模型、接口契约、决策记录
scripts/    构建、打包、自动化脚本
```

## 分层原则

- `src/packages/core` 不依赖任何 Electron API，可脱离桌面壳单独运行测试。
- 浏览器自动化放在独立子进程（sidecar）中，不与 Electron 主进程共享事件循环。
- 简历正文只存本地，不上传云端。

## 数据层

SQLite 库在 `app.getPath('userData')/jobpilot.db`，启动时建表并执行迁移，仅在空库时写入示例数据。渲染层不碰 SQL：主进程通过 `window.jobpilot.db` 暴露一次全量读和 8 个写通道，写操作先落库再回传新快照。

- 改表：`pnpm --filter @jobpilot/desktop db:generate`，再把新 SQL 追加进 `src/apps/desktop/src/main/db/migrations.ts`
- 重置示例数据：应用内「设置 → 数据与存储」，或 `env -u ELECTRON_RUN_AS_NODE ./node_modules/.bin/electron scripts/db-reset.cjs`
- `screenshots/` 是本地验证资产，不入库、不推送

## 当前状态

界面与数据层已打通：概览、岗位池、投递、沟通、面试邀约、求职者、设置共 7 个页面可运行，数据来自示例库，中英双语与明暗主题齐备。

尚未接真实数据源与大模型：岗位抓取、JD 解析、简历解析、邮件投递仍是界面占位；「让模型起草」「加入日历」「改期」暂只弹提示。详见 `docs/01-需求与架构方案.md`。

## 提交约定

Conventional Commits + 中文描述，按可独立说明的阶段提交。本机 `post-commit` 钩子会在每次提交后自动 `git push origin <当前分支>`；钩子位于 `.git/hooks/`，不入库。
