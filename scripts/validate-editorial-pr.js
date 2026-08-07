#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');

const HISTORY_WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const TOKEN_ALIASES = new Map([
  ['sponsor', 'sponsorship'],
  ['sponsored', 'sponsorship'],
  ['endorse', 'sponsorship'],
  ['endorsed', 'sponsorship'],
  ['endorsement', 'sponsorship'],
  ['probe', 'investigation'],
  ['investigate', 'investigation'],
  ['investigated', 'investigation'],
  ['inquiry', 'investigation'],
  ['sign', 'signing'],
  ['signs', 'signing'],
  ['signed', 'signing'],
  ['contract', 'signing'],
  ['contracts', 'signing'],
  ['agreement', 'signing'],
  ['deal', 'signing'],
  ['deals', 'signing'],
  ['stash', 'overseas'],
  ['stashed', 'overseas'],
  ['remain', 'overseas'],
  ['remains', 'overseas'],
  ['remaining', 'overseas'],
  ['stay', 'overseas'],
  ['stays', 'overseas'],
  ['traded', 'trade'],
  ['trades', 'trade'],
  ['acquire', 'trade'],
  ['acquired', 'trade'],
  ['injured', 'injury'],
  ['diagnosis', 'injury'],
  ['diagnosed', 'injury'],
  ['ruled', 'ruling'],
  ['verdict', 'ruling'],
  ['penalty', 'ruling'],
  ['fined', 'ruling'],
  ['suspended', 'ruling'],
  ['returns', 'return'],
  ['returned', 'return'],
  ['comeback', 'return']
]);

const ACTION_TOKENS = new Set([
  'sponsorship',
  'investigation',
  'signing',
  'overseas',
  'draft',
  'trade',
  'injury',
  'ruling',
  'return',
  'waive',
  'waived',
  'release',
  'released',
  'extension',
  'retirement'
]);

const LOW_INFORMATION_TOKENS = new Set([
  'a', 'an', 'and', 'at', 'by', 'for', 'from', 'in', 'latest', 'league',
  'nba', 'new', 'news', 'next', 'of', 'on', 'per', 'player', 'report',
  'reported', 'reportedly', 'says', 'season', 'source', 'team', 'the',
  'this', 'to', 'update', 'with', 'year', 'years',
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten'
]);

const CHINESE_ACTION_PATTERNS = [
  ['sponsorship', /赞助|代言/],
  ['investigation', /调查|审查/],
  ['signing', /签约|签下|合同|协议/],
  ['overseas', /留欧|海外留存|留在(?:欧洲|柏林)|继续.{0,8}效力/],
  ['draft', /选秀|新秀|签约权/],
  ['trade', /交易|换来|送走/],
  ['injury', /伤病|受伤|诊断|骨折|撕裂|手术/],
  ['ruling', /裁决|处罚|罚款|禁赛|调查结论|正式认定/],
  ['return', /复出|回归/]
];

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function stripQuotes(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '');
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

function normalizeTokens(value) {
  const normalized = stripQuotes(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\b20\d{2}[-/]\d{1,2}[-/]\d{1,2}\b/g, ' ')
    .replace(/\b20\d{2}[-/]\d{1,2}\b/g, ' ')
    .replace(/\b20\d{2}\b/g, ' ');

  return normalized
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((token) => TOKEN_ALIASES.get(token) || token)
    .filter((token) => !LOW_INFORMATION_TOKENS.has(token));
}

function eventText(frontMatter) {
  return [
    frontMatter.event_key,
    frontMatter.canonical_topic,
    frontMatter.event_core,
    frontMatter.title
  ].map(stripQuotes).filter(Boolean).join(' ');
}

function topicTokens(frontMatter) {
  return new Set(normalizeTokens([
    frontMatter.event_key,
    frontMatter.canonical_topic
  ].map(stripQuotes).join(' ')));
}

function entityTokens(frontMatter) {
  return new Set([...topicTokens(frontMatter)].filter((token) => (
    !ACTION_TOKENS.has(token) &&
    !/^\d+$/.test(token)
  )));
}

function actionTokens(frontMatter) {
  const actions = new Set(
    [...topicTokens(frontMatter)].filter((token) => ACTION_TOKENS.has(token))
  );
  const text = eventText(frontMatter).normalize('NFKC').toLowerCase();

  for (const [action, pattern] of CHINESE_ACTION_PATTERNS) {
    if (pattern.test(text)) actions.add(action);
  }

  for (const token of normalizeTokens(text)) {
    if (ACTION_TOKENS.has(token)) actions.add(token);
  }

  return actions;
}

function intersection(left, right) {
  return [...left].filter((value) => right.has(value));
}

function jaccard(left, right) {
  if (!left.size && !right.size) return 1;
  const shared = intersection(left, right).length;
  return shared / new Set([...left, ...right]).size;
}

function containment(left, right) {
  const smallest = Math.min(left.size, right.size);
  if (!smallest) return 0;
  return intersection(left, right).length / smallest;
}

function normalizeNarrative(value) {
  return stripQuotes(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/endorsement|sponsorship|sponsor(?:ed)?/g, 'sponsorship')
    .replace(/probe|investigation|inquiry/g, 'investigation')
    .replace(/signs?|signed|signing|contract|agreement/g, 'signing')
    .replace(/代言/g, '赞助')
    .replace(/签下|签署/g, '签约')
    .replace(/据报道|报道称|消息称|最新|此前|已经|确认/g, '')
    .replace(/20\d{2}(?:[-/]\d{1,2}){0,2}/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function bigrams(value) {
  const chars = [...value];
  if (chars.length < 2) return new Set(chars);
  return new Set(chars.slice(0, -1).map((char, index) => char + chars[index + 1]));
}

function diceSimilarity(left, right) {
  const leftGrams = bigrams(left);
  const rightGrams = bigrams(right);
  if (!leftGrams.size && !rightGrams.size) return 1;
  return (2 * intersection(leftGrams, rightGrams).length) /
    (leftGrams.size + rightGrams.size);
}

function narrativeSimilarity(left, right) {
  const leftCore = normalizeNarrative(left.event_core);
  const rightCore = normalizeNarrative(right.event_core);
  const leftTitle = normalizeNarrative(left.title);
  const rightTitle = normalizeNarrative(right.title);
  const combinedLeft = normalizeNarrative(`${left.event_core || ''} ${left.title || ''}`);
  const combinedRight = normalizeNarrative(`${right.event_core || ''} ${right.title || ''}`);

  return Math.max(
    diceSimilarity(leftCore, rightCore),
    diceSimilarity(leftTitle, rightTitle),
    diceSimilarity(combinedLeft, combinedRight)
  );
}

function normalizedIdentity(value) {
  return [...new Set(normalizeTokens(value))].sort().join('|');
}

function stageGroup(value) {
  const stage = stripQuotes(value).toLowerCase();
  if (/rumor|expected|projected|reported|alleged|agreement_reached/.test(stage)) {
    return 'preliminary';
  }
  if (/official|announced|signed|completed|confirmed/.test(stage)) {
    return 'official';
  }
  return stage;
}

function materialFactMarkers(frontMatter) {
  const text = eventText(frontMatter).normalize('NFKC').toLowerCase();
  const markers = new Set();
  const patterns = [
    /\$\s?\d+(?:\.\d+)?\s?(?:million|billion|m|b)\b/g,
    /\b\d+(?:\.\d+)?\s?(?:million|billion)\s?(?:dollars?)?\b/g,
    /\d+(?:\.\d+)?(?:万|亿)?美元/g,
    /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)[- ]year(?:s)?\b/g,
    /\d+年(?:合同|协议|期限)?/g,
    /\b(?:first|second)[- ]round(?: pick)?\b/g,
    /\b20\d{2} (?:first|second)[- ]round\b/g,
    /首轮签|次轮签|选秀权|互换权|受保护/g,
    /fracture|torn|tear|surgery|骨折|撕裂|手术|赛季报销/g
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      markers.add(match[0].replace(/\s+/g, ''));
    }
  }

  return markers;
}

function hasMaterialUpdate(historical, candidate) {
  if (
    stageGroup(historical.event_stage) === 'preliminary' &&
    stageGroup(candidate.event_stage) === 'official'
  ) {
    return true;
  }

  const oldActions = actionTokens(historical);
  const newActions = actionTokens(candidate);
  if (newActions.has('ruling') && !oldActions.has('ruling')) return true;

  const oldFacts = materialFactMarkers(historical);
  const newFacts = materialFactMarkers(candidate);
  return [...newFacts].some((fact) => !oldFacts.has(fact));
}

function compareEvents(candidate, historical) {
  if (hasMaterialUpdate(historical, candidate)) {
    return { duplicate: false, reasons: ['检测到实质阶段或事实更新'] };
  }

  const candidateKey = normalizedIdentity(candidate.event_key);
  const historicalKey = normalizedIdentity(historical.event_key);
  const candidateTopic = normalizedIdentity(candidate.canonical_topic);
  const historicalTopic = normalizedIdentity(historical.canonical_topic);
  const exactKey = candidateKey && candidateKey === historicalKey;
  const exactTopic = candidateTopic && candidateTopic === historicalTopic;
  const exactHash = stripQuotes(candidate.event_hash) &&
    stripQuotes(candidate.event_hash) === stripQuotes(historical.event_hash);

  if (exactHash || exactKey || exactTopic) {
    const exactReasons = [];
    if (exactHash) exactReasons.push('event_hash 相同');
    if (exactKey) exactReasons.push('标准化 event_key 相同');
    if (exactTopic) exactReasons.push('标准化 canonical_topic 相同');
    return { duplicate: true, reasons: exactReasons };
  }

  const candidateEntities = entityTokens(candidate);
  const historicalEntities = entityTokens(historical);
  const candidateActions = actionTokens(candidate);
  const historicalActions = actionTokens(historical);
  const sharedEntities = intersection(candidateEntities, historicalEntities).sort();
  const sharedActions = intersection(candidateActions, historicalActions).sort();
  const entityContainment = containment(candidateEntities, historicalEntities);
  const entityJaccard = jaccard(candidateEntities, historicalEntities);
  const topicJaccard = jaccard(topicTokens(candidate), topicTokens(historical));
  const textSimilarity = narrativeSimilarity(candidate, historical);

  const strongEntityMatch = sharedEntities.length >= 2 &&
    entityContainment >= 0.75 && entityJaccard >= 0.5;
  const strongEventMatch = sharedActions.length >= 2 || (
    sharedActions.length >= 1 &&
    (topicJaccard >= 0.5 || textSimilarity >= 0.35)
  );

  if (!strongEntityMatch || !strongEventMatch) {
    return { duplicate: false, reasons: [] };
  }

  return {
    duplicate: true,
    reasons: [
      `核心实体重合: ${sharedEntities.join(', ')}`,
      `事件动作重合: ${sharedActions.join(', ')}`,
      `实体覆盖率 ${entityContainment.toFixed(2)}`,
      `主题重合度 ${topicJaccard.toFixed(2)}`,
      `event_core/title 相似度 ${textSimilarity.toFixed(2)}`
    ]
  };
}

function postDate(postPath) {
  const match = path.basename(postPath).match(/^(\d{4})-(\d{2})-(\d{2})-/);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function withinHistoryWindow(candidatePath, historicalPath, days = HISTORY_WINDOW_DAYS) {
  const candidateDate = postDate(candidatePath);
  const historicalDate = postDate(historicalPath);
  if (candidateDate === null || historicalDate === null) return true;
  return Math.abs(candidateDate - historicalDate) <= days * DAY_MS;
}

function parseChangedFiles(baseSha, headSha) {
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

function runArticleValidator(files, fail) {
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

function validateHistoricalDuplicates(baseSha, headSha, addedPosts, fail) {
  if (!addedPosts.length) return;

  const historicalPaths = git([
    'ls-tree', '-r', '--name-only', baseSha, '--', '_posts'
  ]).split('\n').filter((postPath) => postPath.endsWith('.md'));
  const relevantPaths = historicalPaths.filter((historicalPath) => (
    addedPosts.some((candidatePath) => (
      withinHistoryWindow(candidatePath, historicalPath)
    ))
  ));
  const historicalArticles = relevantPaths.map((postPath) => ({
    path: postPath,
    frontMatter: parseFrontMatter(git(['show', `${baseSha}:${postPath}`]))
  }));
  const candidatesInThisPr = [];

  console.log(
    `🔎 历史事件去重：每篇新稿比较 main 基准中最近 ${HISTORY_WINDOW_DAYS} 天，` +
    `候选历史稿 ${historicalArticles.length} 篇`
  );

  for (const candidatePath of addedPosts) {
    const candidate = {
      path: candidatePath,
      frontMatter: parseFrontMatter(git(['show', `${headSha}:${candidatePath}`]))
    };
    const comparisonPool = [
      ...historicalArticles.filter((historical) => (
        withinHistoryWindow(candidate.path, historical.path)
      )),
      ...candidatesInThisPr
    ];

    for (const historical of comparisonPool) {
      const result = compareEvents(candidate.frontMatter, historical.frontMatter);
      if (!result.duplicate) continue;

      fail([
        'DUPLICATE EVENT',
        `新稿文件名: ${candidate.path}`,
        `命中的历史稿文件名: ${historical.path}`,
        `判重依据: ${result.reasons.join('；')}`
      ].join('\n'));
      break;
    }

    candidatesInThisPr.push(candidate);
  }
}

function main() {
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
  const changes = parseChangedFiles(baseSha, headSha);
  const destinationPaths = changes.map((entry) => entry.path);
  const changedPosts = changes
    .filter((entry) => entry.path.startsWith('_posts/') && entry.status !== 'D')
    .map((entry) => entry.path);
  const addedPosts = changes
    .filter((entry) => entry.path.startsWith('_posts/') && entry.status === 'A')
    .map((entry) => entry.path);

  console.log(`ℹ️ PR 分支：${headRef || '未知'}`);
  console.log(`ℹ️ 变更文件：${changes.length}`);
  console.log(`ℹ️ 新增或修改文章：${changedPosts.length}`);

  runArticleValidator(changedPosts, fail);

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
    const eventHash = stripQuotes(frontMatter.event_hash);

    if (!/^[0-9a-f]{8}$/.test(eventHash)) {
      fail(`${postPath}: event_hash 必须是 8 位小写十六进制`);
    } else if (eventHash !== match[1]) {
      fail(`${postPath}: 文件名中的 event_hash 与 Front Matter 不一致`);
    }

    const sourceUrl = stripQuotes(frontMatter.source_url);
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

    validateHistoricalDuplicates(baseSha, headSha, addedPosts, fail);
  }

  if (errors.length) {
    console.error('\n❌ 自动内容校验失败：');
    errors.forEach((message) => console.error(`- ${message}`));
    process.exit(1);
  }

  if (!changes.length) warn('本次 PR 没有可识别的文件差异');
  console.log('\n✅ PR 自动内容校验通过');
}

if (require.main === module) {
  main();
}

module.exports = {
  HISTORY_WINDOW_DAYS,
  compareEvents,
  parseFrontMatter,
  validateHistoricalDuplicates,
  withinHistoryWindow
};
