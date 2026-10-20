'use strict';
// 회차 장부 — 장과 장 사이에 남는 기록. 규칙은 GDD 4장(R1~R8).
// 한 회차 안에서는 되돌릴 수 없다. 새 회차를 시작해야 지워진다.

const LEDGER_KEY = 'summit-ledger-v1';
const CH_ORDER = ['misuk', 'hanul', 'yuna', 'jungwoo', 'doyun', 'part2', 'part3'];   // 1부(의심이 커지는 순서, GDD 3장), 2부, 3부
const PEOPLE = { misuk: '오미숙', hanul: '서하늘', yuna: '정윤아', jungwoo: '한정우', doyun: '김도윤', part2: '13시', part3: '문태오' };
const CH_NUM = { misuk: 1, hanul: 2, yuna: 3, jungwoo: 4, doyun: 5, part2: 6, part3: 7 };

// 사실마다 어디서 다시 쓰이는지. 장 마침 화면과 장부 보기에 그대로 보여 준다(GDD 4.4).
const FACT_INFO = {
  J1:  { title: '쉼터 충전기 · 보조배터리', uses: '4장: 한정우가 쉼터에서 충전할 수 있는지, 보조배터리를 받는지 · 2부: 오미숙 배터리' },
  J2:  { title: '붉은 등산복 손님에게 한 말', uses: '4장: 쉼터에서 사장의 말로 다시 들린다 · 3부: 증언' },
  J3:  { title: '다은의 행선지', uses: '2부: 13시에 다은이 있는 곳' },
  R1:  { title: '오미숙의 결심', uses: '4장: 산길의 소문 · 2부: 오미숙이 할 수 있는 일' },
  J4:  { title: '능선의 붉은 등산복', uses: '4장: 한정우가 그 시각 능선에 있으면 그 장면이 재생된다 · 3부: 알리바이 영상' },
  J5:  { title: '방송 제목 "본부장 등산 중?"', uses: '3장: 기자의 확신 · 4장: 뉴스와 여론 · 5장: 비서실장의 긴장' },
  J6:  { title: '07:40 폭음 녹화', uses: '3부 Q1: 폭음 두 번의 간격' },
  J7:  { title: '전망대의 보조배터리', uses: '4장: 그 시각 전망대에 있었다면 한정우가 받는다 · 5장: 아니면 대역이 받는다' },
  R2:  { title: '서하늘의 결심', uses: '3장: 영상이 기자에게 간다 · 2부: 서하늘이 할 수 있는 일' },
  J8:  { title: '주차장의 관용차', uses: '5장: 누가 차를 찍는다 · 3부: 증거 사진' },
  J9:  { title: '갈림길의 선택과 약수터 아이', uses: '4장: 약수터에 아이가 있는지 · 3부: 아이 엄마의 증언' },
  J10: { title: '비서실장에게 건 전화', uses: '5장: 부재중 전화 — 다시 걸지 말지' },
  R3:  { title: '정윤아의 결심', uses: '2부: 13:40 기사' },
  J2b: { title: '사장의 말에 대한 한정우의 반응', uses: '5장: 비서실장에게 물었다면 그 메시지가 업무폰에 온다 · 3부 Q2: 언제 알았나' },
  J11: { title: '반전 전화에 대한 답', uses: '5장: 김도윤 작전폰 도착 시각 · 2부' },
  J12: { title: '한정우의 읽음 기록', uses: '3부 Q2: "본부장은 언제 알았나"' },
  R4:  { title: '한정우의 결심', uses: '2부: 한정우가 할 수 있는 일' },
  J10b: { title: '기자에게 다시 건 전화', uses: '3부: 비서실장의 목소리 녹음' },
  J13: { title: '대역 최의 자리', uses: '3부 Q5: 목격된 붉은 등산복이 누구였나' },
  J14: { title: '경비 철수 기록', uses: '3부 Q1: 1단계가 "사고"로 남는가' },
  J15: { title: '2단계 시각', uses: '2부: 남은 시간이 15분인지 30분인지' },
  R5:  { title: '김도윤의 결심', uses: '2부: 김도윤이 할 수 있는 일' },
  T13: { title: '13시에 일어난 일', uses: '3부 Q4 · 엔딩의 한 축' },
  DAEUN: { title: '오다은', uses: '3부: 오미숙의 후일담' },
  ARTICLE: { title: '정윤아의 기사', uses: '3부: 그날 밖으로 나간 유일한 글' },
  REPORT: { title: '진상조사 보고서', uses: '엔딩의 다른 한 축: Q1~Q3이 인정됐는가' },
  ENDING: { title: '엔딩', uses: '13시의 결과 × 보고서' },
};

let L = null;

function ledgerNew() {
  L = { v: 1, seed: (Math.random() * 2 ** 32) >>> 0, created: Date.now(), done: [], facts: {}, tracks: {}, contradictions: [], links: [], saw: {} };
  ledgerSave();
}
function ledgerLoad() {
  try { L = JSON.parse(localStorage.getItem(LEDGER_KEY) || 'null'); } catch (e) { L = null; }
  if (!L || L.v !== 1) ledgerNew();
  L.saw = L.saw || {};
}
function ledgerSave() {
  try { localStorage.setItem(LEDGER_KEY, JSON.stringify(L)); } catch (e) { /* 저장 불가 환경에선 이번 세션 동안만 유지 */ }
}

const getFact = (id) => L.facts[id];
const factIs = (id, v) => !!L.facts[id] && L.facts[id].value === v;
function setFact(id, value, label) { L.facts[id] = { by: S.ch, t: S.t, value, label }; }
function nextChapter() { return CH_ORDER.find((c) => !L.done.includes(c)); }
const inRanges = (ranges, t) => (ranges || []).some(([a, b]) => t >= a && t < b);

// 물려받은 선택이 지금 장에 영향을 줄 때 붙이는 꼬리표(GDD 4.3)
function linkTag(id) {
  const f = L.facts[id];
  return f ? `<span class="ltag">← ${CH_NUM[f.by]}장 ${PEOPLE[f.by]}의 선택</span>` : '';
}
// 연결이 실제로 일어났음을 장부에 남긴다(같은 연결은 장마다 한 번)
function noteLink(id, text) {
  const k = `${id}|${text}`;
  if (S.linked.has(k)) return;
  S.linked.add(k);
  L.links.push({ fact: id, ch: S.ch, t: S.t, text });
}
// R3: 앞 장의 증언과 지금 기록이 어긋나면 고치지 않고 남긴다
function contradiction(text) { L.contradictions.push({ ch: S.ch, t: S.t, text }); }

// 재생용 이동 기록(visited)에서 그 시각의 위치를 찾는다. { node } 아니면 { seg }.
function posAt(track, t) {
  let cur = null;
  for (const v of (track && track.visited) || []) { if (v.t <= t) cur = v; else break; }
  return cur;
}
const wasAt = (track, t, place) => { const p = posAt(track, t); return !!p && (p.node === place || p.seg === place); };
const placeName = (p) => (!p ? '기록 없음' : p.node ? NODES[p.node].name : SEGMENTS.find((s) => s.id === p.seg).name);
// 장 시작 화면: 이 하루에 이미 누구의 기록이 남아 있는지
function inheritedNote() {
  const prev = L.done.filter((c) => c !== S.ch);
  if (!prev.length) return '';
  return `이 하루에는 <b>${prev.map((c) => `${CH_NUM[c]}장 ${PEOPLE[c]}`).join(' · ')}</b>의 기록이 남아 있다. 이어받은 선택이 영향을 주면 <span class="ltag">← 앞 장의 선택</span> 표시가 붙는다.`;
}

// ───────── 자기검증 ─────────
// 규칙을 어긴 곳을 모은다. 테스트는 이 목록이 비어 있어야 통과하고, 브라우저에서는 화면 구석에 뜬다.
const VIOLATIONS = [];
function violation(text) {
  if (!VIOLATIONS.includes(text)) VIOLATIONS.push(text);
  const el = typeof document !== 'undefined' && document.getElementById && document.getElementById('err');
  if (el && el.style) { el.style.display = 'block'; el.textContent += `[모순] ${text}\n`; }
}
// 목격 계약(R2): 아직 플레이하지 않은 인물의 반응을 앞 장이 봤다면, 그 반응이 밖에서 어떻게 보였는지를 적어 둔다.
// 뒤 장이 그 장면을 재생할 때는 밖에서 똑같이 보이는(looks 가 같은) 선택지만 낼 수 있다.
function sawLooks(scene, looks) { L.saw[scene] = { by: S.ch, t: S.t, looks }; }
function allowedOptions(evId, E, options) {
  const rec = E.replays && L.saw[E.replays];
  if (!rec) return options;
  return options.filter((o) => {
    if (o.looks === rec.looks) return true;
    violation(`장면 ${S.ch}/${evId} 선택지 "${o.label}": 밖에서 '${o.looks || '표시 없음'}'로 보이는데, ${PEOPLE[rec.by]}은(는) '${rec.looks}'를 봤다`);
    return false;
  });
}
// 쉼터 충전기는 하나다. 사장의 충전 기록과 앞 장 인물들이 꽂아 둔 시간을 모두 본다. 'owner' | 'other' | null
function chargerTakenAt(t, ownerPlug) {
  const m = L.tracks.misuk;
  if (m && inRanges(ownerPlug || m.plug, t)) return 'owner';
  for (const [ch, tr] of Object.entries(L.tracks)) if (ch !== S.ch && ch !== 'misuk' && inRanges(tr.charge, t)) return 'other';
  return null;
}
const CHARGER_BUSY = { owner: '충전기 — 사장 휴대폰이 꽂혀 있다', other: '충전기 — 다른 등산객 휴대폰이 꽂혀 있다' };
