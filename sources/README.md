# Sources

本目录用于承载 Codex 编辑流水线的新闻原料与待人工复核内容。

- `inbox/`：GAS 写入的临时待处理 JSON 队列。
- `needs-review/`：无法自动确认、需要人工复核的素材。

`inbox` 中的 JSON 在 Codex 完成处理、PR 校验通过并合并后会从 `main` 删除，避免重复处理。文件虽然不再出现在 `main`，但仍保留在对应的 Git 提交历史中。
