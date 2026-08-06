#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');

const baseSha = process.env.BASE_SHA;
const headSha = process.env.HEAD_SHA || 'HEAD';
const headRef = process.env.HEAD_REF || '';
const isCodexPr = headRef.startsWith('codex/inbox-');

if (!baseSha) {
  console.error('❌ 缺少 BASE_SHA');
  process.exit(2);
}

const errors = [];
const warn = (message) => console.log(`⚠️ ${message}`);
const fail = (message) => errors.push(message);

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function parseChangedFiles() {
  const output = git([
    'diff',
    '--name-status',
    '--find-renames=50%',
    baseSha,
    headSha
  ]);

  if (!output) return [];

  return output.split('\n').filter(Boolean).map((line) => {
    const parts = line.split('\t');
    const status = parts[0];

    if (status.startsWith('R')) {
      return { status: 'R', oldPath: parts[1], path: parts[2] };
    }

    return { status: status[0], path: parts[1] };
  });
}

function parseFrontMatter(text) {
  const normalized = text.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return {};

  const values = {};
  match[1].split('\n').forEach((line) => {
    const index = line.indexOf(':');
    if (index > 0) {
      values[line.slice(0, index).trim()] = line.slice(index + 1).trim();
    }
  });

  return values;
}

function runArticleValidator(files) {
  if (!files.length) return;

  const result = spawnSync(
    process.execPath,
    ['scripts/editorial-validate.js', ...files],
    { stdio: 'inherit' }
  );

  if (result.status !== 0) {
    fail('至少一篇文章未通过 scripts/editorial-validate.js');
  }
}

const changes = parseChangedFiles();
const destinationPaths = changes.map((entry) => entry.path);
const changedPosts = changes
  .filter((entry) => entry.path.startsWith('_posts/') && entry.status !== 'D')
  .map((entry) => entry.path);

console.log(`ℹ️ PR 分支：${headRef || '未知'}`);
console.log(`ℹ️ 变更文件：${changes.length}`);
console.log(`ℹ️ 新增或修改文章：${changedPosts.length}`);

runArticleValidator(changedPosts);

for (const postPath of changedPosts) {
  const filename = path.basename(postPath);
  const expectedPattern = /^\d{4}-\d{2}-\d{2}-nba-news-\d{6}-([0-9a-f]{8})-([0-9a-f]{8})\.md$/;
  const match = filename.match(expectedPattern);

  if (!match) {
    fail(`${postPath}: 文件名不符合固定规则`);
    continue;
  }

  if (match[2] === 'a1b2c3d4' || match[2] === '12345678' || match[2] === 'deadbeef') {
    fail(`${postPath}: 文件名包含模板占位符`);
  }

  const content = fs.readFileSync(postPath, 'utf8');
  const frontMatter = parseFrontMatter(content);
  const eventHash = String(frontMatter.event_hash || '').replace(/^['"]|['"]$/g, '');

  if (!/^[0-9a-f]{8}$/.test(eventHash)) {
    fail(`${postPath}: event_hash 必须是 8 位小写十六进制`);
  } else if (eventHash !== match[1]) {
    fail(`${postPath}: 文件名中的 event_hash 与 Front Matter 不一致`);
  }

  const sourceUrl = String(frontMatter.source_url || '').replace(/^['"]|['"]$/g, '');
  if (!/^https:\/\//i.test(sourceUrl)) {
    fail(`${postPath}: source_url 必须是 HTTPS 链接`);
  }
}

if (isCodexPr) {
  const allowedPrefixes = [
    '_posts/',
    'logs/rejections/',
    'logs/codex-runs/',
    'sources/inbox/',
    'sources/needs-review/'
  ];

  for (const entry of changes) {
    const touchedPaths = [entry.path];
    if (entry.oldPath) touchedPaths.push(entry.oldPath);

    for (const touchedPath of touchedPaths) {
      if (!allowedPrefixes.some((prefix) => touchedPath.startsWith(prefix))) {
        fail(`Codex 新闻 PR 不得修改无关文件：${touchedPath}`);
      }
    }

    if (entry.path.startsWith('_posts/') && entry.status !== 'A') {
      fail(`Codex 新闻 PR 只能新增文章，不得修改或删除历史文章：${entry.path}`);
    }

    if (entry.path.startsWith('sources/inbox/') && entry.status === 'A') {
      fail(`Codex 新闻 PR 不得新增 Inbox 原料：${entry.path}`);
    }
  }

  if (changedPosts.length > 4) {
    fail(`单轮最多发布 4 篇，当前为 ${changedPosts.length} 篇`);
  }

  const runLogs = destinationPaths.filter((file) => file.startsWith('logs/codex-runs/'));
  if (!runLogs.length) {
    fail('Codex 新闻 PR 必须包含 logs/codex-runs/ 运行日志');
  }

  const consumedInbox = changes.filter((entry) => {
    if (entry.status === 'D') return entry.path.startsWith('sources/inbox/');
    if (entry.status === 'R') return entry.oldPath && entry.oldPath.startsWith('sources/inbox/');
    return false;
  });

  if (!consumedInbox.length) {
    fail('Codex 新闻 PR 必须删除或移动至少一个已处理 Inbox JSON');
  }

  if (!changedPosts.length) {
    const hasRejection = destinationPaths.some((file) => file.startsWith('logs/rejections/'));
    const hasNeedsReview = destinationPaths.some((file) => file.startsWith('sources/needs-review/'));

    if (!hasRejection && !hasNeedsReview) {
      fail('无发布文章时，PR 必须包含退稿记录或 needs-review 文件');
    }
  }
}

if (errors.length) {
  console.error('\n❌ 自动内容校验失败：');
  errors.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

if (!changes.length) warn('本次 PR 没有可识别的文件差异');
console.log('\n✅ PR 自动内容校验通过');
