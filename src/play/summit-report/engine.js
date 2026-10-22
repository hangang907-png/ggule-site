'use strict';
// 「정상 보고」 엔진 — 모든 장이 같은 시계, 같은 도시, 같은 UI 문법(왼쪽 장소 · 오른쪽 휴대폰)을 쓴다.
// 장별 내용은 ch_*.js 가 CHAPTERS 에 등록하고, 장 사이 기록은 ledger.js 가 맡는다.

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const hm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const trunc = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s);
const val = (f) => (typeof f === 'function' ? f() : f);
const btn = (act, label, dis) => `<button data-act="${act}"${dis ? ' disabled' : ''}>${label}</button>`;

const SEG = Object.fromEntries(SEGMENTS.map((s) => [s.id, s]));
const DIST = Object.fromEntries(DISTRICTS.map((d) => [d.id, d]));
const RECV = [0, 0.25, 0.6, 1, 1];          // 신호별 분당 수신 확률
const SEND_LAG = [null, 8, 3, 1, 1];        // 신호별 발신 도착 지연(분)
const RULE = ['서비스 없음 — 받지도 보내지도 못함', '신호 약함 — 수신 느림 · 발신 8분',
  '신호 보통 — 수신 지연 · 발신 3분', '신호 양호 — 즉시 수신 · 발신 1분', '신호 최상 — 즉시 수신 · 발신 1분'];
const CITY_BEARING = 185;
const BOT = params.get('bot');

const CHAPTERS = {};
let S = null, C = null, msgId = 0, outId = 0;

// 회차 시드 난수 — 같은 회차의 모든 장에서 도시의 무작위 사건이 똑같이 일어나게 한다
function mulberry32(a) {
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function newState(id, exp, speed) {
  const ch = CHAPTERS[id];
  const city = {};
  for (const d of DISTRICTS) city[d.id] = { danger: 0, evac: 0, evacOn: false, locked: false, squads: [], cas: 0 };
  return {
    ch: id, exp, speed, t: START_MIN, end: toMin(ch.end), over: false, paused: false, modal: null, silent: false,
    node: ch.node, seg: null, prog: 0, walking: false, facing: 0, busyUntil: 0, later: [], stamina: 100,
    battery: 100, charging: false, phoneOff: false, powerbank: 0,
    inbox: [], outbox: [], msgs: [], news: [], pressAll: [], pins: {}, newsSeen: 0,
    decisions: {}, call: null, reads: 0, missedCalls: 0, cmdLat: [],
    city, squadsFree: 3, opinion: 60, flags: {}, fired: new Set(),
    rng: mulberry32(L.seed), nextRandom: toMin('08:10'), nextSiren: toMin('08:00'), nextAmbient: START_MIN + 10,
    log: [], truth: [], linked: new Set(), x: {}, chargeLog: [], wasCharging: false,
    app: 'home', chan: null, ui: { d: null, card: null }, banner: null, showTruth: params.has('truth'),
  };
}

// ───────── 상태 질의 ─────────
const here = () => (S.seg ? SEG[S.seg] : NODES[S.node]);
const busy = () => S.t < S.busyUntil;
// 인물마다 걸음이 다르다(장 정의의 pace). 지치면 누구나 느려진다.
const walkPace = () => (S.stamina < 25 ? 0.6 : 1) * (C.pace || 1);
const phoneUsable = () => !S.phoneOff && (S.exp || S.battery > 0);
function signal() {
  if (S.exp) return 4;
  if (!phoneUsable()) return 0;
  let s = here().signal;
  if (S.flags.fog && S.seg && SEG[S.seg].exposed) s -= 2;
  return clamp(s, 0, 4);
}
function relDeg(bearing) { return ((bearing - S.facing + 540) % 360) - 180; }
function relWord(bearing) {
  const r = relDeg(bearing), a = Math.abs(r), side = r > 0 ? '오른쪽' : '왼쪽';
  if (a < 20) return '정면';
  if (a < 70) return `${side} 앞`;
  if (a < 110) return side;
  if (a < 160) return `${side} 뒤`;
  return '등 뒤';
}
const absWord = (b) => ['북', '북동', '동', '남동', '남', '남서', '서', '북서'][Math.round((((b % 360) + 360) % 360) / 45) % 8];
const totalCas = () => DISTRICTS.reduce((a, d) => a + S.city[d.id].cas, 0);
const avgDanger = () => DISTRICTS.reduce((a, d) => a + S.city[d.id].danger, 0) / DISTRICTS.length;
const facingCity = () => Math.abs(relDeg(CITY_BEARING)) < 70;

function log(text) { S.log.push(`${hm(S.t)} ${text}`); }
function truthLog(text) { S.truth.push(`${hm(S.t)} ${text}`); }
function trailText(text, cls = '', tag = '') {
  if (S.silent) return;
  const el = document.createElement('div');
  el.className = `line ${cls}`;
  el.innerHTML = `<span class="tm">${hm(S.t)}</span>${esc(text)}${tag}`;
  const box = $('#t-log');
  box.prepend(el);
  while (box.children.length > 90) box.lastChild.remove();
}

// ───────── 소리 (Web Audio, 전부 합성) ─────────
// 깔리는 녹음의 크기 배수. 합성 잡음에 맞춰 둔 손잡이 값(ambientTick)을 그대로 쓰려고 곱한다.
// 2026-10-05: 귀로 맞춘 값이 아니다. 녹음의 평균 음량(ffmpeg volumedetect)으로 계산해 바람 −43~−28dB, 물 −33dB, 도시 −48~−32dB 가 되게 잡았다.
const SOUND_LOOP = { wind: 5, water: 8, hum: 4 };
const AU = {
  ctx: null,
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = 0.9; this.master.connect(c.destination);
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    this.wind = this.loop(this.filter('bandpass', 420, 0.5), 0);
    this.water = this.loop(this.filter('bandpass', 1500, 0.8), 0);
    this.humPan = c.createStereoPanner();
    this.hum = this.loop(this.filter('lowpass', 110, 0.7), 0, this.humPan);
    this.loadSamples();
  },
  // 녹음된 효과음(sounds.js, file:// 에서도 되도록 스크립트에 담았다). 풀리기 전이나 없는 소리는 합성음으로 난다.
  samples: {},
  loadSamples() {
    if (typeof SOUND_DATA === 'undefined') return;
    for (const [id, b64] of Object.entries(SOUND_DATA)) {
      const bin = atob(b64), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      this.ctx.decodeAudioData(bytes.buffer).then((buf) => {
        this.samples[id] = buf;
        document.documentElement.dataset.sounds = Object.keys(this.samples).length;   // 테스트가 센다
        if (SOUND_LOOP[id]) this.swapLoop(id, buf);
      }).catch(() => {});
    }
  },
  // 깔리는 소리(바람·물·도시)를 합성 잡음에서 녹음으로 바꾼다. 크기를 정하는 손잡이(this.wind 등)는 그대로다.
  swapLoop(id, buf) {
    const c = this.ctx, g = this[id], src = c.createBufferSource(), k = c.createGain();
    src.buffer = buf; src.loop = true; src.loopStart = 0.08; src.loopEnd = buf.duration - 0.08;   // mp3 앞뒤의 빈 틈을 건너뛴다
    k.gain.value = SOUND_LOOP[id];
    src.connect(k).connect(g); src.start();
    g._src.stop();
  },
  // 녹음 한 번 재생. 없으면 false 를 돌려주고, 부른 쪽이 합성음으로 낸다.
  play(id, { at = 0, vol = 1, pan = 0, panTo = null, lowpass = 0, rate = 1 } = {}) {
    const c = this.ctx, buf = this.samples[id];
    if (!c || !buf) return false;
    const t = c.currentTime + at, src = c.createBufferSource(), g = c.createGain(), p = c.createStereoPanner();
    src.buffer = buf; src.playbackRate.value = rate; g.gain.value = vol;
    p.pan.setValueAtTime(pan, t);
    if (panTo != null) p.pan.linearRampToValueAtTime(panTo, t + buf.duration / rate);
    let node = src;
    if (lowpass) node = node.connect(this.filter('lowpass', lowpass, 0.7));
    node.connect(g).connect(p).connect(this.master);
    src.start(t);
    return true;
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  filter(type, f, q) { const b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; },
  loop(filter, vol, panner) {
    const c = this.ctx, src = c.createBufferSource(), g = c.createGain();
    src.buffer = this.noiseBuf; src.loop = true; g.gain.value = vol;
    src.connect(filter).connect(g);
    if (panner) g.connect(panner).connect(this.master); else g.connect(this.master);
    src.start();
    g._src = src;
    return g;
  },
  ambient(wind, water, hum, pan) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.wind.gain.setTargetAtTime(wind, t, 0.8);
    this.water.gain.setTargetAtTime(water, t, 0.8);
    this.hum.gain.setTargetAtTime(hum, t, 0.6);
    this.humPan.pan.setTargetAtTime(pan, t, 0.3);
  },
  spatial(bearing) { const r = relDeg(bearing) * Math.PI / 180; return { pan: Math.sin(r), behind: Math.cos(r) < 0 }; },
  blast(bearing, km, size, muffle) {
    const c = this.ctx; if (!c) return;
    const { pan, behind } = this.spatial(bearing);
    const t0 = c.currentTime + soundDelay(km);
    const vol = Math.min(0.9, 0.22 * size * (10 / km)) * (behind ? 0.6 : 1) * (muffle ? 0.4 : 1);
    const far = { vol: vol * 1.6, pan: muffle ? pan * 0.3 : pan * 0.9, lowpass: behind || muffle ? 320 : 1400 };
    if (this.play('blast', { ...far, at: soundDelay(km) })) {
      if (size >= 3 && !muffle) this.play('blast', { ...far, at: soundDelay(km) + 3, vol: far.vol * 0.7, rate: 0.93 });   // 삼 초 뒤의 두 번째
      return;
    }
    const p = c.createStereoPanner(); p.pan.value = muffle ? pan * 0.3 : pan * 0.9; p.connect(this.master);
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const lp = this.filter('lowpass', behind || muffle ? 140 : 260, 0.7);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2 + size);
    src.connect(lp).connect(g).connect(p); src.start(t0); src.stop(t0 + 3 + size);
    const o = c.createOscillator(), og = c.createGain();
    o.frequency.setValueAtTime(70, t0); o.frequency.exponentialRampToValueAtTime(28, t0 + 1.3);
    og.gain.setValueAtTime(0.0001, t0); og.gain.linearRampToValueAtTime(vol, t0 + 0.02);
    og.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
    o.connect(og).connect(p); o.start(t0); o.stop(t0 + 1.7);
  },
  rattle(delay) {   // 실내: 유리창 떨림
    const c = this.ctx; if (!c) return;
    if (this.play('rattle', { at: delay, vol: 0.5 })) return;
    const t = c.currentTime + delay, src = c.createBufferSource(), bp = this.filter('bandpass', 2400, 6), g = c.createGain();
    const lfo = c.createOscillator(), lg = c.createGain();
    src.buffer = this.noiseBuf; src.loop = true; lfo.frequency.value = 31; lg.gain.value = 0.05;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.05); g.gain.linearRampToValueAtTime(0, t + 1.4);
    lfo.connect(lg).connect(g.gain);
    src.connect(bp).connect(g).connect(this.master);
    src.start(t); lfo.start(t); src.stop(t + 1.5); lfo.stop(t + 1.5);
  },
  siren(bearing) {
    const c = this.ctx; if (!c) return;
    const { pan, behind } = this.spatial(bearing), t = c.currentTime;
    if (this.play('siren', { vol: behind ? 0.2 : 0.4, pan, lowpass: behind ? 900 : 0 })) return;
    const o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain(), p = c.createStereoPanner();
    o.type = 'triangle'; o.frequency.value = 760; lfo.frequency.value = 0.35; lg.gain.value = 160;
    lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(behind ? 0.006 : 0.012, t + 1.5); g.gain.linearRampToValueAtTime(0, t + 7);
    p.pan.value = pan;
    o.connect(g).connect(p).connect(this.master);
    o.start(t); lfo.start(t); o.stop(t + 7.2); lfo.stop(t + 7.2);
  },
  heli() {
    const c = this.ctx; if (!c) return;
    if (this.play('heli', { vol: 0.7, pan: -0.9, panTo: 0.9 })) return;
    const t = c.currentTime, src = c.createBufferSource(), lp = this.filter('lowpass', 500, 0.7);
    const am = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain(), p = c.createStereoPanner();
    src.buffer = this.noiseBuf; src.loop = true; am.gain.value = 0.5; lfo.frequency.value = 17; lg.gain.value = 0.5;
    lfo.connect(lg).connect(am.gain);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + 4); g.gain.linearRampToValueAtTime(0, t + 10);
    p.pan.setValueAtTime(-0.9, t); p.pan.linearRampToValueAtTime(0.9, t + 10);
    src.connect(lp).connect(am).connect(g).connect(p).connect(this.master);
    src.start(t); lfo.start(t); src.stop(t + 10.2); lfo.stop(t + 10.2);
  },
  bird() {
    const c = this.ctx; if (!c) return;
    if (this.play(Math.random() < 0.5 ? 'bird1' : 'bird2', { vol: 0.22, pan: rand(-0.8, 0.8), rate: rand(0.94, 1.06) })) return;
    const t = c.currentTime, n = 2 + Math.floor(Math.random() * 3), base = rand(2600, 3800);
    const p = c.createStereoPanner(); p.pan.value = rand(-0.8, 0.8); p.connect(this.master);
    for (let i = 0; i < n; i++) {
      const o = c.createOscillator(), g = c.createGain(), s = t + i * 0.14;
      o.frequency.setValueAtTime(base, s); o.frequency.exponentialRampToValueAtTime(base * 1.3, s + 0.07);
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(0.018, s + 0.015); g.gain.linearRampToValueAtTime(0, s + 0.09);
      o.connect(g).connect(p); o.start(s); o.stop(s + 0.1);
    }
  },
  step() {
    const c = this.ctx; if (!c) return;
    if (this.play(Math.random() < 0.5 ? 'step1' : 'step2', { vol: 0.3, rate: rand(0.92, 1.08) })) return;
    const t = c.currentTime, src = c.createBufferSource(), hp = this.filter('highpass', 900, 0.5), g = c.createGain();
    src.buffer = this.noiseBuf;
    g.gain.setValueAtTime(0.04, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    src.connect(hp).connect(g).connect(this.master); src.start(t, Math.random()); src.stop(t + 0.09);
  },
  buzz(count) {
    const c = this.ctx; if (!c) return;
    if (this.samples.buzz) { for (let i = 0; i < count; i++) this.play('buzz', { at: i * 0.5, vol: 0.22 }); return; }
    const t = c.currentTime;
    for (let i = 0; i < count; i++) {
      const o = c.createOscillator(), lp = this.filter('lowpass', 380, 1), g = c.createGain(), s = t + i * 0.34;
      o.type = 'square'; o.frequency.value = 150;
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(0.1, s + 0.02); g.gain.setValueAtTime(0.1, s + 0.2); g.gain.linearRampToValueAtTime(0, s + 0.23);
      o.connect(lp).connect(g).connect(this.master); o.start(s); o.stop(s + 0.25);
    }
  },
  tone(f, dur, vol = 0.05, at = 0, type = 'sine') {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  },
  ring(on) {
    clearInterval(this.ringTimer); this.ringTimer = null;
    if (!on) return;
    // 인물마다 벨소리가 다르다(GDD 10.1-5). 장 정의의 ringtone 을 쓴다.
    const once = () => { (C.ringtone || ((a) => { a.tone(880, 0.25, 0.06); a.tone(660, 0.25, 0.06, 0.3); }))(this); this.buzz(2); };
    once(); this.ringTimer = setInterval(once, 1600);
  },
  click() { this.tone(1300, 0.03, 0.04); },
};
// 섬광→폭음 간격(실제 초). 배속을 올리면 같이 줄여서 게임 시간상 간격을 유지한다.
const soundDelay = (km) => (km * 0.25) / Math.max(1, S.speed);

function ambientTick() {
  if (!AU.ctx) return;
  const h = here(), indoor = !!C.indoor;
  const alt = S.seg ? (NODES[SEG[S.seg].from].alt + NODES[SEG[S.seg].to].alt) / 2 : NODES[S.node].alt;
  const wind = S.over ? 0 : indoor ? 0.004 : 0.008 + (alt / 1052) * 0.025 + (h.exposed ? 0.012 : 0);
  const water = S.over ? 0 : h.noisy ? 0.06 : 0;
  const blackout = S.t < (S.flags.blackoutUntil || 0) - 40;
  const sp = AU.spatial(CITY_BEARING);
  const hum = S.over ? 0 : (0.012 + (avgDanger() / 100) * 0.06) * (sp.behind ? 0.55 : 1) * (blackout ? 0.1 : 1) * (h.noisy ? 0.3 : 1) * (indoor ? 0.6 : 1);
  AU.ambient(wind, water, hum, sp.pan * 0.8);
}

// ───────── 메시지 큐 ─────────
// 장마다 routes 로 출처 → 대화방(또는 'news')을 정한다. 없는 출처는 그 사람 휴대폰에 오지 않는다.
function queueMsg(ch, text, lag, extra = {}) {
  if (S.silent) return;
  S.inbox.push({ at: S.t + lag, kind: 'msg', item: { id: ++msgId, ch, text, read: false, ...extra } });
}
function queueNews(src, text, lag, extra = {}) {
  if (S.silent) return;
  if (src === 'press') S.pressAll.push({ at: S.t + lag, text });
  if (C.routes[src] !== 'news') return;
  S.inbox.push({ at: S.t + lag, kind: 'news', item: { id: ++msgId, src, text, ...extra } });
}
function queueReport(src, lag, d, danger, text, urgent) {
  if (S.silent) return;
  // 정전 중인 신시가지에선 현장·구청 보고가 끊긴다
  if (d === 'newtown' && S.t < (S.flags.blackoutUntil || 0) && (src === 'field' || src === 'ward')) return;
  const base = { d, rep: clamp(Math.round(danger), 0, 100), evT: S.t, src, urgent: !!urgent };
  const to = C.routes[src];
  if (src === 'press') S.pressAll.push({ at: S.t + lag, text });
  if (!to) return;
  if (to === 'news') S.inbox.push({ at: S.t + lag, kind: 'news', item: { id: ++msgId, src, text, ...base } });
  else queueMsg(to, text, lag, base);
}
const chOf = (id) => C.channels.find((c) => c.id === id);
// 숨은 대화방(아직 드러나지 않았거나, 지금 손에 쥐지 않은 폰의 것)은 목록·미리보기·알림에 나오지 않는다
const chShown = (id) => { const c = chOf(id); return !c.hidden || !c.hidden(); };
function itemTitle(it) { return it.ch ? chOf(it.ch).name : SOURCES[it.src].name; }

function processInbox() {
  const sig = signal();
  if (!phoneUsable() || sig === 0) return;
  const got = [], held = new Set();
  S.inbox = S.inbox.filter((it) => {
    // 같은 대화방의 메시지는 보낸 순서대로만 들어온다
    const key = it.item.ch || 'news';
    if (held.has(key)) return true;
    if (it.at > S.t || Math.random() >= RECV[sig]) { held.add(key); return true; }
    it.item.t = S.t;
    if (it.kind === 'msg') S.msgs.push(it.item);
    else {
      S.news.push(it.item);
      if (it.item.poll != null) S.poll = { t: it.item.evT, v: it.item.poll };
    }
    if (C.onDeliver) C.onDeliver(it.item);
    got.push(it.item);
    return false;
  });
  const other = got.filter((g) => (g.ch ? !chShown(g.ch) : !!C.newsHidden && C.newsHidden()));
  if (other.some((g) => g.ch) && C.onHiddenMsg) C.onHiddenMsg(other.filter((g) => g.ch));
  got.splice(0, got.length, ...got.filter((g) => !other.includes(g)));
  if (!got.length) return;
  if (S.app === 'chan') markRead(S.chan);
  if (S.app === 'news') markNews();
  const urgent = got.some((g) => g.urgent);
  if (got.length > 2) notify(`알림 ${got.length}건`, got.slice(-3).map(itemTitle).join(' · '), true);
  else { const g = got[got.length - 1]; notify(itemTitle(g), g.text, urgent); }
}

function notify(title, text, urgent, act) {
  S.banner = { title, text, act, until: performance.now() + 4000 };
  AU.buzz(urgent ? 3 : 1);
}

function send(kind, payload, label) {
  if (!phoneUsable()) return null;
  if (!S.exp) S.battery = Math.max(0, S.battery - 2);
  // 걸으면서 입력하면 그만큼 멈칫한다
  if (S.walking && S.seg) S.prog = Math.max(0, S.prog - 2 / SEG[S.seg].minutes);
  const o = { id: ++outId, kind, payload, label, created: S.t, status: 'queued', arriveAt: null };
  S.outbox.push(o);
  AU.click();
  processOutbox();
  return o;
}
function processOutbox() {
  const sig = signal();
  for (const o of S.outbox) {
    if (o.status === 'queued' && phoneUsable() && sig > 0) { o.status = 'sent'; o.arriveAt = S.t + SEND_LAG[sig] + (C.sendDelay ? C.sendDelay() : 0); }
    if (o.status === 'sent' && S.t >= o.arriveAt) {
      o.status = 'arrived';
      S.cmdLat.push(S.t - o.created);
      if (o.kind === 'reply') applyDecision(o.payload.dec, o.payload.opt, 'msg');
      else if (C.arrive) C.arrive(o);
    }
  }
}

function markRead(ch) {
  let n = 0;
  for (const m of S.msgs) {
    if (m.ch !== ch || m.read) continue;
    m.read = true; n++;
    if (m.d) updatePin(m);
    if (C.onRead) C.onRead(m);
  }
  if (n) { S.reads += n; log(`읽음 ${n}건: ${chOf(ch).name}`); }
}
function markNews() {
  for (const it of S.news.slice(S.newsSeen)) if (it.d) updatePin(it);
  S.newsSeen = S.news.length;
}
function updatePin(m) {
  const p = S.pins[m.d];
  if (!p || p.t <= m.evT) S.pins[m.d] = { danger: m.rep, t: m.evT, src: m.src };
}

// ───────── 결정(전화/메시지) ─────────
function openDecision(id) { if (!S.decisions[id]) S.decisions[id] = { status: 'open' }; }
function decisionOpen(id) {
  const st = S.decisions[id];
  return !!st && st.status === 'open' && S.t < toMin(C.decisions[id].closes) && !(C.decisionBlocked && C.decisionBlocked(id));
}
function chooseDecision(id, opt, via) {
  if (!decisionOpen(id)) return;
  const D = C.decisions[id], label = D.options.find((o) => o.id === opt).label;
  log(`결정(${via === 'call' ? '통화' : '메시지'}): ${D.title} → ${label}`);
  if (via === 'call') { applyDecision(id, opt, 'call'); return; }
  const o = send('reply', { dec: id, opt }, label);
  if (!o) return;
  S.decisions[id].status = 'sent';
  S.msgs.push({ id: ++msgId, ch: D.ch, mine: true, read: true, t: S.t, text: label, out: o.id });
}
function applyDecision(id, opt, via) {
  S.decisions[id].status = 'done';
  S.decisions[id].choice = opt;
  S.decisions[id].via = via;
  S.decisions[id].at = S.t;
  if (C.applyDecision) C.applyDecision(id, opt, via);
}

function incomingCall(id) {
  openDecision(id);
  if (!phoneUsable() || signal() < 2 || S.call) { missCall(id, !phoneUsable() ? 'battery' : S.call ? 'busy' : 'signal'); return; }
  S.call = { id, state: 'ring', left: 12000, line: 0 };   // 벨은 12초. 멈춰 있는 동안은 줄지 않는다
  AU.ring(true);
}
function missCall(id, why) {
  const D = C.decisions[id];
  S.missedCalls++;
  S.flags[`missed_${id}`] = why;
  const reason = { signal: '신호 부족', battery: '휴대폰 꺼짐', declined: '거절', unanswered: '안 받음', busy: '통화 중' }[why];
  log(`부재중 전화: ${D.caller} (${reason})`);
  queueMsg(D.ch, '(부재중 전화 1통)', 0, { sys: true });
  (D.missed || []).forEach((t) => queueMsg(D.ch, t, 0, { urgent: true }));
  if (D.prompt) queueMsg(D.ch, D.prompt, 0, { dec: id, urgent: true });
}
// 통화는 상대가 말하는 속도로 저절로 이어진다. 글이 길수록 다음 말까지 오래 걸린다.
const callPause = (line) => clamp(700 + line.length * 55, 1400, 3600);
function endCall() { S.call = null; AU.ring(false); }
function dropCall() {
  if (!S.call) return;
  const { id, state } = S.call;
  endCall();
  if (state === 'ring') { missCall(id, 'signal'); return; }
  const D = C.decisions[id];
  if (decisionOpen(id) && D.prompt) queueMsg(D.ch, `통화가 끊겼습니다. ${D.prompt}`, 0, { dec: id, urgent: true });
}
function callAct(x, y) {
  if (!S.call) return;
  const id = S.call.id, D = C.decisions[id];
  if (x === 'answer') {
    S.call.state = 'talk'; AU.ring(false);
    S.call.nextAt = performance.now() + 1500;
    S.walking = false;
    log(`통화: ${D.caller}`);
    if (C.onAnswer) C.onAnswer(id);
  } else if (x === 'decline') { endCall(); missCall(id, 'declined'); }
  else if (x === 'next') { S.call.line = Math.min(D.lines.length - 1, S.call.line + 1); S.call.nextAt = performance.now() + callPause(D.lines[S.call.line]); }
  else if (x === 'opt') { endCall(); chooseDecision(id, y, 'call'); }
  else if (x === 'hang') {
    endCall();
    log(`통화 끊음: ${D.caller} (답하지 않음)`);
    if (decisionOpen(id) && D.prompt) queueMsg(D.ch, D.prompt, 0, { dec: id, urgent: true });
  }
}

// ───────── 산길 / 장소 ─────────
function nextSegs() { return SEGMENTS.filter((s) => s.from === S.node); }

function arriveNode(n) {
  S.seg = null; S.prog = 0; S.walking = false; S.node = n;
  S.x.visited.push({ t: S.t, node: n });
  const nd = NODES[n];
  trailText(`${nd.name} 도착 (${nd.alt}m). ${nd.text}`, 'place');
  log(`도착: ${nd.name}`);
  if (nd.overlook) trailText('도시는 남쪽에 있다. 방향을 돌려야 보인다.', 'dim');
  if (C.onArrive) C.onArrive(n);
}

// 산길 이벤트: 뜨는 동안 시간이 멈춘다. text/options 는 함수일 수 있다(물려받은 기록에 따라 달라지므로).
function openTrailEvent(id) {
  if (S.flags[`ev_${id}`]) return;
  S.flags[`ev_${id}`] = 'open';
  S.modal = { id };
  S.walking = false;
}
function evDef(id) {
  const E = C.trailEvents[id];
  const v = (f) => (typeof f === 'function' ? f() : f);
  return { title: v(E.title), text: v(E.text), options: allowedOptions(id, E, v(E.options)), tag: E.tag ? v(E.tag) : '' };
}
function trailChoice(id, opt) {
  const E = evDef(id);
  S.modal = null;
  S.flags[`ev_${id}`] = opt;
  log(`장면: ${E.title} → ${E.options.find((o) => o.id === opt).label}`);
  C.onTrailChoice(id, opt);
}

function runLater() {
  S.later = S.later.filter((l) => {
    if (l.at > S.t) return true;
    C.later(l.key);
    return false;
  });
}

function trailTick() {
  if (!busy() && S.walking && S.seg && !(S.call && S.call.state === 'talk')) {
    const seg = SEG[S.seg], pace = walkPace();
    S.prog += pace / seg.minutes;
    S.stamina = Math.max(0, S.stamina - (seg.stamina / seg.minutes) * (C.pace || 1));
    if (S.stamina === 0) { S.walking = false; trailText('다리가 풀렸다. 쉬어야 한다.', 'warn'); }
    if (C.onWalk) C.onWalk(seg);
    if (S.prog >= 1) arriveNode(seg.to);
    else if (S.t >= S.nextAmbient) {
      const line = flavorPick('trail');
      if (line) trailText(line, 'dim');
      S.nextAmbient = S.t + Math.round(rand(10, 16));
    }
  } else if (!S.walking) {
    S.stamina = Math.min(100, S.stamina + (NODES[S.node].rest && !S.seg ? 1.4 : 0.6));
  }
}

// 걷는 장들이 같이 쓰는 화면 조각
function trailHead() {
  const h = here(), pace = walkPace();
  const alt = S.seg ? Math.round(NODES[h.from].alt + (NODES[h.to].alt - NODES[h.from].alt) * S.prog) : h.alt;
  return {
    place: S.seg ? `${h.name} → ${NODES[h.to].name}` : h.name,
    sub: S.seg
      ? `고도 ${alt}m · 남은 시간 약 ${Math.ceil((1 - S.prog) * h.minutes / pace)}분${S.stamina < 25 ? ' (지쳐서 느림)' : ''} · ${S.walking ? '걷는 중' : '멈춤'}`
      : `고도 ${alt}m · ${busy() ? '다른 일 하는 중' : '멈춰 있음 — 쉬면 체력 회복'}`,
  };
}
function cityView() {
  if (S.seg || !NODES[S.node].overlook) return '';
  if (!facingCity()) return '<div class="view dim">도시는 등 뒤에 있다. 남쪽으로 돌아서야 보인다. (Q/E)</div>';
  const rows = DISTRICTS.filter((d) => S.city[d.id].danger > 22).map((d) => {
    const v = S.city[d.id].danger;
    return `<li>${absWord(d.bearing)} (${d.name} 쪽) — ${v > 70 ? '굵고 검은 연기 기둥' : v > 45 ? '검은 연기' : '옅은 연기'}</li>`;
  });
  return `<div class="view"><b>내려다본 도시</b> <small>직접 본 것 — 보고가 아니다</small><ul>${rows.join('') || '<li>도시는 평온해 보인다.</li>'}</ul></div>`;
}
// 걷기·멈추기·갈 길 버튼. 바쁜 중이면 null 을 돌려준다(다른 버튼도 내지 말라는 뜻).
function walkButtons() {
  const pace = C.pace || 1;
  if (busy()) return [`<div class="dim">다른 일을 하는 중… ${S.busyUntil - S.t}분</div>`];
  if (S.seg) return [S.walking ? btn('stop', '■ 멈추기 <small>W</small>') : btn('walk', '▶ 걷기 <small>W</small>', S.stamina <= 0)];
  return nextSegs().map((s) => btn(`go:${s.id}`, `${s.name} → ${NODES[s.to].name}<small>${Math.round(s.minutes / pace)}분 · 신호 ${s.signal}칸 · 체력 −${s.stamina}${s.exposed ? ' · 사람 많음' : ''}</small>`, S.stamina <= 0));
}
// 1장 오미숙의 결심이 10:50 산길 소문으로 올라온다(R1). 산길에 있는 인물이면 누구나 듣는다.
function misukRumor() {
  const m = L.tracks.misuk;
  if (S.t !== toMin('10:50') || !m || !C.mobile || (S.node === 'rest1' && !S.seg)) return;
  if (m.resolve === 'warn') { trailText('내려오는 등산객 무리가 수군거린다. "쉼터 사장님이 도시가 난리라고 얼른 내려가래요."', 'dim', linkTag('R1')); noteLink('R1', '하산하는 등산객들: 쉼터 사장이 내려가라 했다'); }
  if (m.resolve === 'pickup') { trailText('지나가는 등산객들 사이에 말이 돈다. "쉼터 문 닫았대요. 사장님이 딸 찾으러 내려갔대."', 'dim', linkTag('R1')); noteLink('R1', '쉼터 사장이 딸을 찾으러 내려갔다는 소문'); }
}
// 쉼터 충전기 — 1장 오미숙의 충전 기록 그대로다. 사장 휴대폰이 꽂혀 있는 동안은 못 쓴다.
function shelterChargerBusy() { return chargerTakenAt(S.t); }

// ───────── 도시 (모든 장 공통) ─────────
function explosion(id, size) {
  if (S.silent) return;
  const d = DIST[id], noisy = !!here().noisy, indoor = !!C.indoor;
  AU.blast(d.bearing, d.km, size, noisy || indoor);
  if (indoor) AU.rattle(soundDelay(d.km));
  const atView = !S.seg && NODES[S.node].overlook && !indoor;
  if (atView) trailText(Math.abs(relDeg(d.bearing)) < 70 ? `${absWord(d.bearing)}쪽 하늘에 번쩍, 섬광.` : '등 뒤가 잠깐 환해진 것 같다.', 'flash');
  setTimeout(() => {
    if (!S || S.over || S.ch !== C.id) return;
    const line = noisy ? '물소리 너머로 뭔가 쿵, 울린 것 같다.'
      : indoor ? `${C.rattleLine || '유리창이 드르륵 떨린다.'} ${relWord(d.bearing)}에서 ${size >= 3 ? '둔중한 폭음' : '낮은 폭음'}.`
      : `${relWord(d.bearing)}에서 ${size >= 3 ? '둔중한 폭음이 가슴을 친다' : '멀리 낮은 폭음이 굴러온다'}.`;
    trailText(line, 'boom');
    if (size >= 3 && !noisy) trailText('삼 초쯤 뒤에 한 번 더 울린다.', 'boom');
    if (!noisy && !S.flags.firstBoom) { S.flags.firstBoom = true; if (C.firstBoomLine) trailText(val(C.firstBoomLine), 'dim'); }
  }, soundDelay(d.km) * 1000);
}

function runEvent(ev) {
  if (ev.blast) { const c = S.city[ev.blast.d]; c.danger = clamp(c.danger + ev.blast.danger, 0, 100); explosion(ev.blast.d, ev.blast.size); }
  if (ev.truth) { const c = S.city[ev.truth.d]; c.danger = clamp(c.danger + ev.truth.danger, 0, 100); }
  if (ev.label) truthLog(`[도시] ${ev.label}`);
  if (ev.blackout) {
    S.flags.blackoutUntil = S.t + 60;
    if (!here().noisy) trailText('…도시 쪽에서 늘 깔려 있던 낮은 웅웅거림이 뚝 끊겼다.', 'boom');
  }
  if (ev.fog === true) { S.flags.fog = true; if (C.mobile) trailText('능선 쪽으로 안개가 밀려온다. 능선 구간 신호 −2칸.', 'warn'); }
  if (ev.fog === false) { S.flags.fog = false; if (C.mobile) trailText('안개가 걷힌다.', 'dim'); }
  if (ev.heli && !S.silent) { AU.heli(); trailText(C.indoor ? '헬기 소리가 지붕 위를 낮게 지나 남쪽으로 간다.' : '헬기 두 대가 머리 위를 낮게 지나 남쪽으로 간다.', 'boom'); }
  if (ev.reports) for (const r of ev.reports) queueReport(r.src, r.lag, ev.d, r.danger, r.text, r.urgent);
}

function randomEvent() {
  const ev = RANDOM_EVENTS[Math.floor(S.rng() * RANDOM_EVENTS.length)];
  const cand = DISTRICTS.filter((d) => !ev.minDanger || S.city[d.id].danger >= ev.minDanger);
  const roll = S.rng();
  if (!cand.length) return;
  const d = cand[Math.floor(roll * cand.length)], c = S.city[d.id];
  c.danger = clamp(c.danger + ev.danger, 0, 100);
  truthLog(`[도시] ${d.name} 소규모 사건 (+${ev.danger})`);
  for (const r of ev.reports) queueReport(r.src, r.lag + Math.round(S.rng() * 4), d.id, c.danger + r.add * (0.5 + S.rng() * 0.7), r.text.replaceAll('{d}', d.name), r.urgent);
}

function cityTick() {
  for (const d of DISTRICTS) {
    const c = S.city[d.id];
    const onSite = c.squads.filter((a) => S.t >= a).length;
    c.danger -= 0.35 * onSite + 0.03;
    if (c.danger > 55 && !c.locked) for (const n of d.neighbors) S.city[n].danger = Math.min(100, S.city[n].danger + (c.danger - 55) * 0.004);
    if (d.id === 'campus') { if (S.opinion < 40 && !onSite) c.danger += 0.08; if (onSite) S.opinion -= 0.05; }
    if (c.evacOn) c.evac = Math.min(1, c.evac + 1 / 45);
    c.danger = clamp(c.danger, 0, 100);
    const trapped = c.locked && c.evac < 1 && c.danger > 50 ? 1.3 : 1;
    const dc = d.pop * (c.danger / 100) ** 2 * 0.6 * (1 - 0.8 * c.evac) * trapped;
    c.cas += dc;
    S.opinion -= dc * 0.06;
    if (c.locked) S.opinion -= 0.02;
  }
  if (S.t >= S.nextRandom) { randomEvent(); S.nextRandom = S.t + 22 + Math.round(S.rng() * 18); }
  if (!S.silent && S.t >= S.nextSiren) {
    const hot = DISTRICTS.filter((d) => S.city[d.id].danger > 40);
    if (hot.length && !here().noisy) { const d = pick(hot); AU.siren(d.bearing); trailText((flavorPick('siren') || '멀리 사이렌. {dir}.').replace('{dir}', relWord(d.bearing)), 'boom'); }
    S.nextSiren = S.t + Math.round(rand(25, 45));
  }
  const t = S.t;
  if (t >= toMin('08:00') && t % 60 === 0) { const v = Math.round(S.opinion + rand(-3, 3)); queueNews('poll', `[여론조사] 시 재난 대응 신뢰도 ${v}%`, 10, { poll: v, evT: t }); }
  if (t === 600 || t === 720) queueNews('press', `[공식] 해령시 "현재까지 사상자 ${Math.round(totalCas() * 0.6)}명"`, 20);
}

function worldTick() {
  CITY_EVENTS.forEach((ev, i) => { if (!S.fired.has(i) && toMin(ev.at) <= S.t) { S.fired.add(i); runEvent(ev); } });
  cityTick();
  S.opinion = clamp(S.opinion, 0, 100);
}

function phoneTick() {
  const sig = signal(), was = phoneUsable();
  if (!S.exp && !S.phoneOff) {
    if (S.charging) S.battery = Math.min(100, S.battery + (C.chargeRate || 1.2));
    else if (S.battery > 0) {
      let drain = (typeof C.drain === 'function' ? C.drain() : C.drain || 0.07) * (sig <= 1 ? 2 : 1);   // 신호를 찾느라 더 닳는다
      if (S.call && S.call.state === 'talk') drain += C.callDrain || 0.8;
      S.battery = Math.max(0, S.battery - drain);
      if (S.battery === 0) { trailText('휴대폰 화면이 꺼졌다. 배터리 0%.', 'warn'); log('휴대폰 꺼짐 (배터리)'); dropCall(); }
    }
  }
  if (!was && phoneUsable()) { trailText('휴대폰 화면이 켜진다. 통신사 로고가 지나가고, 진동이 연달아 울린다.', 'place'); log('휴대폰 켜짐'); }
  if (C.phoneTick) C.phoneTick();
  if (S.call && S.call.state === 'talk' && signal() < 2) { trailText('통화가 끊겼다. 신호가 약하다.', 'warn'); dropCall(); }
  processOutbox();
  processInbox();
}

function tick() {
  if (C.still) { if (C.tick) C.tick(); return; }   // 3부: 시계는 걷거나 물을 때만 간다
  S.t += 1;
  worldTick();
  if (C.timeline) C.timeline();
  if (C.mobile) trailTick();
  runLater();
  if (C.tick) C.tick();
  phoneTick();
  ambientTick();
  // 쉼터 충전기를 쓴 시간은 엔진이 적는다. 뒤 장은 그 시간에 충전기를 쓸 수 없다.
  if (C.mobile && S.charging !== S.wasCharging) { S.chargeLog.push([S.t, S.charging]); S.wasCharging = S.charging; }
  if (S.t >= S.end) { if (C.autoEnd) finishChapter(C.resolve()[0].id); else openResolve(); }
}

// 장 끝: 결심을 고른다(R6)
function openResolve() {
  if (S.modal && S.modal.resolve) return;
  S.modal = { resolve: true };
  S.walking = false;
  endCall();
  AU.buzz(1);
}

// ───────── 렌더 ─────────
function setHTML(sel, html) { const el = $(sel); if (el._h !== html) { el.innerHTML = html; el._h = html; } }
const dangerCls = (v) => (v == null ? 'none' : v < 30 ? 'low' : v < 60 ? 'mid' : 'high');

function renderTrail() {
  $('#clock').textContent = hm(S.t);
  $('#ch-tag').textContent = `${C.num}장 ${C.who} — ${C.title}`;
  const h = C.head();
  $('#t-place').textContent = h.place;
  $('#t-sub').textContent = h.sub;
  const b = C.badge ? C.badge() : null;
  setHTML('#t-badge', b ? `${b.label}<b>${esc(String(b.value))}</b>` : '');
  C.bars().forEach((bar, i) => {
    $(`#bl${i}`).textContent = bar.label;
    const el = $(`#bb${i}`);
    el.style.width = `${clamp(bar.pct, 0, 100)}%`;
    el.className = bar.low ? 'low' : '';
    $(`#bv${i}`).textContent = bar.text;
  });
  setHTML('#t-rule', C.rule ? C.rule() : '');
  $('#v-face').textContent = `바라보는 방향: ${absWord(S.facing)}${C.faceHint ? C.faceHint() : ''}`;
  $('#btn-pause').textContent = S.paused ? '▶ 계속' : '❚❚ 일시정지';
  document.querySelectorAll('[data-act^="speed:"]').forEach((el) => el.classList.toggle('on', Number(el.dataset.act.split(':')[1]) === S.speed));
  $('#mode-tag').textContent = S.exp ? '실험 모드: 신호·배터리 꺼짐' : '';
  setHTML('#t-view', C.view ? C.view() : '');

  let ev = '';
  if (S.modal && S.modal.resolve) {
    ev = `<div class="event resolve"><b>${hm(S.t)} — 결심</b><p>${esc(val(C.resolvePrompt))}</p>${C.resolve().map((o) => btn(`resolve:${o.id}`, `${esc(o.label)}${o.desc ? `<small>${esc(o.desc)}</small>` : ''}`)).join('')}<small class="dim">이 결심은 2부 13시에서 이 인물이 할 수 있는 일을 정한다</small></div>`;
  } else if (S.modal) {
    const E = evDef(S.modal.id);
    ev = `<div class="event"><b>${esc(E.title)}</b>${E.tag || ''}<p>${esc(E.text)}</p>${E.options.map((o) => btn(`tev:${S.modal.id}:${o.id}`, esc(o.label) + (o.note ? `<small>${esc(o.note)}</small>` : ''), o.disabled)).join('')}<small class="dim">시간이 멈춰 있다</small></div>`;
  }
  setHTML('#t-event', ev);
  setHTML('#t-actions', S.modal ? '' : C.actions());
}

function renderPhone() {
  if (C.phoneView) {   // 2부: 다섯 대를 오가는 화면은 그 장이 통째로 그린다
    const v = C.phoneView();
    $('#phone').className = v.cls || '';
    setHTML('#ph-status', v.status); setHTML('#ph-rule', ''); setHTML('#ph-banner', ''); setHTML('#ph-call', '');
    const box = $('#ph-body'), changed = box._h !== v.body, top = box.scrollTop;
    setHTML('#ph-body', v.body);
    // 대화는 새 글이 오면 맨 아래로. 증거함처럼 읽는 화면은 읽던 자리를 지킨다(scroll: 'keep' | 'top').
    if (v.scroll === 'top') box.scrollTop = 0;
    else if (changed) box.scrollTop = v.scroll === 'keep' ? top : box.scrollHeight;
    return;
  }
  const sig = signal();
  $('#phone').className = val(C.phoneClass) || '';
  const bars = [1, 2, 3, 4].map((i) => `<i class="${i <= sig ? 'on' : ''}" style="height:${3 + i * 3}px"></i>`).join('');
  const bat = S.exp ? '∞' : `${Math.round(S.battery)}%`;
  const alive = phoneUsable();
  setHTML('#ph-status', !alive ? '' :
    `<span>${val(C.carrier) || '해령텔레콤'}</span><span class="sig">${bars}</span><b>${hm(S.t)}</b><span class="bat ${S.battery < 20 && !S.exp ? 'low' : ''}">${bat}${S.charging ? ' ⚡' : ''}</span>`);
  setHTML('#ph-rule', !alive ? '' : `<span class="s${sig}">${RULE[sig]}${sig >= 2 ? ' · 통화 가능' : ' · 통화 불가'}</span>`);
  setHTML('#ph-banner', S.banner && alive ? `<div class="banner"${S.banner.act ? ` data-act="${S.banner.act}" style="pointer-events:auto;cursor:pointer"` : ''}><b>${esc(S.banner.title)}</b><span>${esc(trunc(S.banner.text, 42))}</span></div>` : '');

  let body;
  if (S.phoneOff) body = '<div class="dead">전원 꺼짐</div>';
  else if (!alive) body = `<div class="dead">배터리 없음<small>${esc(C.deadHint || '충전이 필요하다')}</small></div>`;
  else {
    const views = { home: viewHome, msg: viewMsgList, chan: viewChan, news: viewNews, map: viewMap, ...(C.views || {}) };
    body = views[S.app]();
  }
  if (alive && C.phoneTabs) body = C.phoneTabs() + body;
  const el = $('#ph-body');
  const top = el.scrollTop, changed = el._h !== body;
  setHTML('#ph-body', body);
  if (changed) el.scrollTop = S.app === 'chan' ? el.scrollHeight : top;

  let call = '';
  if (S.call) {
    const D = C.decisions[S.call.id];
    if (S.call.state === 'ring') call = `<div class="call"><div class="who">${esc(D.caller)}</div><div class="dim">휴대폰 전화…</div><div class="row">${btn('call:decline', '거절')}${btn('call:answer', '받기')}</div></div>`;
    else {
      const lines = D.lines.slice(0, S.call.line + 1).map((l) => `<p>${esc(l)}</p>`).join('');
      const last = S.call.line >= D.lines.length - 1;
      const acts = last ? `<div class="cap">어떻게 답할까</div>` + D.options.map((o) => btn(`call:opt:${o.id}`, esc(o.label))).join('') + (D.prompt ? btn('call:hang', '말없이 끊는다') : '')
        : '<div class="hearing">듣는 중… <small>화면을 누르면 바로 넘어간다</small></div>';
      call = `<div class="call talk"><div class="who">${esc(D.caller)} <small>통화 중${C.mobile ? ' · 걸음 멈춤' : ''}</small></div><div class="lines"${last ? '' : ' data-act="call:next"'}>${lines}</div><div class="col"${last ? '' : ' data-act="call:next"'}>${acts}</div></div>`;
    }
  }
  setHTML('#ph-call', call);
}

function viewHome() {
  const badge = { msg: S.msgs.filter((m) => !m.read && chShown(m.ch)).length, news: S.news.length - S.newsSeen, ...(C.badges ? C.badges() : {}) };
  const tiles = C.apps.map(([id, name]) => `<button class="app" data-act="app:${id}"><i class="ic ic-${id}"></i><span>${name}</span>${badge[id] ? `<em>${badge[id]}</em>` : ''}</button>`).join('');
  const prev = S.msgs.filter((m) => !m.read && chShown(m.ch)).slice(-4).reverse()
    .map((m) => `<div class="noti"><b>${esc(chOf(m.ch).name)}</b> ${esc(trunc(m.text, 24))}</div>`).join('');
  return `<div class="home">${tiles}</div><div class="notis"><div class="cap">잠금화면 미리보기 — 여기서만 보면 '읽음'이 남지 않는다</div>${prev || '<div class="dim">새 알림 없음</div>'}</div>`;
}
function viewMsgList() {
  const rows = C.channels.filter((c) => chShown(c.id)).map((c) => {
    const list = S.msgs.filter((m) => m.ch === c.id), last = list[list.length - 1], n = list.filter((m) => !m.read).length;
    return `<button class="chrow${c.danger ? ' op' : ''}" data-act="chan:${c.id}"><b>${esc(c.name)}</b><span>${last ? esc(trunc(last.text, 22)) : '<i class="dim">대화 없음</i>'}</span>${n ? `<em>${n}</em>` : ''}</button>`;
  }).join('');
  return `<div class="hdr">${btn('home', '‹')}<b>${esc(val(C.msgTitle) || '메신저')}</b><small>읽음 기록 ${S.reads}</small></div>${rows}`;
}
function viewChan() {
  const c = chOf(S.chan);
  const list = S.msgs.filter((m) => m.ch === S.chan).map((m) => {
    if (m.sys) return `<div class="sys">${esc(m.text)} · ${hm(m.t)}</div>`;
    let extra = '';
    if (m.d && C.commands) extra += `<button class="link" data-act="cmd:${m.d}">▶ ${DIST[m.d].name} 지시</button>`;
    if (m.dec && decisionOpen(m.dec)) extra += `<div class="decs">${C.decisions[m.dec].options.map((o) => btn(`dec:${m.dec}:${o.id}`, esc(o.label))).join('')}</div>`;
    let st = '';
    if (m.out) { const o = S.outbox.find((x) => x.id === m.out); st = o.status === 'queued' ? '전송 대기 (신호 없음)' : o.status === 'sent' ? `전송 중 · ${o.arriveAt - S.t}분 뒤 도착` : '도착'; }
    return `<div class="bub ${m.mine ? 'me' : ''} ${m.urgent ? 'urg' : ''}"><p>${esc(m.text)}</p>${extra}<small>${m.stamp || hm(m.t)}${st ? ' · ' + st : ''}</small></div>`;
  }).join('');
  return `<div class="hdr">${btn('app:msg', '‹')}<b>${esc(c.name)}</b><small>${esc(c.tag)}</small></div><div class="bubs">${list || '<div class="dim">아직 대화가 없다</div>'}</div>`;
}
function viewNews() {
  const poll = S.poll ? `<div class="poll">시 재난 대응 신뢰도 <b>${S.poll.v}%</b><small>${hm(S.poll.t)} 조사</small></div>` : '<div class="poll dim">아직 여론조사 없음 (매시 정각 조사, 10분 뒤 발표)</div>';
  const items = S.news.filter((n) => n.poll == null).slice().reverse()
    .map((n) => `<div class="news ${n.src}"><em>${SOURCES[n.src].name}${n.src === 'sns' ? ' · 미확인' : ''}</em><p>${esc(n.text)}</p><small>${hm(n.t)}</small></div>`).join('');
  return `<div class="hdr">${btn('home', '‹')}<b>뉴스 · SNS</b><small>읽음 기록 안 남음</small></div>${poll}${items || '<div class="dim pad">조용하다</div>'}`;
}
function viewMap() {
  const W = 320, H = 250, sc = 15, ox = 172, oy = 34;
  const P = (b, km) => [ox + Math.sin(b * Math.PI / 180) * km * sc, oy - Math.cos(b * Math.PI / 180) * km * sc];
  const [fx, fy] = P(S.facing, 2.6);
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="map"><text x="8" y="16" class="n">N↑</text>
    <line x1="${ox}" y1="${oy}" x2="${fx}" y2="${fy}" class="face"/><polygon points="${ox - 7},${oy + 5} ${ox + 7},${oy + 5} ${ox},${oy - 8}" class="mtn"/>
    <text x="${ox + 12}" y="${oy + 4}" class="lbl" text-anchor="start">해령산 (나)</text>`;
  for (const d of DISTRICTS) {
    const [x, y] = P(d.bearing, d.km), p = S.pins[d.id], c = S.city[d.id];
    svg += `<g data-act="cmd:${d.id}" class="dist"><circle cx="${x}" cy="${y}" r="15" class="d-${dangerCls(p && p.danger)}"/>
      <text x="${x}" y="${y + 4}" class="v">${p ? p.danger : '?'}</text>
      <text x="${x}" y="${y + 27}" class="lbl">${d.name}${c.squads.length ? ' ■'.repeat(c.squads.length) : ''}${c.locked ? ' ⛔' : ''}${c.evacOn ? ' ↗' : ''}</text>
      <text x="${x}" y="${y + 38}" class="age">${p ? `${S.t - p.t}분 전 · ${SOURCES[p.src].name}` : '정보 없음'}</text></g>`;
  }
  svg += '</svg>';
  return `<div class="hdr">${btn('home', '‹')}<b>상황 지도</b><small>부대 ${S.squadsFree}/3 대기</small></div>${svg}
    <div class="cap">숫자 = 마지막으로 <b>읽은</b> 보고의 위험도. 실제와 다를 수 있다.<br>선 = 내가 바라보는 방향. ■ 부대 · ⛔ 봉쇄 · ↗ 대피. 구역을 누르면 지시.</div>`;
}

function renderTruth() {
  const el = $('#truth');
  if (!S.showTruth) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  const rows = DISTRICTS.map((d) => { const c = S.city[d.id]; return `<tr><td>${d.name}</td><td>${Math.round(c.danger)}</td><td>${c.cas.toFixed(1)}</td><td>${Math.round(c.evac * 100)}%</td><td>${c.locked ? '봉쇄' : ''}</td><td>${c.squads.length}</td></tr>`; }).join('');
  setHTML('#truth', `<b>실제 상황 (개발용 · T)</b><table><tr><th></th><th>위험</th><th>사상</th><th>대피</th><th></th><th>부대</th></tr>${rows}</table>
    여론 ${Math.round(S.opinion)} · 사상자 계 ${totalCas().toFixed(1)}${C.truthExtra ? ' · ' + C.truthExtra() : ''}`);
}

function renderAll() { if (!S) return; renderTrail(); renderPhone(); renderTruth(); renderTabs(); }

// 좁은 화면(휴대폰 세로): 장소와 휴대폰을 아래 탭으로 오간다. 넓은 화면에서는 탭이 숨고 둘 다 보인다(CSS).
// 전화가 울리면 휴대폰으로, 장소에 선택이 뜨면(시간이 멈춘다) 장소로 저절로 넘어간다.
let mview = params.get('mview') || 'trail', mlastRing = null, mlastModal = null;   // ?mview=phone 은 스크린샷용
function renderTabs() {
  const ring = S.call && S.call.state === 'ring' ? S.call.id : null;
  if (ring && ring !== mlastRing) mview = 'phone';
  mlastRing = ring;
  const modal = S.modal ? (S.modal.resolve ? 'resolve' : S.modal.id) : null;
  if (modal && modal !== mlastModal) mview = 'trail';
  mlastModal = modal;
  $('#main').className = `v-${mview}`;
  const unread = C.phoneView ? 0 : S.msgs.filter((m) => !m.read && chShown(m.ch)).length + Math.max(0, S.news.length - S.newsSeen);
  setHTML('#mtabs', `<button data-act="view:trail" class="${mview === 'trail' ? 'on' : ''}${modal ? ' alert' : ''}">${esc(C.placeTab || '장소')}</button>`
    + `<button data-act="view:phone" class="${mview === 'phone' ? 'on' : ''}${ring ? ' alert' : ''}">휴대폰${ring ? ' · 전화' : unread ? ` <em>${unread}</em>` : ''}</button>`);
}

// ───────── 입력 ─────────
let newRunArmed = false;
function act(a) {
  const [k, x, y] = a.split(':');
  AU.resume(); MUS.resume();
  if (k === 'adlog') { const el = $('[data-act="adlog"]'); if (el && !el.dataset.shown) { el.dataset.shown = 1; el.insertAdjacentHTML('beforeend', `<br>광고 기록: ${esc(PF.adLog().join(' · ') || '없음')}`); } return; }
  if (k === 'music') { MUS.toggle(); const b = $('[data-act="music"]'); if (b) b.textContent = MUS.label(); return; }
  if (k === 'start') {
    const next = nextChapter() || (ledgerNew(), CH_ORDER[0]);
    const exp = $('#opt-exp') ? $('#opt-exp').checked : false, speed = $('#opt-speed') ? Number($('#opt-speed').value) : 1;
    const go = () => startChapter(next, exp, speed);
    if (S && S.over) PF.between(go); else go();   // 장 끝 → 다음 장 사이에만 광고(원스토어 판)
    return;
  }
  if (k === 'newrun') {
    if (!newRunArmed) { newRunArmed = true; $('[data-act="newrun"]').textContent = '한 번 더 누르면 장부를 지운다'; return; }
    newRunArmed = false; ledgerNew(); showTitle(); return;
  }
  if (k === 'title') { PF.cancelAd(); S = null; showTitle(); return; }
  if (k === 'begin') { $('#overlay').className = ''; $('#overlay').onclick = null; MUS.stop(); S.paused = false; renderAll(); return; }
  if (k === 'copylog') { copyLog(); return; }
  if (!S || S.over) return;
  switch (k) {
    case 'pause': S.paused = !S.paused; break;
    case 'view': mview = x; break;
    case 'speed': S.speed = Number(x); S.paused = false; break;
    case 'truth': S.showTruth = !S.showTruth; break;
    case 'face': S.facing = (S.facing + 45 * Number(x) + 360) % 360; ambientTick(); break;
    case 'walk': if (C.mobile && S.seg && !busy() && S.stamina > 0 && !S.modal) { S.walking = true; S.charging = false; } break;
    case 'stop': S.walking = false; break;
    case 'go':
      if (!C.mobile || busy() || S.modal || S.seg) break;
      if (S.charging) trailText('충전기에서 휴대폰을 뽑아 챙긴다.');
      S.seg = x; S.prog = 0; S.walking = true; S.charging = false;
      S.x.visited.push({ t: S.t, seg: x });
      trailText(`${SEG[x].name}에 들어선다.`, 'place');
      log(`경로 선택: ${SEG[x].name} (신호 ${SEG[x].signal}칸)`);
      break;
    case 'tev': trailChoice(x, y); break;
    case 'resolve': finishChapter(x); return;
    case 'home': S.app = 'home'; break;
    case 'app': if (phoneUsable()) { S.app = x; if (x === 'news') markNews(); } break;
    case 'chan': if (phoneUsable()) { S.app = 'chan'; S.chan = x; markRead(x); } break;
    case 'dec': if (phoneUsable()) chooseDecision(x, y, 'msg'); break;
    case 'call': callAct(x, y); break;
    case 'powerbank':
      if (S.powerbank > 0 && !S.exp) { S.powerbank--; S.battery = Math.min(100, S.battery + 30); trailText('보조배터리를 연결했다. +30%'); log('보조배터리 사용'); if (C.onPowerbank) C.onPowerbank(); }
      break;
    default: if (C.act) C.act(k, x, y);
  }
  renderAll();
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  act(el.dataset.act);
});
document.addEventListener('keydown', (e) => {
  if (!S || S.over || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const k = e.key.toLowerCase();
  if (k === ' ') { e.preventDefault(); act('pause'); }
  else if (C.mobile && (k === 'w' || k === 'ㅈ')) act(S.walking ? 'stop' : 'walk');
  else if (k === 'tab' && C.phoneTabs) { e.preventDefault(); act('swap'); }
  else if (S.ch === 'part2' && k >= '1' && k <= '5') act(`who:${P2_ORDER[Number(k) - 1]}`);
  else if (k === 'q' || k === 'ㅂ') act('face:-1');
  else if (k === 'e' || k === 'ㄷ') act('face:1');
  else if (k === 't' || k === 'ㅅ') act('truth');
});

// ───────── 장 시작 · 끝 · 타이틀 ─────────
function startChapter(id, exp, speed) {
  C = CHAPTERS[id];
  S = newState(id, exp && !!C.allowExp, speed || 1);
  msgId = 0; outId = 0;
  $('#t-log').innerHTML = '';
  document.querySelectorAll('[id]').forEach((e) => { e._h = undefined; });
  C.init();
  // 장이 시작되기 전 시간: 도시만 조용히 돌린다(같은 회차라면 어느 장에서든 같은 도시)
  S.silent = true;
  const st = toMin(C.start);
  if (C.still) S.t = st;   // 그날이 아니다. 도시는 돌리지 않는다
  while (S.t < st) { S.t++; worldTick(); }
  S.silent = false;
  if (C.begin) C.begin();
  AU.init(); AU.resume();
  log(`${C.num}장 시작 (${C.who})${S.exp ? ' · 실험 모드' : ''}`);
  renderAll();
  if (BOT || params.has('autostart')) return;
  S.paused = true;
  const ov = $('#overlay');
  ov.className = 'show cinema';
  MUS.play(id);
  ov.innerHTML = `${cineHTML(id)}<div class="reveal"><small>${C.num}장 · ${C.start} · ${esc(C.placeLabel || NODES[C.node].name)}</small><b>${esc(C.who)}</b><span>${esc(C.title)}</span></div>
    <div class="card intro"><p class="sub">${C.num}장 · ${C.start}–${C.end} · ${C.placeLabel || NODES[C.node].name}</p>
    <h1>${esc(C.who)}</h1><h2>${esc(C.title)}</h2><p>${esc(C.intro)}</p>
    ${C.inherited && C.inherited().trim() ? `<div class="inh">${C.inherited()}</div>` : ''}
    <ul class="how">${C.how.map((h) => `<li>${howText(h)}</li>`).join('')}</ul>
    <button class="big" data-act="begin">시작</button></div>`;
  cineReveal(ov);
}

// 장 안내의 키 설명: 개발용(T)은 ?dev 일 때만, 터치 화면(휴대폰·원스토어)에서는 키 대신 화면 버튼 이름으로.
const TOUCH = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
function howText(h) {
  if (!params.has('dev')) h = h.replace(/ · <b>T<\/b> 실제 상황\(개발용\)/, '');
  if (!TOUCH) return h;
  return h.replace('<b>W</b> 걷기/멈추기', '<b>걷기·멈추기</b> 버튼').replace('<b>Q/E</b>', '<b>◀ ▶</b>')
    .replace('<b>Space</b> 일시정지', '<b>일시정지</b> 버튼').replace('(또는 <b>Tab</b> 키)', '').replace(/^ · | · $/g, '');
}

function finishChapter(resolveId) {
  const opt = C.resolve().find((o) => o.id === resolveId);
  S.over = true;
  endCall();
  ambientTick();
  log(`결심: ${opt.label}`);
  C.onEnd(resolveId);
  if (C.mobile && L.tracks[S.ch]) {
    const charge = [];
    let from = null;
    for (const [t, on] of S.chargeLog) { if (on) from = t; else if (from != null) { charge.push([from, t]); from = null; } }
    if (from != null) charge.push([from, S.t]);
    L.tracks[S.ch].charge = charge;
  }
  if (!L.done.includes(S.ch)) L.done.push(S.ch);
  ledgerSave();
  showChapterEnd(opt);
}

function factRows(filter) {
  const rows = Object.entries(L.facts).filter(([, f]) => filter(f)).map(([id, f]) => {
    const info = FACT_INFO[id] || { title: id, uses: '' };
    return `<li><b>${esc(info.title)}</b>: ${esc(f.label)} <small>${hm(f.t)}</small><br><small>쓰이는 곳 — ${esc(info.uses)}</small></li>`;
  });
  return rows.length ? `<ul class="facts">${rows.join('')}</ul>` : '<p class="dim">없음</p>';
}

function showChapterEnd(opt) {
  const next = nextChapter();
  const links = L.links.filter((l) => l.ch === S.ch);
  const contra = L.contradictions.filter((c) => c.ch === S.ch);
  const ov = $('#overlay'), art = S.ch === 'part3' ? 'ending' : S.ch;
  ov.className = 'show cinema';
  ov.onclick = null;
  MUS.play(art);
  PF.preload();
  ov.innerHTML = `${cineHTML(art)}<div class="card end">
    <p class="sub">${C.num}장 마침 · ${hm(S.t)}</p><h1>${esc(C.who)}</h1><h2>${esc(C.title)}</h2>
    <p>${C.endWord || '결심'}: <b>${esc(opt.label)}</b></p>${C.endLead ? C.endLead() : ''}
    <h3>이 장이 남긴 기록</h3>${factRows((f) => f.by === S.ch)}
    <h3>이 장에서 이어받은 선택</h3>${links.length ? `<ul class="facts">${links.map((l) => `<li>${hm(l.t)} ${esc(l.text)} ${linkTag(l.fact)}</li>`).join('')}</ul>` : '<p class="dim">없음</p>'}
    ${contra.length ? `<h3>어긋난 기록 (3부 단서)</h3><ul class="facts">${contra.map((c) => `<li>${esc(c.text)}</li>`).join('')}</ul>` : ''}
    <details><summary>이 장의 내 기록 (${S.log.length})</summary><pre>${esc(S.log.join('\n'))}</pre></details>
    <details><summary>도시에서 실제로 일어난 일 (${S.truth.length})</summary><pre>${esc(S.truth.join('\n'))}</pre></details>
    ${S.ch === 'doyun' ? m1Check() : ''}${S.ch === 'part2' ? p2Check() : ''}
    <div class="row">${next ? btn('start', `다음: ${CH_NUM[next]}장 ${PEOPLE[next]}`) : ''}${btn('title', '처음으로')}${btn('copylog', '장부 복사')}</div></div>`;
}

// 1부를 다 끝낸 회차의 마침 화면: 장마다 이어받은 선택 수와 M2 검증 질문(GDD 13장)
function m1Check() {
  const rows = CH_ORDER.filter((c) => L.done.includes(c)).map((c) => `<li>${CH_NUM[c]}장 ${PEOPLE[c]}: 이어받은 선택 <b>${L.links.filter((l) => l.ch === c).length}</b>건</li>`).join('');
  return `<div class="check"><h3>1부 확인</h3><ul>${rows}</ul><p>어긋난 기록: <b>${L.contradictions.length}</b>건 — 3부의 단서가 된다</p><ol>
    <li>앞 장에서 한 선택이 뒤 장에서 "그 사람이 실제로 한 일"로 느껴졌나?</li>
    <li>4장의 전화(11:30)는 제때 터졌나? 그 전에 너무 많이 알았나, 너무 몰랐나?</li>
    <li>같은 하루를 다섯 번 사는 동안 지루했던 장이나 구간은 어디였나?</li></ol>
    <p class="dim">새 회차로 다른 선택을 해 보면 비교할 수 있다.</p></div>`;
}

// 2부 마침 화면: 13시에 일어난 일이 무엇에서 나왔는지, 그리고 M3 검증 질문(GDD 13장)
function p2Check() {
  const p = L.tracks.part2, rows = p.acts.map((a) => `<li>${hm(a.t)} ${PEOPLE[a.who]}: ${esc(a.act)}${a.eff ? ` <small>→ ${esc(a.eff)}</small>` : ''}</li>`).join('');
  return `<div class="check"><h3>2부 확인</h3><p>2단계 시각 <b>${hm(p.t2)}</b> · 그 40분 동안 다섯 사람이 한 일:</p><ul>${rows || '<li class="dim">아무도 아무것도 하지 않았다</li>'}</ul><ol>
    <li>다섯 대를 오가는 것이 긴장이었나, 과부하였나?</li>
    <li>할 수 없는 일의 까닭(배터리, 자리, 결심)이 1부의 선택으로 납득됐나?</li>
    <li>13시의 결과가 "내가 1부에서 그렇게 해서"라고 느껴졌나?</li></ol></div>`;
}

function showTitle() {
  const next = nextChapter();
  const items = CH_ORDER.map((id) => {
    const c = CHAPTERS[id], done = L.done.includes(id);
    return `<li class="${done ? 'done' : id === next ? 'next' : 'lock'}"><b>${c.num}장 ${c.who}</b> — ${c.title} <small>${c.start}–${c.end}</small>${done ? ' ✓' : id === next ? ' ← 다음' : ''}</li>`;
  }).join('');
  const hasFacts = Object.keys(L.facts).length;
  const ov = $('#overlay');
  ov.className = 'show cinema title';
  ov.onclick = null;
  MUS.play('title');
  ov.innerHTML = `${cineHTML('title')}<div class="card">
    <h1>정상 보고</h1><p class="sub">1부 다섯 대의 휴대폰 · 2부 13시 · 3부 정상 보고</p>
    <p>10월 셋째 토요일, 해령산. 같은 날을 서로 다른 휴대폰으로 산다.<br>한 사람으로 내린 선택은 다음 사람의 하루에서 그 사람이 실제로 한 일이 된다.</p>
    <button class="big" data-act="start">${next ? `${CH_NUM[next]}장 시작` : '이 회차는 끝났다 — 새 회차 시작'}</button>
    <ul class="chs">${items}</ul>
    <label><input type="checkbox" id="opt-exp"> 4장 실험 모드: 신호·배터리 끄기</label>
    <label>속도 <select id="opt-speed"><option value="1">1× — 1초 = 1분</option><option value="2">2×</option><option value="0.5">0.5×</option></select></label>
    <div class="row">${btn('newrun', '새 회차 (장부 지우기)')}${btn('music', MUS.label())}</div>
    <p class="dim"><small data-act="adlog">v${VERSION} · 소리가 정보다. 이어폰을 권한다.<br>그림: FLUX 3 Klein으로 생성한 AI 그림 · 음악: MiniMax-Music3로 생성한 AI 음악 · 효과음: ElevenLabs</small></p>
    ${hasFacts ? `<h3>이번 회차 장부</h3>${factRows(() => true)}` : ''}
    ${L.contradictions.length ? `<h3>어긋난 기록</h3><ul class="facts">${L.contradictions.map((c) => `<li>${esc(c.text)}</li>`).join('')}</ul>` : ''}</div>`;
}

function copyLog() {
  const facts = Object.entries(L.facts).map(([id, f]) => `${id} (${PEOPLE[f.by]} ${hm(f.t)}): ${f.label}`);
  const text = ['# 정상 보고 장부', ...facts, '', '# 연결', ...L.links.map((l) => `${hm(l.t)} [${PEOPLE[l.ch]}] ${l.text}`),
    '', '# 어긋난 기록', ...L.contradictions.map((c) => c.text), '', '# 마지막 장 기록', ...(S ? S.log : [])].join('\n');
  try { navigator.clipboard.writeText(text); } catch (e) { /* 클립보드 불가 */ }
}

// ───────── 루프 ─────────
let lastReal = performance.now(), acc = 0, stepAt = 0, birdAt = 0;
setInterval(() => {
  const now = performance.now(), dt = Math.min(0.5, (now - lastReal) / 1000), prevReal = lastReal;
  lastReal = now;
  if (!S || S.over) return;
  if (BOT && C.bot) C.bot();
  if (!S.paused && !S.modal) {
    acc += dt * S.speed * (C.speedScale || 1);
    let n = 0;
    while (acc >= 1 && n < 40) { acc -= 1; n++; tick(); if (S.modal) break; }
    if (S.walking && S.seg && !busy() && now > stepAt) { AU.step(); stepAt = now + 560; }
    if (now > birdAt) { if (!here().noisy && !C.indoor && !C.still && S.t < toMin('14:00')) AU.bird(); birdAt = now + rand(3500, 9000); }
  }
  if (S.banner && now > S.banner.until) S.banner = null;
  if (S.call && S.call.state === 'talk' && !S.paused && now > S.call.nextAt && S.call.line < C.decisions[S.call.id].lines.length - 1) callAct('next');
  if (S.call && S.call.state === 'ring' && !S.paused) { S.call.left -= now - prevReal; if (S.call.left <= 0) { const id = S.call.id; endCall(); missCall(id, 'unanswered'); } }
  renderAll();
}, 100);

function boot() {
  ledgerLoad();
  for (const [id, c] of Object.entries(CHAPTERS)) c.id = id;
  if (params.has('autostart')) startChapter(params.get('ch') || nextChapter() || CH_ORDER[0], params.get('exp') === '1', Number(params.get('speed')) || 1);
  else if (params.has('intro')) startChapter(params.get('intro'));   // 장 시작 화면만 보기(스크린샷용)
  else showTitle();
}
