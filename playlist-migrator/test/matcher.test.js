'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../src/matcher');

test('ISRC 일치 → 점수 1', () => {
  const a = { title: 'Dynamite', artists: ['BTS'], isrc: 'USA2P2029050' };
  const b = { title: 'Dynamite (something weird)', artists: ['Unknown'], isrc: 'usa2p2029050' };
  assert.equal(m.scoreCandidate(a, b).score, 1);
});

test('feat. 와 Remastered 표기 차이는 자동 매칭', () => {
  const src = { title: 'Empire State of Mind (feat. Alicia Keys)', artists: ['JAY-Z'], durationMs: 276000, album: 'The Blueprint 3' };
  const cand = { title: 'Empire State of Mind', artists: ['JAY-Z', 'Alicia Keys'], durationMs: 276600, album: 'The Blueprint 3' };
  const r = m.pickBest(src, [cand]);
  assert.equal(r.status, 'auto', `score=${r.score}`);
});

test('라이브 버전은 스튜디오 원곡과 자동 매칭되지 않음', () => {
  const src = { title: 'Yellow', artists: ['Coldplay'], durationMs: 269000 };
  const live = { title: 'Yellow (Live in Buenos Aires)', artists: ['Coldplay'], durationMs: 310000 };
  const studio = { title: 'Yellow', artists: ['Coldplay'], durationMs: 269000 };
  const r = m.pickBest(src, [live, studio]);
  assert.equal(r.best, studio);
  assert.equal(m.scoreCandidate(src, live).reason, 'tag-mismatch');
  assert.ok(m.scoreCandidate(src, live).score < m.THRESHOLD_AUTO);
});

test('한글 제목 + 영문 병기 제목 매칭', () => {
  const src = { title: '봄날 (Spring Day)', artists: ['방탄소년단'], durationMs: 274000 };
  const cand = { title: 'Spring Day', artists: ['BTS'], durationMs: 274000 };
  const r = m.scoreCandidate(src, cand);
  // 아티스트명이 달라 자동 확정은 안 되지만 제목 병기 덕에 검토 대상에는 올라야 함
  assert.ok(r.score >= m.THRESHOLD_REVIEW, `score=${r.score}`);
});

test('YouTube Topic 채널 가산점과 MV 감점', () => {
  const src = { title: 'Blinding Lights', artists: ['The Weeknd'], durationMs: 200000 };
  const topic = { title: 'Blinding Lights', artists: ['The Weeknd'], durationMs: 200000 };
  const mv = { title: 'The Weeknd - Blinding Lights (Official Video)', artists: ['The Weeknd'], durationMs: 262000 };
  const r = m.pickBest(src, [mv, topic], (c) => (c === topic ? { channelTitle: 'The Weeknd - Topic' } : {}));
  assert.equal(r.best, topic);
  assert.equal(r.status, 'auto');
});

test('전혀 다른 곡은 none', () => {
  const src = { title: 'Hello', artists: ['Adele'], durationMs: 295000 };
  const cand = { title: 'Hello', artists: ['Lionel Richie'], durationMs: 250000 };
  const r = m.pickBest(src, [cand]);
  assert.notEqual(r.status, 'auto');
});

test('후보가 없으면 none', () => {
  assert.equal(m.pickBest({ title: 'x', artists: [] }, []).status, 'none');
});

test('검색 쿼리 생성', () => {
  const q = m.buildQueries({ title: '봄날 (Spring Day)', artists: ['방탄소년단'] });
  assert.deepEqual(q, ['봄날 방탄소년단', 'spring day 방탄소년단']);
});

test('splitArtists', () => {
  assert.deepEqual(m.splitArtists('JAY-Z & Alicia Keys, Kanye West feat. Rihanna'), ['JAY-Z', 'Alicia Keys', 'Kanye West', 'Rihanna']);
});
