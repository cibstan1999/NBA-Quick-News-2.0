# Gmail + Codex + GitHub Pages 工作流

## 架构

```text
ESPN / RealGM RSS
        ↓
Google Apps Script
抓取、清洗、基础去重
        ↓
Gmail 标签 [NBA-Raw]
        ↓
Codex Automation
精筛、跨来源去重、中文写稿、校验
        ↓
Draft PR（试运行）或 main（稳定后）
        ↓
GitHub Pages
```

## 组件职责

### GAS

只负责：

- 定时抓取 RSS
- 提取标题、链接、发布时间和 RSS 正文/摘要
- 清洗 HTML
- 使用 `PROCESSED_IDS` 避免重复投递
- 发送主题以 `[NBA-Raw]` 开头的邮件

GAS 不再调用 Gemini，也不再直接生成中文稿。

### Gmail

Gmail 是原料队列和状态面板：

- `[NBA-Raw]`：待处理
- `[NBA-In-Review]`：已进入 Draft PR
- `[NBA-Processed]`：已发布
- `[NBA-Rejected]`：已退稿
- `[NBA-Needs-Review]`：需要人工检查

### Codex

Codex 负责：

- 读取 Gmail 原料
- NBA 边界判断
- 新闻价值筛选
- 跨来源与历史文章去重
- 中文编译与格式校验
- 创建文章、退稿日志和运行日志
- 创建 Draft PR 或提交 main
- 在 GitHub 成功后更新 Gmail 标签

### GitHub Pages

继续使用现有 Jekyll 模板和 `_posts/`，无需更换网站结构。

## 首周运行策略

`configs/codex-workflow.json` 默认使用：

```json
"publication_mode": "draft_pr"
```

因此 Codex 首周只创建 Draft PR。人工检查并合并后，下一轮会把对应邮件转为 `[NBA-Processed]`。

稳定后把配置改成：

```json
"publication_mode": "direct"
```

之后 Codex 可直接提交 `main`，GitHub Pages 自动发布。

## 故障与回滚

- GAS 出错：不会产生新邮件，网站不受影响。
- Codex 出错：邮件进入 `[NBA-Needs-Review]`，不得假装处理成功。
- PR 内容错误：关闭 PR，下一轮恢复 `[NBA-Raw]`。
- 直接发布错误：删除对应 `_posts` 文件或回退该次提交。
- 需要临时停机：暂停 GAS 触发器或禁用 Codex Automation；历史邮件和文章不受影响。

## 上线验收

1. 手工运行 `checkRssCollector()`，确认两个源返回 HTTP 200。
2. 手工运行一次 `aggregateRssToGmail()`，确认邮件进入 `[NBA-Raw]`。
3. 手工运行一次 Codex Automation，确认能读取 Gmail、创建 Draft PR 和修改标签。
4. 检查 Draft PR 中的 Front Matter、中文事实、标签、原文链接和去重结果。
5. 合并 PR，等待下一轮确认 Gmail 状态变为 `[NBA-Processed]`。
