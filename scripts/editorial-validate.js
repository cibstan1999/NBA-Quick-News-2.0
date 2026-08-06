#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = [
  'layout', 'title', 'date', 'categories', 'tags', 'news_type',
  'source_name', 'source_title', 'source_url', 'event_core', 'event_key',
  'event_hash', 'event_type', 'event_stage', 'canonical_topic'
];

const HEADINGS = [
  '### 📌 一句话速览',
  '### ⚡ 核心细节拆解',
  '### 📝 报道正文'
];

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function parseFrontMatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const values = {};
  match[1].split('\n').forEach((line) => {
    const index = line.indexOf(':');
    if (index > 0) values[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  });
  return { raw: match[1], values, body: text.slice(match[0].length) };
}

function validate(filePath) {
  const text = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  const frontMatter = parseFrontMatter(text);

  if (!frontMatter) {
    fail(`${filePath}: 缺少合法 Front Matter`);
    return;
  }

  REQUIRED_FIELDS.forEach((field) => {
    if (!(field in frontMatter.values)) fail(`${filePath}: 缺少 Front Matter 字段 ${field}`);
  });

  if (frontMatter.values.layout !== 'post') fail(`${filePath}: layout 必须为 post`);
  if (frontMatter.values.categories !== '[nba, news]') {
    fail(`${filePath}: categories 必须严格为 [nba, news]`);
  }

  const eventHash = String(frontMatter.values.event_hash || '')
    .replace(/^["']|["']$/g, '');
  if (!/^[0-9a-f]{8}$/.test(eventHash)) {
    fail(`${filePath}: event_hash 必须是 8 位小写十六进制`);
  }

  const forbidden = [
    /<style\b/i, /<font\b/i, /\sstyle\s*=/i,
    /class\s*=/i, /id\s*=/i, /font-family\s*:/i,
    /font-size\s*:/i, /line-height\s*:/i, /color\s*:/i,
    /<div\b/i, /<section\b/i, /<aside\b/i, /<details\b/i,
    /^#\s+/m, /^##\s+/m, /^>\s+/m, /^\|.*\|\s*$/m
  ];
  forbidden.forEach((pattern) => {
    if (pattern.test(frontMatter.body)) fail(`${filePath}: 包含禁止的样式或结构 ${pattern}`);
  });

  const positions = HEADINGS.map((heading) => frontMatter.body.indexOf(heading));
  HEADINGS.forEach((heading, index) => {
    const count = frontMatter.body.split(heading).length - 1;
    if (count !== 1) fail(`${filePath}: 标题“${heading}”必须且只能出现一次`);
    if (positions[index] < 0) fail(`${filePath}: 缺少固定标题“${heading}”`);
  });
  if (!(positions[0] < positions[1] && positions[1] < positions[2])) {
    fail(`${filePath}: 三个固定标题顺序错误`);
  }

  if (!/### 📌 一句话速览\n\n\S/.test(frontMatter.body)) {
    fail(`${filePath}: 一句话速览标题后必须空一行并包含摘要`);
  }
  if (!/### ⚡ 核心细节拆解\n\n-\s+\S/.test(frontMatter.body)) {
    fail(`${filePath}: 核心细节必须使用项目符号`);
  }
  if (!/### 📝 报道正文\n\n\S/.test(frontMatter.body)) {
    fail(`${filePath}: 报道正文标题后必须空一行`);
  }

  const trimmed = frontMatter.body.trim();
  const singleSource = /---\n🌐 \*\*原文来源\*\*：\[[^\]]+\]\([^\)]+\)$/.test(trimmed);
  const multiSource = /---\n🌐 \*\*原文来源\*\*：\n(?:- \[[^\]]+\]\([^\)]+\)\n?)+$/.test(trimmed);
  if (!singleSource && !multiSource) {
    fail(`${filePath}: 来源区缺失、格式错误或不在全文末尾`);
  }

  const bodySection = trimmed.split('### 📝 报道正文')[1] || '';
  const beforeSource = bodySection.split('\n---\n🌐 **原文来源**')[0] || '';
  const paragraphs = beforeSource.trim().split(/\n\s*\n/).filter(Boolean);
  if (paragraphs.length < 1) fail(`${filePath}: 正文为空`);
  if (beforeSource.trim().length > 300 && paragraphs.length === 1) {
    fail(`${filePath}: 长正文不得挤成单一段落`);
  }

  if (!process.exitCode) console.log(`✅ ${filePath}: 格式校验通过`);
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error('用法：node scripts/editorial-validate.js <文章.md> [更多文章.md]');
  process.exit(2);
}

files.forEach((file) => {
  const resolved = path.resolve(file);
  if (!fs.existsSync(resolved)) fail(`${file}: 文件不存在`);
  else validate(resolved);
});
