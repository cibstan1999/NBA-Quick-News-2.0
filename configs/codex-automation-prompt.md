# Codex Automation 提示词

在仓库 `cibstan1999/NBA-Quick-News-2.0` 中执行一次 NBA 新闻编辑轮次。

必须严格遵守仓库根目录 `AGENTS.md`，并先读取：

- `configs/codex-workflow.json`
- `configs/codex-editorial-policy.md`
- `editorial/templates/current-post-template.md`
- `configs/team_map.json`
- `configs/glossary.json`
- `configs/blacklist.json`

执行步骤：

1. 使用 Gmail app 搜索带 `[NBA-Raw]` 标签，且没有 `[NBA-In-Review]`、`[NBA-Processed]`、`[NBA-Rejected]`、`[NBA-Needs-Review]` 的邮件；按时间从旧到新读取，最多处理配置规定的邮件数。
2. 从邮件正文解析每条素材的来源、英文标题、链接、发布时间、原始ID、素材指纹和正文。兼容旧邮件中缺少原始ID或素材指纹的情况，此时用 Gmail message ID + 链接生成稳定指纹。
3. 将本轮素材按同一事件分组，并与最近 7 天 `_posts/` 比较，完成跨来源和跨轮次去重。
4. 按编辑规则将每个事件判定为 FULL、BRIEF、REJECT 或 NEEDS_REVIEW。
5. FULL/BRIEF 必须复制 `editorial/templates/current-post-template.md` 的结构，只替换 Front Matter 值与新闻文字；不得自行设计文章结构。
6. 新稿先写入临时路径，不得直接写入 `_posts/`。
7. 对每篇候选稿运行 `node scripts/editorial-validate.js <临时稿路径>`。
8. 只有校验通过的稿件才允许移动到 `_posts/`。校验失败时不得发布，decision 标记为 `failed` 或 `hold`，并记录明确错误。
9. 不得修改 `_config.yml`、`_layouts/post.html`、Minima 主题、现有 CSS、字体、字号、颜色、行距、标题样式或标签样式。
10. 文章不得包含 `<style>`、`<font>`、`style=`、自定义 HTML 容器、class、id、额外 H1/H2、表格、引用块、折叠框或彩色提示框。
11. 三个固定标题必须严格保持 emoji、文字、Markdown 级别与顺序：
    - `### 📌 一句话速览`
    - `### ⚡ 核心细节拆解`
    - `### 📝 报道正文`
12. 来源区必须位于全文末尾；单来源沿用固定链接行，多来源沿用无序列表。
13. REJECT 写入 `logs/rejections/YYYY-MM-DD-codex-rejections.md`；每条记录保留来源、标题、链接、素材指纹和明确退稿原因。
14. 为本轮生成 `logs/codex-runs/YYYY-MM-DD-HHmmss.md`，记录 Gmail message ID、每条素材的决定、校验结果、生成文件和错误。
15. 根据 `publication_mode` 执行：
    - `draft_pr`：创建专用分支并提交 Draft PR，不直接改 main。
    - `direct`：校验通过后直接提交 main。
16. GitHub 操作成功后再修改 Gmail 标签：
    - Draft PR 中的已采用邮件：添加 `[NBA-In-Review]`，移除 `[NBA-Raw]`。
    - 已进入 main 的邮件：添加 `[NBA-Processed]`，移除其他流程标签。
    - 全部素材均被拒绝的邮件：添加 `[NBA-Rejected]`，移除 `[NBA-Raw]`。
    - 解析失败、事实矛盾、权限失败或格式校验失败：添加 `[NBA-Needs-Review]`，保留运行日志。
17. 开始新一轮前，检查 `[NBA-In-Review]`：对应 PR 已合并则改为 `[NBA-Processed]`；PR 被关闭且未合并则恢复 `[NBA-Raw]`。

没有合格内容时不要硬写文章。不得改动 GAS、网站模板、密钥或与本轮新闻无关的文件。

任务完成后，只汇报：读取邮件数、素材数、发布数、拒绝数、待人工数、格式校验结果、PR/提交链接和异常。
