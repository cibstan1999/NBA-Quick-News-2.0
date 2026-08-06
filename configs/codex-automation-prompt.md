# Codex Automation 提示词

在仓库 `cibstan1999/NBA-Quick-News-2.0` 中执行一次 NBA 新闻编辑轮次。

必须严格遵守仓库根目录 `AGENTS.md`。完整新闻原料只认 `sources/inbox/**/*.json`；Gmail 仅用于通知，不得读取 Gmail 正文，不得修改 Gmail 标签。

仅在确认存在待处理 Inbox JSON 后，读取：

- `configs/codex-workflow.json`
- `configs/codex-editorial-policy.md`
- `editorial/templates/current-post-template.md`
- `configs/team_map.json`
- `configs/glossary.json`
- `configs/blacklist.json`
- 最近 7 天与当前事件相关的 `_posts/`

## 执行步骤

1. 从 `main` 扫描 `sources/inbox/**/*.json`，只处理 `status: pending` 或没有 `status` 的文件；按时间从旧到新，每轮最多读取配置规定的文件数和素材数。
2. 检查开放的 `codex/inbox-*` Draft PR，跳过已被其他 PR 占用、删除或移动的 Inbox 文件，禁止重复出稿。
3. 解析来源、英文标题、链接、发布时间、素材指纹和正文；按事件分组，并与最近 7 天文章执行跨来源和跨轮次去重。
4. 每个事件只能判定为 `FULL`、`BRIEF`、`REJECT` 或 `NEEDS_REVIEW`。没有合格内容时不得硬写。
5. FULL/BRIEF 必须复制 `editorial/templates/current-post-template.md` 的结构，只替换 Front Matter 和正文内容。
6. `event_hash` 是上线硬约束：必须是 **8 位小写十六进制**，正则为 `^[0-9a-f]{8}$`。生成更长哈希时只取前 8 位。
7. 文章文件名必须是：

   `YYYY-MM-DD-nba-news-HHmmss-<8位event_hash>-<素材指纹后8位>.md`

   文件名中的 `event_hash` 必须与 Front Matter 的 `event_hash` 完全一致。禁止生成 12 位哈希，禁止使用模板占位符。
8. 新稿先写入临时路径，并运行：

   `node scripts/editorial-validate.js <临时稿路径>`

9. 本地校验通过后才允许移动到 `_posts/`。若运行环境无法执行本地 Git/Node，写入 Draft PR 前仍必须逐项完成等价预检，至少检查：
   - 文件名符合固定正则；
   - 两段哈希均为 8 位小写十六进制；
   - Front Matter `event_hash` 与文件名一致；
   - `source_url` 为 HTTPS；
   - 固定三级标题、来源区和 Front Matter 字段完整。
10. REJECT 写入 `logs/rejections/`；NEEDS_REVIEW 写入 `sources/needs-review/`；每轮写入 `logs/codex-runs/`。
11. 按 `publication_mode: draft_pr` 创建 `codex/inbox-` 专用分支和 Draft PR，不得直接修改 `main`。
12. 同一 PR 中必须包含：候选文章、运行日志、退稿或待人工记录，以及删除已处理 Inbox JSON。
13. 创建 PR 后等待 `Editorial PR Validation`；只有校验成功后才允许 `Auto Merge Codex PR` 自动合并并启动 Pages。
14. 校验失败、超时、冲突或未运行时，保留 Draft PR，交由 `Editorial Recovery Watchdog` 自动恢复；不得绕过检查强行合并。

## 禁止事项

- 不得修改 GAS、RSS、GitHub Actions、网站模板、CSS、主题或历史文章。
- 文章不得包含自定义 CSS、内联样式、自定义 HTML 容器、额外 H1/H2、表格、引用块或折叠框。
- 不得猜测缺失事实，不得把传闻改写为官宣，不得把评论稿当作新事件。
- 不得因为本地 DNS 或 GitHub 临时异常而放宽文件名、哈希、模板或事实标准。

任务完成后仅汇报：读取 Inbox 文件数、素材数、发布数、拒绝数、待人工数、预检/校验结果、Draft PR 链接和异常。
