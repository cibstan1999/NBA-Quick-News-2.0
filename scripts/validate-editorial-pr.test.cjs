'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  HISTORY_WINDOW_DAYS,
  compareEvents,
  withinHistoryWindow
} = require('./validate-editorial-pr.js');

const kawhiHistorical = {
  title: '莱昂纳德被曝与快船球馆大屏供应商存在数百万美元赞助协议',
  event_core: '科怀·莱昂纳德被曝曾与快船球馆视频屏供应商 Daktronics 签有数百万美元赞助协议，相关安排被质疑涉及规避 NBA 工资帽',
  event_key: 'kawhi-leonard-daktronics-sponsorship-clippers-salary-cap-probe-2026-08-07',
  event_hash: '66e6ae50',
  event_stage: 'reported_allegation',
  canonical_topic: 'kawhi-clippers-salary-cap-investigation'
};

const kawhiDuplicate = {
  title: '报道称莱昂纳德曾与快船记分牌厂商达成未公开代言协议',
  event_core: '报道称科怀·莱昂纳德曾与Intuit Dome记分牌制造商Daktronics签有未公开的数百万美元代言协议',
  event_key: 'kawhi-leonard-daktronics-endorsement-clippers-cap-investigation',
  event_hash: 'e346d7ae',
  event_stage: 'reported',
  canonical_topic: 'kawhi-leonard-clippers-cap-investigation'
};

const jackHistorical = {
  title: '尼克斯二轮秀杰克·凯伊尔与ALBA柏林签下五年合同',
  event_core: '尼克斯2026年39号秀杰克·凯伊尔与ALBA柏林签下五年合同，成为海外留存新秀',
  event_key: 'jack-kayil-alba-berlin-five-year-contract-knicks-draft-stash-2026-08-07',
  event_hash: 'dc78172c',
  event_stage: 'official',
  canonical_topic: '杰克·凯伊尔海外留存'
};

const jackDuplicate = {
  title: '尼克斯39号秀Jack Kayil新赛季将留在柏林发展',
  event_core: '尼克斯2026年39号秀Jack Kayil确认新赛季继续为ALBA Berlin效力',
  event_key: 'jack-kayil-alba-berlin-overseas-knicks-2026-27',
  event_hash: '225f0ce2',
  event_stage: 'confirmed',
  canonical_topic: 'jack-kayil-knicks-draft-stash'
};

test('Issue #45: Kawhi / Daktronics wording variants are duplicate events', () => {
  const result = compareEvents(kawhiDuplicate, kawhiHistorical);

  assert.equal(result.duplicate, true);
  assert.match(result.reasons.join(' '), /daktronics/);
  assert.match(result.reasons.join(' '), /investigation|sponsorship/);
});

test('Issue #45: Jack Kayil / ALBA Berlin wording variants are duplicate events', () => {
  const result = compareEvents(jackDuplicate, jackHistorical);

  assert.equal(result.duplicate, true);
  assert.match(result.reasons.join(' '), /jack/);
  assert.match(result.reasons.join(' '), /draft|overseas/);
});

test('same player in a clearly different event is not rejected', () => {
  const differentKawhiEvent = {
    title: '莱昂纳德膝伤恢复取得进展，预计参加快船训练营',
    event_core: '科怀·莱昂纳德的膝伤恢复取得进展，球队预计他可以参加新赛季训练营',
    event_key: 'kawhi-leonard-knee-injury-return-clippers-training-camp',
    event_hash: '01234567',
    event_stage: 'reported',
    canonical_topic: 'kawhi-clippers-knee-injury-return'
  };

  assert.equal(compareEvents(differentKawhiEvent, kawhiHistorical).duplicate, false);
});

test('reported signing upgraded to an official announcement is allowed', () => {
  const reported = {
    title: '报道称球员预计将与球队签约',
    event_core: '消息称球员预计与球队签下一份合同',
    event_key: 'sample-player-sample-team-signing',
    event_hash: '11111111',
    event_stage: 'reported',
    canonical_topic: 'sample-player-sample-team-signing'
  };
  const official = {
    ...reported,
    title: '球队官方宣布签下球员',
    event_core: '球队正式宣布与球员完成签约',
    event_stage: 'official'
  };

  assert.equal(compareEvents(official, reported).duplicate, false);
});

test('history comparison includes the full seven-day window', () => {
  assert.equal(HISTORY_WINDOW_DAYS, 7);
  assert.equal(withinHistoryWindow(
    '_posts/2026-08-07-nba-news-120000-aaaaaaaa-bbbbbbbb.md',
    '_posts/2026-07-31-nba-news-120000-cccccccc-dddddddd.md'
  ), true);
  assert.equal(withinHistoryWindow(
    '_posts/2026-08-07-nba-news-120000-aaaaaaaa-bbbbbbbb.md',
    '_posts/2026-07-30-nba-news-120000-cccccccc-dddddddd.md'
  ), false);
});
