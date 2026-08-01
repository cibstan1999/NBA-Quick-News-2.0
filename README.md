# 🏀 NBA Quick News 2.0

## AI-Powered NBA Digital Editorial System

> **From endless information noise to curated basketball stories.**
> 让 AI 从 NBA 信息垃圾堆中，筛选出真正值得保存的内容。

---

## 📖 项目介绍

NBA Quick News 2.0 是一个基于 Google Apps Script + Gemini AI + GitHub Pages 构建的自动化 NBA 新闻编辑系统。

它不是一个简单的 RSS 翻译机器人。

它更像一个拥有编辑标准的数字媒体团队：

```
RSS 新闻源
    ↓
自动抓取
    ↓
规则过滤
    ↓
Gemini AI 资深编辑审核
    ↓
精品内容编译
    ↓
GitHub 自动发布
    ↓
NBA 数字新闻站
```

核心理念：

> **宁缺毋滥。**

每天 NBA 会产生大量新闻，但真正值得球迷在半年、一年后重新阅读的内容并不多。

NBA Quick News 2.0 的目标不是制造更多文章，而是筛选更有价值的文章。

---

# 🎯 产品理念

## ❌ 不做什么

我们拒绝：

* 球员日常采访流水账
* 双向合同、小额签约新闻
* 自媒体交易幻想
* 无事实依据的流言
* 标题党内容
* 没有长期保存价值的信息噪音

---

## ✅ 我们关注什么

系统优先关注：

* 超级球星交易与续约
* 核心球员重大伤病
* 球队管理层变化
* 重要阵容调整
* NBA 官方政策变化
* 具有长期历史价值的新闻事件

判断标准：

> “半年后，一位 NBA 球迷重新打开这篇文章，还觉得值得阅读吗？”

---

# 🤖 Gemini AI 编辑系统

NBA Quick News 2.0 使用 Gemini 作为核心内容编辑。

但 Gemini 不负责简单翻译。

它承担的是：

## 第一层：新闻价值判断

AI 首先判断：

* 是否是真正 NBA 新闻
* 是否具有新闻价值
* 是否值得消耗一次生成资源

如果质量不足：

```
isPass = false
```

直接拒绝。

---

## 第二层：专业内容编译

通过审核后，Gemini 才会生成：

* 中文标题
* 一句话速览
* 核心事件拆解
* 专业中文报道正文

---

## 第三层：持续成长

Gemini Prompt 会持续迭代。

每周根据实际发布结果：

* 分析错误
* 修正判断标准
* 优化编辑能力

目标：

> 让 AI 从新闻搬运工，成长为真正的 NBA 数字编辑。

---

# 🏗️ 当前技术架构

## 数据来源

目前支持：

* RealGM NBA RSS
* Yahoo Sports NBA RSS

未来可以根据需求扩展更多可靠来源。

---

## 自动化流程

```
Google Apps Script

        |
        ↓

RSS Collector

        |
        ↓

Content Filter

        |
        ↓

Duplicate Detection

        |
        ↓

Gemini AI Editor

        |
        ↓

Markdown Generator

        |
        ↓

GitHub Repository

        |
        ↓

GitHub Pages Website
```

---

# 🛠️ 技术栈

| 组件                 | 用途        |
| ------------------ | --------- |
| Google Apps Script | 自动化任务调度   |
| Gemini API         | AI 新闻编辑   |
| GitHub             | 代码与内容版本管理 |
| GitHub Pages       | 静态网站展示    |
| Markdown           | 文章发布格式    |

---

# 📂 项目结构

```
NBA-Quick-News-2.0

├── GAS
│   └── weekly-release
│       └── NBA-Quick-News-2.0-Production-Stable.gs
│
├── _posts
│   └── NBA 新闻文章
│
├── configs
│   ├── blacklist.json
│   ├── team_map.json
│   └── glossary.json
│
└── README.md
```

---

# 📈 版本策略

NBA Quick News 采用稳定迭代模式：

## 2.0 Stable

目标：

* 跑通完整自动化流程
* 建立 AI 编辑标准
* 优化新闻质量

---

## 3.0 Beta（未来）

计划方向：

* 更强的数据管理
* Cloudflare 边缘架构
* 更完善的内容服务能力

但原则不变：

> 技术服务产品，而不是为了技术增加复杂度。

---

# 🧠 开发原则

## 1. 简单优先

拒绝：

* 不必要的服务
* 复杂架构
* 为了展示而增加的功能

---

## 2. 数据驱动迭代

所有优化基于真实运行结果：

观察：

* 哪些新闻被拒绝
* 哪些文章质量不足
* 哪些 Prompt 需要调整

---

## 3. AI 是助手，不是作者

AI 提供：

* 信息整理能力
* 内容加工能力
* 初步判断能力

最终产品标准来自：

* 编辑理念
* 用户体验
* 长期价值判断

---

# 🌟 Project Vision

互联网每天产生大量信息。

真正困难的事情不是找到新闻。

而是：

> 在信息洪流中，找到值得留下来的那几篇。

NBA Quick News 2.0，希望成为一个小而精的 AI NBA 数字编辑部。

少一点噪音。

多一点价值。

🏀
