'use strict';

/**
 * 플레이리스트 이전용 곡 매칭 엔진 (프로토타입).
 *
 * 입력 형식 (모든 플랫폼 어댑터가 이 형태로 변환해서 넘긴다):
 *   { title, artists: string[], album?, durationMs?, isrc? }
 *
 * 외부 의존성 없음. 브라우저 Web Worker / Node 어디서든 동작.
 */

const VERSION_TAGS = [
  'live', 'remix', 'instrumental', 'acoustic', 'karaoke', 'cover',
  'demo', 'sped up', 'slowed', 'nightcore', 'reaction', 'mv', 'official video',
];

// 비교에서 제거해도 의미가 유지되는 장식 문구
const NOISE_PATTERNS = [
  /\b(remaster(ed)?( \d{4})?|deluxe( edition)?|radio edit|single version|album version|bonus track|explicit|clean)\b/g,
  /\b(official (audio|music video|video|lyric video)|lyrics?|audio|hd|4k)\b/g,
  /\bfrom\b.*$/g, // "From the movie ..." 류
];

const THRESHOLD_AUTO = 0.85;
const THRESHOLD_REVIEW = 0.6;

function normalize(s) {
  if (!s) return '';
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’'`´]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 제목에서 feat/버전 태그를 분리한다. */
function parseTitle(rawTitle) {
  let title = (rawTitle || '').normalize('NFKC');
  const featured = [];
  const tags = new Set();

  // 괄호/대괄호/하이픈 뒤 꼬리 부분 추출
  const tails = [];
  title = title.replace(/[(\[]([^)\]]*)[)\]]/g, (_, inner) => {
    tails.push(inner);
    return ' ';
  });
  const dash = title.split(/\s[-–—]\s/);
  if (dash.length > 1) {
    title = dash[0];
    tails.push(...dash.slice(1));
  }

  for (const t of tails) {
    const lower = t.toLowerCase();
    const feat = lower.match(/^(?:feat\.?|ft\.?|featuring|with)\s+(.+)$/);
    if (feat) {
      featured.push(...splitArtists(feat[1]));
      continue;
    }
    for (const tag of VERSION_TAGS) {
      if (lower.includes(tag)) tags.add(tag === 'official video' ? 'mv' : tag);
    }
    // 병기 제목(예: "봄날 (Spring Day)")은 태그가 아니면 대체 제목으로 보존
    if (!VERSION_TAGS.some((tag) => lower.includes(tag)) && !NOISE_PATTERNS.some((p) => p.test(lower))) {
      tails.altTitle = tails.altTitle || t;
    }
    NOISE_PATTERNS.forEach((p) => (p.lastIndex = 0));
  }

  // 본문 안의 feat.
  title = title.replace(/\b(?:feat\.?|ft\.?|featuring)\s+(.+)$/i, (_, names) => {
    featured.push(...splitArtists(names));
    return '';
  });

  let core = normalize(title);
  for (const p of NOISE_PATTERNS) core = core.replace(p, ' ');
  core = core.replace(/\s+/g, ' ').trim();

  return {
    core,
    altTitle: tails.altTitle ? normalize(tails.altTitle) : null,
    featured: featured.map(normalize),
    tags,
  };
}

function splitArtists(s) {
  return (s || '')
    .split(/\s*(?:,|&|\/|\bx\b|\band\b|\bwith\b|\bfeat\.?(?!\w)|\bft\.?(?!\w)|\bvs\.?(?!\w))\s*/i)
    .map((a) => a.trim())
    .filter(Boolean);
}

function artistSet(track) {
  const parsed = parseTitle(track.title);
  const all = [];
  for (const a of track.artists || []) all.push(...splitArtists(a));
  all.push(...parsed.featured);
  return new Set(all.map(normalize).map((a) => a.replace(/^the /, '')).filter(Boolean));
}

/** 토큰 기반 유사도 (Jaccard) + 부분 문자열 보정 */
function textSim(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;
  const ta = new Set(a.split(' '));
  const tb = new Set(b.split(' '));
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  return union ? inter / union : 0;
}

function setSim(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) {
    for (const y of b) {
      if (x === y || x.includes(y) || y.includes(x)) { inter++; break; }
    }
  }
  return inter / Math.max(a.size, b.size);
}

function durationSim(aMs, bMs) {
  if (!aMs || !bMs) return 0.5; // 정보 없으면 중립
  const d = Math.abs(aMs - bMs) / 1000;
  if (d <= 2) return 1;
  if (d >= 10) return 0;
  return 1 - (d - 2) / 8;
}

/**
 * 후보 곡 하나에 대한 점수. 0~1.
 * @param {object} source  원본 곡
 * @param {object} cand    타깃 서비스 검색 결과 곡
 * @param {object} [opts]  { channelTitle?: string }  YouTube 전용 힌트
 */
function scoreCandidate(source, cand, opts = {}) {
  if (source.isrc && cand.isrc && source.isrc.toUpperCase() === cand.isrc.toUpperCase()) {
    return { score: 1, reason: 'isrc' };
  }

  const ps = parseTitle(source.title);
  const pc = parseTitle(cand.title);

  let title = textSim(ps.core, pc.core);
  if (ps.altTitle) title = Math.max(title, textSim(ps.altTitle, pc.core));
  if (pc.altTitle) title = Math.max(title, textSim(ps.core, pc.altTitle));

  const artist = setSim(artistSet(source), artistSet(cand));
  const duration = durationSim(source.durationMs, cand.durationMs);
  const album = textSim(normalize(source.album), normalize(cand.album));

  let score = 0.45 * title + 0.35 * artist + 0.15 * duration + 0.05 * album;

  // 버전 태그 불일치(라이브 vs 스튜디오 등) 감점
  const tagMismatch = [...new Set([...ps.tags, ...pc.tags])].some(
    (t) => ps.tags.has(t) !== pc.tags.has(t),
  );
  if (tagMismatch) score -= 0.3;

  // YouTube: "{artist} - Topic" 채널은 공식 오디오
  if (opts.channelTitle && /\s-\s*topic$/i.test(opts.channelTitle)) score += 0.1;

  return { score: Math.max(0, Math.min(1, score)), reason: tagMismatch ? 'tag-mismatch' : 'text' };
}

/**
 * 후보 목록에서 최적 곡을 고르고 상태를 매긴다.
 * 반환: { status: 'auto'|'review'|'none', best, score, reason }
 */
function pickBest(source, candidates, optsFor = () => ({})) {
  let best = null;
  for (const cand of candidates || []) {
    const r = scoreCandidate(source, cand, optsFor(cand));
    if (!best || r.score > best.score) best = { ...r, best: cand };
  }
  if (!best) return { status: 'none', best: null, score: 0, reason: 'no-candidates' };
  const status = best.score >= THRESHOLD_AUTO ? 'auto' : best.score >= THRESHOLD_REVIEW ? 'review' : 'none';
  return { status, ...best };
}

/** 타깃 서비스 검색에 넣을 쿼리 문자열들 (우선순위 순) */
function buildQueries(track) {
  const p = parseTitle(track.title);
  const primary = (track.artists || [])[0] || '';
  const q = [];
  if (p.core) q.push(`${p.core} ${normalize(primary)}`.trim());
  if (p.altTitle) q.push(`${p.altTitle} ${normalize(primary)}`.trim());
  if (p.core && p.featured.length) q.push(`${p.core} ${normalize(primary)} ${p.featured[0]}`.trim());
  return [...new Set(q)];
}

module.exports = {
  normalize,
  parseTitle,
  splitArtists,
  scoreCandidate,
  pickBest,
  buildQueries,
  THRESHOLD_AUTO,
  THRESHOLD_REVIEW,
};
