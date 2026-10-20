// 원스토어 원플레이(앱 안 웹뷰) 연동. SDK는 원스토어 판에만 들어간다(scripts/build_onestore.sh 가 머리에 모듈을 넣는다).
// 그 밖의 판(브라우저, itch, zip)에서는 PF.start() 가 곧장 boot() 한다.
// 규격: 원스토어 H5 Game SDK v1.1.0 — createSDK → initializeAsync → setLoadingProgress → startGameAsync,
// pause/resume/exit, onBackPressed(200ms 안 동기 회신), 전면 광고 showInterstitialAsync(서버 없이 된다).
// 외부 리뷰(studio reviews/2026-10-20 verdict-summit-onestore-sdk) 반영: exit 저장 조건, 늦은 초기화, 광고 연타, 무음.

const PF = {
  sdk: null,
  ad: '',          // 전면 광고 지면 ID(ONEconsole 수익화 > 인앱 광고에서 발급). 비어 있으면 광고를 띄우지 않는다
  adGap: 2,        // 장이 바뀔 때만, 1장이 끝난 뒤부터
  muted: false, booted: false, held: false, adToken: null,

  start() {
    if (!window.ONESTORE) { PF.bootOnce(); return; }
    // 모듈이 SDK를 받아 attach 를 부른다. 원스토어 CDN이 늦거나 막히면 먼저 띄우고, SDK가 오면 그때 초기화한다.
    PF.wait = setTimeout(PF.bootOnce, 8000);
  },
  bootOnce() { if (!PF.booted) { PF.booted = true; boot(); } },

  async attach(sdk) {
    clearTimeout(PF.wait);
    sdk.on('pause', () => PF.pause());
    sdk.on('resume', (ev) => PF.resume(ev));
    sdk.on('exit', () => PF.exit());
    sdk.onBackPressed(() => PF.back());
    let info = null;
    for (let i = 0; i < 3 && !info; i++) {   // 실패하면 다시 부를 수 있다(규격). 시간 초과만 다시 해 본다
      try { info = await sdk.initializeAsync(); } catch (e) { if (!e || e.reason !== 'timeout') break; }
    }
    if (!info || typeof info.err === 'string') { PF.bootOnce(); return; }   // 일반 브라우저에서 원스토어 판을 연 경우·초기화 실패
    PF.sdk = sdk;
    const sa = info.safeArea || {};
    for (const k of ['top', 'bottom', 'left', 'right']) document.documentElement.style.setProperty(`--sa-${k}`, `${sa[k] || 0}px`);
    PF.ringer(info.ringerSilent);
    sdk.setLoadingProgress(100);
    PF.bootOnce();
    sdk.startGameAsync().catch(() => {});   // 앱이 로딩 화면을 걷는 시점. 8초 폴백으로 먼저 떴어도 부른다
  },

  // 장부는 장이 끝날 때(finishChapter)와 새 회차에서만 저장한다(명세 §3). 장 도중이거나 아직 읽기 전이면 손대지 않는다.
  exit() {
    if (typeof L === 'undefined' || !L || (S && !S.over)) return;
    try { ledgerSave(); } catch (e) { /* 저장 실패는 다음 회차에 */ }
  },

  // 무음 모드면 음악만 끈다(효과음은 정보라 둔다). 플레이어가 끈 음악은 무음이 풀려도 켜지 않는다.
  ringer(silent) {
    if (typeof silent !== 'boolean') return;
    if (silent && MUS.on) { MUS.on = false; PF.muted = true; MUS.stop(200); }
    else if (!silent && PF.muted) { MUS.on = true; PF.muted = false; }
  },

  pause() {
    if (!PF.held) PF.held = !!(S && !S.over && !S.paused);
    if (PF.held) { S.paused = true; renderAll(); }
    if (AU.ctx && AU.ctx.state === 'running') AU.ctx.suspend();
    MUS.halt();
  },
  resume(ev) {
    if (ev) PF.ringer(ev.ringerSilent);
    AU.resume();
    MUS.resume();
    if (PF.held && S) { S.paused = false; renderAll(); }   // 앱이 멈춘 것만 되돌린다. 플레이어가 멈춘 것은 그대로
    PF.held = false;
  },

  // Android 백키: 휴대폰 앱 화면 → 홈, (좁은 화면) 휴대폰 탭 → 장소 탭. 그 밖은 앱의 종료 확인(→ exit).
  back() {
    if (!S || S.over || $('#overlay').classList.contains('show') || S.call) return false;
    const narrow = typeof matchMedia === 'function' && matchMedia('(max-width: 820px)').matches;
    if (!C.phoneView && S.app !== 'home' && (mview === 'phone' || !narrow)) { S.app = 'home'; renderAll(); return true; }
    if (narrow && mview === 'phone') { mview = 'trail'; renderAll(); return true; }
    return false;
  },

  // 다음 장으로 넘어갈 때 전면 광고 한 번. 실패·노필이어도 넘어간다. 기다리는 동안 다시 눌러도 한 번만, '처음으로'면 취소.
  between(go) {
    if (PF.adToken) return;
    if (!PF.sdk || !PF.ad || L.done.length < PF.adGap - 1 || !PF.sdk.ads.isSupported('interstitial')) { go(); return; }
    const token = PF.adToken = {};
    PF.sdk.ads.showInterstitialAsync({ placementId: PF.ad }).catch(() => {}).then(() => {
      if (PF.adToken !== token) return;
      PF.adToken = null;
      go();
    });
  },
  cancelAd() { PF.adToken = null; },
  preload() { if (PF.sdk && PF.ad) PF.sdk.ads.loadInterstitial({ placementId: PF.ad }); },
};
