// 막간 연출: 타이틀·장 시작·장 끝에만 삽화(FLUX 3 Klein)와 음악(MiniMax-Music3)을 깐다.
// 플레이 중에는 그림도 음악도 없다 — 도시는 보이지 않고, 고요가 음악이다(기획서 §0, §10).
// 그림 원본과 지시문: assets/art/ (shots.json, picks.json), 음악: scripts/gen_music.py.

const ART = { title: 'title', misuk: 'ch1_misuk', hanul: 'ch2_hanul', yuna: 'ch3_yuna', jungwoo: 'ch4_jungwoo',
  doyun: 'ch5_doyun', part2: 'part2_noon', part3: 'part3_taeo', ending: 'ending' };
const CUE = { part2: 'noon', part3: 'snow', ending: 'snow' };   // 나머지는 theme
const SNOWY = ['part3', 'ending'];

// 떨어지는 단풍잎·눈. Math.random 은 테스트가 시드로 고정해 쓰므로 건드리지 않는다.
function cineFx(snow) {
  let s = '';
  for (let i = 0; i < 16; i++) {
    const x = (i * 37 + 11) % 100, d = 9 + ((i * 53) % 9), w = (i * 29) % 70 / 10;
    s += `<i style="left:${x}%;animation-duration:${d}s;animation-delay:-${w}s;--s:${snow ? 0.5 + (i % 3) * 0.2 : 0.7 + (i % 4) * 0.15}"></i>`;
  }
  return `<div class="fx ${snow ? 'snow' : 'leaf'}">${s}</div>`;
}

function cineHTML(key) {
  const snow = SNOWY.includes(key);
  return `<div class="cine k-${key}"><img src="art/${ART[key]}.webp" alt=""><div class="fog"></div>${cineFx(snow)}<div class="bars"></div></div>`;
}

// 장 시작: 그림 위에 장 이름이 먼저 뜨고, 잠시 뒤 안내 카드가 올라온다. 누르면 바로 넘긴다.
function cineReveal(ov) {
  ov.classList.add('reveal-run');
  const done = () => ov.classList.remove('reveal-run');
  if (typeof setTimeout === 'function') setTimeout(done, 3400);
  ov.onclick = (e) => { if (ov.classList.contains('reveal-run')) { e.stopPropagation(); done(); } };
}

const MUS = {
  el: null, key: null,
  on: (() => { try { return localStorage.getItem('summit-music') !== 'off'; } catch (e) { return true; } })(),
  play(key) {
    this.key = key;
    if (typeof Audio === 'undefined' || BOT || !this.on) return;
    const cue = CUE[key] || 'theme';
    if (this.el && this.el.dataset.cue === cue) { if (this.el.ended) { this.el.currentTime = 0; this.el.volume = 0; } this.resume(); return; }
    this.stop(900);
    const a = new Audio(`music/${cue}.m4a`);
    a.volume = 0; a.dataset.cue = cue;   // 한 번 흐르고 고요로 돌아간다(곡은 30초 안팎). 막간마다 처음부터 한 번
    this.el = a;
    this.resume();
  },
  // 브라우저는 첫 터치 전 소리를 막는다. 입력마다 불러 막혔던 곡을 튼다(이미 끝난 곡은 다시 틀지 않는다).
  resume() {
    const a = this.el;
    if (a && a.paused && !a.ended && this.on) a.play().then(() => this.fade(a, 0.4, 1800)).catch(() => {});
  },
  stop(ms = 1500) { const a = this.el; if (!a) return; this.el = null; this.out = a; this.fade(a, 0, ms, () => { a.pause(); if (this.out === a) this.out = null; }); },
  halt() { for (const a of [this.el, this.out]) if (a) a.pause(); },   // 앱이 멈출 때: 꺼지는 중인 곡까지
  fade(a, to, ms, done) {
    const from = a.volume, t0 = performance.now();
    const step = () => { const k = Math.min(1, (performance.now() - t0) / ms); a.volume = from + (to - from) * k; if (k < 1) requestAnimationFrame(step); else if (done) done(); };
    step();
  },
  toggle() {
    this.on = !this.on;
    try { localStorage.setItem('summit-music', this.on ? 'on' : 'off'); } catch (e) { /* 저장 불가 */ }
    if (this.on) this.play(this.key || 'title'); else this.stop(400);
  },
  label() { return this.on ? '♪ 음악 끄기' : '♪ 음악 켜기'; },
};
