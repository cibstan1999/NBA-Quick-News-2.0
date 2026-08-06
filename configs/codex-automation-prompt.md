# Codex Automation 提示词

在仓库 `cibstan1999/NBA-Quick-News-2.0` 中执行一次 NBA 新闻编辑轮次。

必须严格遵守仓库根目录 `AGENTS.md`，并先读取：

- `configs/codex-workflow.json`
- `configs/codex-editorial-policy.md`
- `configs/team_map.json`
- `configs/glossary.json`
- `configs/blacklist.json`

执行步骤：

1. 使用 Gmail app 搜索带 `[NBA-Raw]` 标签，且没有 `[NBA-In-Review]`、`[NBA-Processed]`、`[NBA-Rejected]`、`[NBA-Needs-Review]` 的邮件；按时间从旧到新读取，最多处理配置规定的邮件数。
2. 从邮件正文解析每条素材的来源、英文标题、链接、发布时间、原始ID、素材指纹和正文。兼容旧邮件中缺少原始ID或素材指纹的情况，此时用 Gmail message ID + 链接生成稳定指纹。
3. 将本轮素材按同一事件分组，并与最近 7 天 `_posts/` 比较，完成跨来源和跨轮次去重。
4. 按编辑规则将每个事件判定为 FULL、BRIEF、REJECT 或 NEEDS_REVIEW。
5. FULL/BRIEF 生成符合现有网站格式的中文 Markdown；每轮最多发布配置规定的篇数。
6. REJECT 写入 `logs/rejections/YYYY-MM-DD-codex-rejections.md`；每条记录保留来源、标题、链接、素材指纹和明确退稿原因。
7. 为本轮生成 `logs/codex-runs/YYYY-MM-DD-HHmmss.md`，记录 Gmail message ID、每条素材的决定、生成文件和错误。
8. 根据 `publication_mode` 执行：
   - `draft_pr`：创建专用分支并提交 Draft PR，不直接改 main。
   - `direct`：校验通过后直接提交 main。
9. GitHub 操作成功后再修改 Gmail 标签：
   - Draft PR 中的已采用邮件：添加 `[NBA-In-Review]`，移除 `[NBA-Raw]`。
   - 已进入 main 的邮件：添加 `[NBA-Processed]`，移除其他流程标签。
   - 全部素材均被拒绝的邮件：添加 `[NBA-Rejected]`，移除 `[NBA-Raw]`。
   - 解析失败、事实矛盾或权限失败：添加 `[NBA-Needs-Review]`，保留可追踪的运行日志。
10. 开始新一轮前，检查 `[NBA-In-Review]`：对应 PR 已合并则改为 `[NBA-Processed]`；PR 被关闭且未合并则恢复 `[NBA-Raw]`。

没有合格内容时不要硬写文章。不得改动 GAS、网站模板、密钥或与本轮新闻无关的文件。

任务完成后，只汇报：读取邮件数、素材数、发布数、拒绝数、待人工数、PR/提交链接和异常。
