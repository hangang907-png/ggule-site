'use strict';
// 3장 정윤아 — "마감 13:40" (09:00–12:30, 주차장 → 계곡 또는 능선 → 정상)
// 읽는 사실: J2(쉼터 사장의 증언), J5(방송 제목), R2(서하늘이 넘긴 영상 — J4·J6), R1(산길 소문)
// 쓰는 사실: J8 관용차 사진, J9 갈림길과 약수터 아이, J10 비서실장에게 건 전화, R3 결심
// 취재 수첩에는 "확인한 것"만 쌓인다. 무엇으로 확인했는지(사진·증언·제보·영상·목격)가 같이 남는다.

const CHILD_FROM = '10:10';   // 안개가 낀 뒤 아이가 일행을 놓친 시각. 4장도 같은 시각을 쓴다.
const NOTE_KIND = { tip: '제보', photo: '사진', testimony: '증언', video: '영상', seen: '목격' };

CHAPTERS.yuna = {
  num: 3, who: '정윤아', title: '마감 13:40', start: '09:00', end: '12:30', node: 'gate',
  mobile: true, pace: 1.6, drain: 0.08, chargeRate: 1.2,
  intro: '해령일보 사회부 기자, 서른여섯. 단풍 인파 스케치를 쓰러 산에 왔다. 항만이 터진 날에 산이라니, 운도 없다고 생각했다. 9시 정각에 모르는 번호로 메시지가 온다.',
  how: ['<b>W</b> 걷기/멈추기 · <b>Q/E</b> 몸 돌리기 · <b>Space</b> 일시정지',
    '<b>취재 수첩</b>에는 확인한 것만 쌓인다. 기사는 수첩에 있는 것으로만 쓸 수 있다',
    '계곡길은 빠르지만 신호가 없다. 능선길은 신호가 좋지만 멀다',
    '마감은 13:40이다'],
  inherited: () => inheritedNote(),
  resolvePrompt: '12시 반. 마감까지 70분. 수첩에 있는 것으로 정윤아는 무엇을 하기로 하는가?',
  routes: { sns: 'news', press: 'news', poll: 'news' },
  channels: [
    { id: 'tip', name: '발신번호 없음', tag: '익명 제보' },
    { id: 'desk', name: '사회부 강 부장', tag: '데스크' },
    { id: 'dm', name: '하늘길', tag: '등산 유튜버', hidden: () => !S.msgs.some((m) => m.ch === 'dm') },
  ],
  apps: [['msg', '메신저'], ['notes', '취재 수첩'], ['news', '뉴스'], ['call', '전화']],
  deadHint: '쉼터 충전기가 필요하다',
  firstBoomLine: '주변 등산객들이 멈춰 선다. 누군가 "또야?" 하고 중얼거린다.',
  ringtone: (a) => { a.buzz(2); },

  decisions: {},

  trailEvents: {
    car: {
      title: '주차장의 검은 세단',
      text: '주차장 구석, 시동이 걸린 검은 세단. 등산객 차들 사이에서 혼자 반짝인다. 뒷좌석에 누가 앉아 있다. 번호판은 해령 02가.',
      options: [{ id: 'shoot', label: '차와 번호판을 찍는다', note: '사진이 남는다 · 안에서도 이쪽이 보인다' }, { id: 'ignore', label: '눈여겨만 보고 지나간다' }],
    },
    owner: {
      title: '쉼터 사장',
      tag: () => linkTag('J1'),
      text: () => `매점 사장이 ${shelterChargerBusy() === 'owner' ? '충전기에 꽂아 둔 휴대폰과 TV를 번갈아 본다' : '휴대폰을 꼭 쥐고 TV만 본다'}. 손님이 불러도 한 박자 늦다.`,
      options: [{ id: 'ask', label: '"오늘 붉은 등산복 입은 남자 못 보셨어요?"', note: '5분' }, { id: 'pass', label: '물만 사고 나온다' }],
    },
    child: {
      title: '약수터의 아이',
      text: '약수터 옆에 초등학생 하나가 웅크리고 있다. 안개 속에서 엄마를 놓쳤다고 한다. 아무도 멈춰 주지 않았다고 한다. 여긴 전화도 안 된다.',
      options: [{ id: 'help', label: '아이를 데리고 계곡길을 내려가 본다', note: '30분 · 체력 −10 · 내내 신호 없음' }, { id: 'entrust', label: '내려가는 등산객에게 부탁하고 간다', note: '5분' }],
    },
  },

  init() {
    S.battery = 82; S.powerbank = 0;
    S.x = { visited: [{ t: toMin('09:00'), node: 'gate' }], notes: [], j8: null, j8At: null, route: null, j9: null, childAt: null, j10At: null, sawAt: null, askedOwner: false };
  },
  begin() {
    trailText('해령산 매표소 주차장. 09:00. 취재폰이 짧게 두 번 떤다.', 'place');
    queueMsg('tip', '오늘 항만 폭발은 사고가 아닙니다.', 0, { urgent: true, tip: true });
    queueMsg('tip', '안전본부장 한정우가 지금 해령산에 있습니다. 왜 하필 오늘인지 물어보세요.', 1, { tip: true });
    queueMsg('tip', '매표소 주차장에 시청 관용차가 서 있을 겁니다. 해령 02가.', 2);
  },

  addNote(k, text, kind) {
    const x = S.x;
    if (x.notes.some((n) => n.k === k)) return;
    x.notes.push({ k, t: S.t, text, kind });
    trailText(`취재 수첩: ${text}`, 'clue');
    log(`수첩(${NOTE_KIND[kind]}): ${text}`);
  },

  timeline() {
    const t = S.t, x = S.x, h = L.tracks.hanul;
    if (t === toMin('09:03')) { if (S.node === 'gate' && !S.seg) openTrailEvent('car'); else x.j8 = 'ignore'; }
    if (t === toMin('09:14')) queueMsg('desk', '윤아, 항만 2차 터졌다. 넌 산이지? 스케치는 됐고, 쓸 만한 거 있으면 13:40 마감 전에 올려.', 0);
    // J5: 서하늘이 제목을 바꿨다면 데스크가 캡처를 보낸다. 본부장이 산에 있다는 확인이 그만큼 앞당겨진다.
    if (factIs('J5', 'post') && h && t === Math.max(h.j5At + 6, toMin('09:10')))
      queueMsg('desk', '유튜버 "하늘길" 라이브 제목이 "본부장 등산 중?"이다. 캡처 보낸다. 네가 있는 그 산이야.', 0, { urgent: true, j5: true });
    if (t === toMin('10:30')) queueMsg('desk', '신시가지 정전. 시청은 아직 제대로 된 설명이 없다. 본부장 소재는 대변인실도 말을 안 해.', 0);
    // R2: 서하늘이 영상을 넘기기로 했다면 그 직후에 온다
    if (factIs('R2', 'handover') && h && t === h.endT + 2)
      queueMsg('dm', '기자님, 등산 유튜버 하늘길입니다. 오늘 산에서 찍은 영상 보내드려요. 써 주세요.', 0, { urgent: true, handover: true });
    if (t === toMin('12:00')) queueMsg('desk', '13:40 마감이다. 확인된 것만이라도 올려.', 0, { urgent: true });
    if (t === toMin('12:10') && S.node === 'summit' && !S.seg) {
      x.sawAt = t;
      trailText('정상석 너머, 인증샷 줄에서 떨어진 바위 끝에 붉은 등산복 하나가 도시를 내려다보고 서 있다. 멀다. 얼굴은 안 보인다.', 'clue');
      this.addNote('summit', '12:10 정상에서 붉은 등산복을 봤다 (얼굴 미확인)', 'seen');
    }
    misukRumor();
  },

  tick() {
    if (S.charging && shelterChargerBusy()) { S.charging = false; trailText(shelterChargerBusy() === 'owner' ? '사장이 미안한 얼굴로 자기 휴대폰을 꽂아야 한다고 한다.' : '충전기 주인이 돌아왔다. 휴대폰을 뽑아 비켜 준다.', 'dim'); }
  },

  onRead(m) {
    const h = L.tracks.hanul;
    if (m.tip) this.addNote('tip', '익명 제보: "사고가 아니다. 본부장은 지금 해령산에 있다"', 'tip');
    if (m.j5) {
      this.addNote('boss', `한정우 본부장이 해령산에 있다 (하늘길 라이브 캡처, ${hm(h.j5At)})`, 'video');
      noteLink('J5', '유튜버의 방송 제목으로 본부장이 산에 있다는 걸 확인했다');
    }
    if (m.handover) {
      if (factIs('J6', 'rec')) this.addNote('blast', '07:40 폭음 두 번의 녹화본 (하늘길 영상)', 'video');
      if (factIs('J4', 'sneak') || factIs('J4', 'selfie')) this.addNote('ridge', `${hm(h.j4At)} 능선의 붉은 등산복 영상 (하늘길 영상)`, 'video');
      if (h.flash) this.addNote('flash', '10:20 변전소 섬광 생중계 영상 (하늘길 영상)', 'video');
      noteLink('R2', '하늘길에게서 영상을 넘겨받았다');
    }
  },

  onWalk(seg) { if (!S.x.route && (seg.id === 'ridge' || seg.id === 'valley')) S.x.route = seg.id; },
  onArrive(n) {
    const x = S.x, m = L.tracks.misuk;
    if (n === 'rest1' && m) {
      if (m.resolve === 'pickup' && S.t >= m.endT) { trailText('쉼터 셔터가 반쯤 내려져 있다. "급한 일로 잠시 닫습니다."', 'dim', linkTag('R1')); noteLink('R1', '쉼터가 닫혀 있었다'); }
      else openTrailEvent('owner');
    }
    if (n === 'spring' && S.t >= toMin(CHILD_FROM)) openTrailEvent('child');
  },

  onTrailChoice(id, opt) {
    const x = S.x;
    if (id === 'car') {
      x.j8 = opt; x.j8At = S.t;
      if (opt === 'shoot') {
        // R2: 아직 플레이하지 않은 인물은 최소 반응만 한다
        trailText('셔터 소리. 뒷좌석 창이 소리 없이 올라간다.', 'clue');
        this.addNote('car', `시청 관용차 사진 (${hm(S.t)} 매표소 주차장, 뒷좌석에 사람)`, 'photo');
      } else trailText('번호판 앞자리만 외워 둔다.', 'dim');
    }
    if (id === 'owner') {
      if (opt !== 'ask') return;
      x.askedOwner = true; S.busyUntil = S.t + 5;
      const m = L.tracks.misuk;
      // 1장의 증언이 그대로 나온다(R1)
      for (const line of m.testimony.filter((s) => !s.includes('경비'))) trailText(`사장: "${line.slice(0, 5)}쯤이었나. ${line.slice(6)}."`, 'clue', linkTag('J1'));
      this.addNote('owner', `쉼터 사장 증언: ${m.testimony.filter((s) => !s.includes('경비')).map((s) => s.slice(0, 5)).join(', ')}에 붉은 등산복`, 'testimony');
      noteLink('J1', '쉼터 사장에게서 붉은 등산복 목격담을 들었다');
      if (factIs('J2', 'tell')) {
        trailText('사장이 목소리를 낮춘다. "딸이 그러는데 3부두 경비들이 새벽에 다 철수했대요. 그 손님한테 그 얘길 했더니 굳더라고요."', 'clue', linkTag('J2'));
        this.addNote('guard', '3부두 경비가 폭발 전 새벽에 철수했다 (쉼터 사장 딸의 전언)', 'testimony');
        noteLink('J2', '쉼터 사장이 경비 철수 이야기를 기자에게도 했다');
      }
    }
    if (id === 'child') {
      x.j9 = opt; x.childAt = S.t;
      sawLooks('child', 'walked_past');   // 아이의 말: 그때까지 아무도 멈춰 주지 않았다
      this.addNote('child', `약수터에서 길 잃은 아이 민준(9)을 만났다 (${hm(S.t)})`, 'seen');
      if (opt === 'help') {
        S.busyUntil = S.t + 30; S.stamina = Math.max(0, S.stamina - 10);
        S.later.push({ at: S.t + 30, key: 'childBack' });
        trailText('아이 손을 잡고 계곡길을 되짚어 내려간다.');
      } else { S.busyUntil = S.t + 5; trailText('내려가던 부부에게 아이를 부탁한다. 명함을 한 장 쥐여 준다.'); }
    }
  },
  later(key) { if (key === 'childBack') trailText('계곡길 중간에서 아이를 찾아 올라오던 엄마를 만났다. 연신 고개를 숙인다. "기자님이세요? 나중에 꼭 연락드릴게요." 약수터로 되돌아왔다.'); },

  act(k) {
    const x = S.x;
    // J10: 아직 플레이하지 않은 인물에게 건 전화는 부재중으로 남는다(R5)
    if (k === 'dial' && phoneUsable() && signal() >= 2 && !x.j10At && x.notes.some((n) => n.k === 'tip')) {
      x.j10At = S.t; S.busyUntil = S.t + 2; S.walking = false;
      if (!S.exp) S.battery = Math.max(0, S.battery - 1);
      trailText('시장 비서실장 김도윤. 신호가 간다. 다섯 번, 여섯 번. 받지 않는다. 음성사서함에 이름과 용건을 남긴다.', 'clue');
      log('전화: 김도윤 비서실장 (받지 않음, 음성 남김)');
    }
    if (k === 'charge') {
      if (S.charging) { S.charging = false; trailText('충전기를 뽑는다.'); }
      else if (!shelterChargerBusy()) { S.charging = true; trailText('매점 충전기에 취재폰을 꽂는다.'); }
    }
  },

  head() { return trailHead(); },
  badge() { return { label: '수첩', value: `${S.x.notes.length}건` }; },
  bars() {
    const left = toMin('13:40') - S.t;
    return [{ label: '체력', pct: S.stamina, text: Math.round(S.stamina), low: S.stamina < 25 },
            { label: '마감', pct: (left / 280) * 100, text: `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`, low: left < 90 }];
  },
  rule() { return '<small>기사는 수첩에 있는 것으로만 쓴다 · 계곡길은 신호 0칸 · 전화는 신호 2칸부터</small>'; },
  faceHint() { return S.facing === 0 ? ' (정상 쪽)' : facingCity() ? ' (도시 쪽)' : ''; },
  view() { return cityView(); },
  actions() {
    const b = walkButtons();
    if (!busy() && !S.seg && NODES[S.node].charger) {
      if (S.charging) b.push(btn('charge', '충전기 뽑기'));
      else b.push(btn('charge', shelterChargerBusy() ? CHARGER_BUSY[shelterChargerBusy()] : '충전기 꽂기<small>+1.2%/분</small>', !!shelterChargerBusy()));
    }
    return b.join('');
  },
  badges() { return { notes: S.x.notes.length }; },
  views: {
    notes() {
      const rows = S.x.notes.map((n) => `<div class="note">${esc(n.text)}<em>${NOTE_KIND[n.kind]} · ${hm(n.t)}</em></div>`).join('');
      return `<div class="hdr">${btn('home', '‹')}<b>취재 수첩</b><small>${S.x.notes.length}건</small></div>
        <div class="cap pad">확인한 것만 적힌다. 무엇으로 확인했는지가 같이 남는다.</div>${rows || '<div class="dim pad">아직 아무것도 없다</div>'}`;
    },
    call() {
      const x = S.x, sig = signal();
      const body = x.j10At
        ? `<div class="sent"><b>${hm(x.j10At)}</b> 김도윤 비서실장 <small>받지 않음 · 음성 남김</small></div>`
        : !x.notes.some((n) => n.k === 'tip') ? '<div class="dim">아직 누구에게 무엇을 물어야 할지 모른다.</div>'
        : btn('dial', `김도윤 비서실장에게 전화<small>시장 비서실 · 본부장 일정에 대한 코멘트 요청${sig < 2 ? ' · 신호 부족' : ''}</small>`, sig < 2);
      return `<div class="hdr">${btn('home', '‹')}<b>전화</b></div><div class="pad">${body}<div class="cap">건 전화는 상대 휴대폰에 그 시각의 부재중 전화로 남는다.</div></div>`;
    },
  },

  resolve() {
    const n = S.x.notes.length, where = S.seg ? SEG[S.seg].name : NODES[S.node].name;
    return [
      { id: 'file', label: '지금까지 확인한 것만 송고한다', desc: `2부: 13:40 기사 — 수첩 ${n}건으로 쓴다` },
      { id: 'hold', label: '확인될 때까지 기사를 붙잡는다', desc: '2부: 마감을 넘길 수 있다 · 계속 취재' },
      { id: 'ask', label: '본부장을 찾아 직접 묻는다', desc: `2부: 산에서 대면 · 지금 ${where}` },
    ];
  },
  onEnd(rid) {
    const x = S.x;
    const j9 = x.j9 || (x.route === 'ridge' ? 'ridge' : 'none');
    const J9 = { help: `계곡길 — 약수터 아이를 엄마에게 데려다줬다 (${hm(x.childAt || 0)})`, entrust: `계곡길 — 아이를 내려가는 등산객에게 맡겼다 (${hm(x.childAt || 0)})`,
      ridge: '능선길 — 약수터를 지나지 않았다', none: '약수터에서 아이를 만나지 못했다' };
    setFact('J8', x.j8 === 'shoot' ? 'shoot' : 'ignore', x.j8 === 'shoot' ? `관용차와 번호판을 찍었다 (${hm(x.j8At)})` : '관용차를 찍지 않았다');
    setFact('J9', j9, J9[j9]);
    setFact('J10', x.j10At ? 'called' : 'none', x.j10At ? `${hm(x.j10At)}에 전화했다 — 받지 않아 음성을 남겼다` : '전화하지 않았다');
    setFact('R3', rid, this.resolve().find((o) => o.id === rid).label);
    L.tracks.yuna = { visited: x.visited, j8At: x.j8 === 'shoot' ? x.j8At : null, childAt: x.childAt, j10At: x.j10At, sawAt: x.sawAt, notes: x.notes, askedOwner: x.askedOwner,
      battery: Math.round(S.battery), resolve: rid, endT: S.t, pos: S.seg ? { seg: S.seg, prog: S.prog } : { node: S.node } };
  },

  // 봇: j8=ignore route=ridge j9=entrust j10=0(전화 안 함) ask=0(사장에게 묻지 않음) r3=file|hold|ask
  bot() {
    const x = S.x, q = (k, d) => params.get(k) || d;
    if (S.modal) {
      if (S.modal.resolve) { act(`resolve:${q('r3', 'file')}`); return; }
      const want = { car: q('j8', 'shoot'), owner: q('ask', '1') === '1' ? 'ask' : 'pass', child: q('j9', 'help') }[S.modal.id];
      act(`tev:${S.modal.id}:${want}`);
      return;
    }
    if (q('j10', '1') === '1' && !x.j10At && S.t >= toMin('09:20') && signal() >= 2) act('dial');
    if (!S.seg && !busy()) {
      if (S.node === 'gate' && S.t < toMin('09:04')) return;
      const n = nextSegs();
      if (n.length && S.stamina > 30) act(`go:${(S.node === 'fork' && q('route') !== 'ridge' ? n[n.length - 1] : n[0]).id}`);
    } else if (S.seg && !S.walking && S.stamina > 30 && !busy()) act('walk');
    if (S.t - (S.botAt || 0) >= 15) { S.botAt = S.t; for (const c of ['tip', 'desk', 'dm']) if (chShown(c)) act(`chan:${c}`); act('app:call'); act('app:news'); act('app:notes'); }
  },
};
