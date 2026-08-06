# 🏀 NBA Quick News 2.0

> 从英文 NBA 信息流中，筛出真正值得中文球迷阅读和保存的内容。

## 当前架构

```text
ESPN / RealGM RSS
        ↓
Google Apps Script
抓取、清洗、基础去重
        ↓
Gmail [NBA-Raw]
原料队列
        ↓
Codex Automation
精筛、事件去重、中文写稿、质量校验
        ↓
GitHub Draft PR / main
        ↓
GitHub Pages
```

项目已经从“GAS 内直接调用 Gemini”调整为“GAS 搬运原料，Codex 担任中文编辑”。网站模板、Jekyll `_posts/` 和 GitHub Pages 发布方式保持不变。

## 产品原则

**宁缺毋滥。**

我们拒绝：

- 非 NBA 内容
- 球员私人生活与花边
- 博彩、链接汇总和社交媒体琐事
- 无事实依据的交易幻想
- 同一事件换标题、换来源后的重复稿
- 为了数量硬拉成长文的低价值简讯

我们优先关注：

- 交易、签约、续约与阵容变化
- 核心伤病、复出和纪律事件
- 选秀、联盟政策与劳资规则
- 管理层、球队经营和联盟商业生态
- 具有持续影响的趋势与重大人物动态

判断标准：

> 半年后，一位 NBA 球迷重新打开这篇文章，还觉得值得阅读吗？

## 技术分工

| 组件 | 职责 |
|---|---|
| Google Apps Script | 抓 RSS、清洗、基础去重、发送 Gmail 原料 |
| Gmail | `[NBA-Raw]` 原料队列与处理状态 |
| Codex Automation | 精筛、合并事件、写中文、校验、提交 |
| GitHub | 内容版本管理、Draft PR、退稿与运行日志 |
| GitHub Pages | 静态网站展示 |

## 目录

```text
├── AGENTS.md                         # Codex 仓库级工作规则
├── GAS/weekly-release/
│   └── always-latest-GAS             # 当前 RSS → Gmail 采集器
├── configs/
│   ├── codex-workflow.json           # 运行模式与限额
│   ├── codex-editorial-policy.md      # NBA 中文编辑标准
│   ├── codex-automation-prompt.md     # 已安排任务提示词
│   ├── blacklist.json
│   ├── glossary.json
│   └── team_map.json
├── docs/
│   └── CODEX-GMAIL-WORKFLOW.md        # 部署、验收和回滚
├── logs/
│   ├── codex-runs/                    # Codex 每轮运行记录
│   └── rejections/                    # 退稿档案
└── _posts/                            # GitHub Pages 中文文章
```

## 发布策略

当前默认是安全试运行：

```json
"publication_mode": "draft_pr"
```

Codex 先生成 Draft PR，人工检查后合并。稳定后改成 `direct`，即可直接写入 `main` 并由 GitHub Pages 发布。

详细部署方法见 [`docs/CODEX-GMAIL-WORKFLOW.md`](docs/CODEX-GMAIL-WORKFLOW.md)。

## 开发原则

- GAS 保持简单，只做确定性的力气活。
- Codex 负责需要理解、判断和写作的工作。
- 所有处理结果都能在 Gmail 标签、GitHub 提交和日志中追踪。
- 不为了技术炫技增加数据库或额外付费服务。
- 任何自动化都必须可以暂停、回滚和人工接管。
