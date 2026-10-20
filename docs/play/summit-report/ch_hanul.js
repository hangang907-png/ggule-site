'use strict';
// 2장 서하늘 — "라이브 중" (07:30–11:30, 주차장 → 능선 → 전망대)
// 읽는 사실: J1(쉼터 충전기 — 오미숙의 충전 기록), R1(산길 소문)
// 쓰는 사실: J4 능선의 붉은 등산복, J5 방송 제목, J6 폭음 녹화, J7 보조배터리, R2 결심
// 붉은 등산복이 본부장인지 대역인지는 이 장에서 알 수 없다. 4장과 5장의 기록이 정한다(R3).


CHAPTERS.hanul = {
  num: 2, who: '서하늘', title: '라이브 중', start: '07:30', end: '11:30', node: 'gate',
  mobile: true, pace: 1.6, chargeRate: 1.2, callDrain: 0.8, carrier: '산들모바일',
  drain: () => (S.x.live ? 0.6 : 0.1),
  intro: '등산 유튜버 "하늘길", 스물넷. 구독자 4만. 오늘은 단풍 절정이라 정상까지 라이브를 한다. 보조배터리는 두 개 챙겼다.',
  how: ['<b>W</b> 걷기/멈추기 · <b>Q/E</b> 몸 돌리기 · <b>Space</b> 일시정지',
    '휴대폰의 <b>라이브</b> 앱에서 방송을 켜고 끈다. 켜 둔 동안 일어난 일만 <b>녹화</b>된다',
    '방송 중에는 배터리가 여섯 배로 닳는다. 신호가 끊기면 방송도 끊긴다',
    '채팅창은 도시 소식이 가장 먼저, 가장 부정확하게 올라오는 곳이다'],
  inherited: () => inheritedNote(),
  resolvePrompt: () => `11시 반. 도시 쪽 하늘이 뿌옇다. ${S.x.live ? '채팅창은 산 이야기를 하지 않은 지 오래다.' : phoneUsable() ? '방송은 꺼져 있다.' : '휴대폰은 꺼져 있다.'} 서하늘은 어떻게 하기로 하는가?`,
  routes: { sns: 'news', press: 'news', poll: 'news' },
  channels: [
    { id: 'mom', name: '엄마', tag: '가족' },
    { id: 'editor', name: '편집자 준호', tag: '채널 편집' },
  ],
  apps: [['live', '라이브'], ['msg', '메신저'], ['news', '뉴스']],
  deadHint: '보조배터리나 쉼터 충전기가 필요하다. 꺼진 동안은 아무것도 찍히지 않는다',
  firstBoomLine: () => (S.node === 'gate' && !S.seg ? '주차장의 차들이 일제히 경보를 울린다. 사람들이 남쪽을 본다.' : '아래 주차장 쪽에서 차 경보가 한꺼번에 울린다. 앞서 가던 사람들이 멈춰 선다.'),
  ringtone: (a) => { a.tone(1568, 0.08, 0.05); a.tone(2093, 0.12, 0.05, 0.1); },

  decisions: {},

  trailEvents: {
    redman: {
      title: '능선의 붉은 등산복',
      text: () => `앞쪽 바위 구간에 붉은 등산복에 모자를 눌러쓴 남자가 혼자 걷는다. 걸음이 등산객 같지 않다. 휴대폰을 자꾸 본다.${S.x.live ? ' 방송은 켜져 있다.' : ' 방송은 꺼져 있다.'}`,
      options: () => [
        { id: 'sneak', label: '카메라를 슬쩍 그쪽으로 돌린다', note: S.x.live ? '방송에 그대로 나간다' : '녹화만 한다 · 배터리 −1%', disabled: !phoneUsable() },
        { id: 'selfie', label: '"안녕하세요! 같이 한 장 찍어도 돼요?"', note: '얼굴이 정면으로 남는다', disabled: !phoneUsable() },
        { id: 'ignore', label: '모른 척 지나간다' },
      ],
    },
    title: {
      title: '방송 제목',
      text: () => (S.x.live
        ? '채팅창이 갑자기 빨라진다. "방금 그 사람 해령시 안전본부장 아님?" "한정우 맞는 듯" "항만 터졌는데 본부장이 산에??"'
        : '어디서 본 얼굴이다. 뉴스다. 해령시 안전본부장 한정우. 항만이 터진 날, 본부장이 산에 있다.'),
      options: () => [
        { id: 'post', label: '방송 제목을 "본부장 등산 중?"으로 바꾼다', note: '시청자가 몰린다 · 되돌릴 수 없다', disabled: !phoneUsable() || signal() === 0 },
        { id: 'no', label: '확실하지 않다. 그대로 둔다' },
      ],
    },
    battery: {
      title: '전망대의 붉은 등산복',
      text: '난간 끝에 붉은 등산복 남자가 서 있다. 꺼진 휴대폰 화면을 들여다보다가 이쪽 가방의 보조배터리에 눈길을 준다. "…혹시 남는 거 있습니까."',
      options: () => [
        { id: 'give', label: '보조배터리 하나를 건넨다', note: `남은 보조배터리 ${S.powerbank}개 → ${S.powerbank - 1}개`, disabled: S.powerbank < 1 },
        { id: 'keep', label: '"죄송해요, 저도 방송해야 해서요."' },
      ],
    },
  },

  init() {
    S.battery = 100; S.powerbank = 2;
    S.x = { visited: [{ t: toMin('07:30'), node: 'gate' }], live: false, liveLog: [], liveMin: 0, viewers: 0, peak: 0, heat: 0, chat: [], nextChat: 0,
      title: '해령산 단풍 절정 라이브 🍁', j4: null, j4At: null, j5: null, j5At: null, j6: null, j7: null, j7At: null, viewAt: null, flash: false, liveAtBlast: false };
  },
  begin() {
    trailText('해령산 매표소 주차장. 07:30. 짐벌에 휴대폰을 끼운다. 단풍철이라 주차장은 벌써 꽉 찼다.', 'place');
    trailText('구석에 시동을 켠 채 서 있는 검은 세단이 하나 있다. 등산객 차 같지는 않다.', 'dim');
    queueMsg('editor', '썸네일 만들어 놨어. 방송 켜면 바로 올릴게', 0);
  },

  say(text, hot) {
    const x = S.x;
    x.chat.push({ t: S.t, text, hot: !!hot });
    if (x.chat.length > 40) x.chat.shift();
  },
  setLive(on, why) {
    const x = S.x;
    if (x.live === on) return;
    x.live = on;
    x.liveLog.push([S.t, on]);
    if (on) {
      x.viewers = Math.max(x.viewers, 20);
      // 첫인사는 그때 상황을 따른다. 폭음 뒤에 켜면 단풍 인사를 하지 않는다.
      if (x.liveLog.length > 1) trailText('방송을 다시 켠다.');
      else if (S.t < toMin('07:40')) trailText('방송을 켠다. "안녕하세요, 하늘길입니다! 오늘은 해령산 단풍이에요."');
      else if (S.t <= toMin('07:50')) {
        trailText('방송을 켠다. "여러분, 하늘길입니다. 방금 여기서 큰 소리가 났어요. 남쪽이에요."');
        this.say('무슨 소리요?', true); this.say('항만 쪽에서 터졌대요', true);
      } else {
        trailText('방송을 켠다. "여러분, 하늘길입니다. 뉴스 보셨죠. 저는 지금 해령산에 있어요."');
        this.say('거기서 도시 보여요?', true);
      }
      log('방송 시작');
    }
    else { trailText(why || '방송을 끈다.', why ? 'warn' : ''); log(`방송 끝${why ? ' (끊김)' : ''}`); x.viewers = Math.round(x.viewers * 0.4); }
  },

  timeline() {
    const t = S.t, x = S.x;
    if (t === toMin('07:40')) x.liveAtBlast = x.live;
    if (t === toMin('07:41')) {
      if (x.live && !x.liveAtBlast) {
        x.j6 = 'half'; x.heat += 150;
        trailText('방송을 켠 건 첫 폭음 뒤였다. 두 번째만 담겼다. 간격은 남지 않았다.', 'clue');
        this.say('방금 또 터짐', true);
        log('07:40 폭음: 두 번째만 녹화됨');
      } else if (x.live) {
        x.j6 = 'rec'; x.heat += 250;
        trailText('방송에 그대로 담겼다. 폭음 두 번과 그 간격까지.', 'clue');
        this.say('방금 뭐임???', true); this.say('소리 두 번 났음', true); this.say('항만 쪽 아님?', true);
        log('07:40 폭음 녹화됨');
      } else {
        x.j6 = 'missed';
        trailText('휴대폰은 짐벌에 끼운 채 꺼져 있었다. 아무것도 찍지 못했다.', 'dim');
      }
    }
    // 편집자는 방송이 켜져 있었는지에 따라 다른 말을 한다
    if (t === toMin('07:43')) {
      if (x.j6 === 'rec') queueMsg('editor', '방금 그거 방송에 그대로 나갔어. 클립 따 놓는다', 0, { urgent: true });
      else if (x.live) queueMsg('editor', '방금 소리 뭐야?? 일단 끄지 말고 계속 찍어', 0, { urgent: true });
      else queueMsg('editor', '방금 그 소리 뭐야?? 너 지금 주차장이지? 방송 당장 켜', 0, { urgent: true });
    }
    if (t === toMin('08:00')) queueMsg('mom', '하늘아 뉴스 봤니. 항만에서 큰 사고 났대. 너 어디니', 0, { urgent: true });
    if (t === toMin('09:11') && x.live) { x.heat += 120; this.say('또 터졌다', true); this.say('하늘길 거기서 보여요?', true); }
    if (t === toMin('09:15')) queueMsg('editor', '항만 2차 터졌대. 너 방송 켜져 있으면 지금 대박인데. 도시 쪽 보이는 데 없어?', 0);
    if (t === toMin('10:20')) {
      if (S.node === 'view' && !S.seg) {
        trailText('남서쪽 신시가지에서 파란 섬광이 튄다. 그리고 그 일대의 불빛이 한꺼번에 꺼진다.', 'flash');
        if (x.live) { x.flash = true; x.heat += 400; trailText('그 순간이 방송에 나갔다.', 'clue'); this.say('헐 방금 번쩍', true); this.say('신시가지 정전됨 우리 집임', true); log('10:20 변전소 섬광 생중계'); }
      } else if (x.live) this.say('신시가지 정전이래요', true);
    }
    if (t === toMin('10:25')) queueMsg('mom', '집 정전됐다 얘. 엄마는 괜찮아. 넌 내려오지 말고 거기 있어', 0);
    // J7: 전망대에 있어야만 생기는 기회
    if (t === toMin('10:35')) {
      if (S.node === 'view' && !S.seg) openTrailEvent('battery');
      else x.j7 = 'absent';
    }
    misukRumor();
  },

  tick() {
    const x = S.x;
    if (x.live && (!phoneUsable() || signal() === 0)) this.setLive(false, phoneUsable() ? '신호가 끊겼다. 방송이 끊겼다.' : '휴대폰이 꺼졌다. 방송이 끊겼다.');
    if (x.live) {
      x.liveMin++;
      const target = 120 + x.heat + (S.node === 'view' && !S.seg ? 150 : 0) + (x.j5 === 'post' ? 900 : 0);
      x.viewers += (target - x.viewers) * 0.08;
      x.heat *= 0.985;
      x.peak = Math.max(x.peak, Math.round(x.viewers));
      if (S.t >= x.nextChat) { const line = flavorPick('chat'); if (line) this.say(line); x.nextChat = S.t + 3 + Math.floor(Math.random() * 4); }
    } else x.viewers *= 0.97;
    // 쉼터 충전: 사장이 자기 휴대폰을 꽂을 시각이 되면 비켜 줘야 한다(1장 기록 재생)
    if (S.charging && shelterChargerBusy()) {
      const who = shelterChargerBusy();
      S.charging = false;
      if (who === 'owner') { trailText('사장이 미안한 얼굴로 자기 휴대폰을 꽂아야 한다고 한다.', 'dim', linkTag('J1')); noteLink('J1', '쉼터에서 충전하다 사장 휴대폰에 자리를 비켜 줬다'); }
      else trailText('충전기 주인이 돌아왔다. 휴대폰을 뽑아 비켜 준다.', 'dim');
    }
  },

  // 채팅창은 SNS가 가장 먼저 닿는 곳이다
  onDeliver(item) { if (item.src === 'sns' && S.x.live) this.say(item.text, true); },

  onWalk(seg) { if (seg.id === 'ridge' && S.prog > 0.5) openTrailEvent('redman'); },
  onArrive(n) {
    const x = S.x;
    if (n === 'view') { x.viewAt = S.t; if (x.live) x.heat += 100; }
    if (n === 'rest1' && L.tracks.misuk) {
      const busyNow = shelterChargerBusy() === 'owner';
      trailText(busyNow ? '매점 충전기엔 사장 휴대폰이 꽂혀 있다. 사장은 그 화면만 본다.' : '매점 충전기가 비어 있다. 사장은 TV만 본다.', 'dim', linkTag('J1'));
      noteLink('J1', busyNow ? '쉼터 충전기에 사장 휴대폰이 꽂혀 있었다' : '쉼터 충전기가 비어 있었다');
    }
  },

  onTrailChoice(id, opt) {
    const x = S.x;
    if (id === 'redman') {
      x.j4 = opt; x.j4At = S.t;
      // R2: 아직 플레이하지 않은 인물은 최소 반응만 한다
      if (opt === 'sneak') { if (!x.live) S.battery = Math.max(0, S.battery - 1); trailText('남자가 렌즈를 느낀 듯 모자를 더 눌러쓰고 걸음을 빨리한다.', 'clue'); if (x.live) x.heat += 150; }
      if (opt === 'selfie') { trailText('남자는 잠깐 멈칫하더니 고개만 끄덕인다. 찰칵. 말은 한마디도 없다.', 'clue'); if (x.live) x.heat += 200; }
      if (opt === 'ignore') trailText('남자를 지나쳐 앞서간다. 뒤에서 휴대폰 진동 소리가 들린다.', 'dim');
      S.later.push({ at: S.t + 4, key: 'recognize' });
    }
    if (id === 'title') {
      x.j5 = opt;
      if (opt === 'post') {
        x.j5At = S.t; x.title = '본부장 등산 중?'; x.heat += 300;
        if (!x.live) this.setLive(true);
        trailText('제목을 바꿨다. 시청자 수가 치솟는다.', 'clue');
        this.say('제목 ㅋㅋㅋㅋ', true); this.say('캡처해서 퍼감', true); this.say('기자들 보고 있나', true);
        log('방송 제목 변경: "본부장 등산 중?"');
      } else trailText('제목은 그대로 둔다. 채팅창만 저 혼자 떠든다.', 'dim');
    }
    if (id === 'battery') {
      x.j7 = opt; x.j7At = S.t;
      if (opt === 'give') { S.powerbank--; trailText('보조배터리를 건넨다. 남자는 고개를 숙이고 받는다. 이름도 묻지 않는다.', 'clue'); }
      else trailText('남자는 고개를 끄덕이고 난간 쪽으로 돌아선다.', 'dim');
    }
  },
  later(key) { if (key === 'recognize') openTrailEvent('title'); },

  act(k) {
    const x = S.x;
    if (k === 'live' && phoneUsable()) {
      if (!x.live && signal() === 0) { trailText('신호가 없다. 방송을 켤 수 없다.', 'warn'); return; }
      this.setLive(!x.live);
    }
    if (k === 'charge') {
      if (S.charging) { S.charging = false; trailText('충전기를 뽑는다.'); }
      else if (!shelterChargerBusy()) { S.charging = true; trailText('매점 충전기에 휴대폰을 꽂는다.'); noteLink('J1', '쉼터 충전기로 충전했다'); }
    }
  },

  head() { return trailHead(); },
  badge() { return { label: '방송 시간', value: `${S.x.liveMin}분` }; },
  bars() {
    const x = S.x;
    return [{ label: '체력', pct: S.stamina, text: Math.round(S.stamina), low: S.stamina < 25 },
            { label: '시청자', pct: x.viewers / 20, text: x.live ? `${Math.round(x.viewers)}명` : '방송 꺼짐' }];
  },
  rule() { return '<small>방송 중 배터리 −0.6%/분 (꺼 두면 −0.1) · 켜 둔 동안 일어난 일만 녹화된다 · 신호 0칸이면 방송이 끊긴다</small>'; },
  faceHint() { return S.facing === 0 ? ' (정상 쪽)' : facingCity() ? ' (도시 쪽)' : ''; },
  view() { return cityView(); },
  actions() {
    const b = walkButtons(), x = S.x;
    if (!busy() && !S.seg && NODES[S.node].charger) {
      if (S.charging) b.push(btn('charge', '충전기 뽑기'));
      else if (shelterChargerBusy()) b.push(btn('charge', CHARGER_BUSY[shelterChargerBusy()] + (shelterChargerBusy() === 'owner' ? linkTag('J1') : ''), true));
      else b.push(btn('charge', `충전기 꽂기<small>+1.2%/분 · 멈춰 있는 동안</small>${L.tracks.misuk ? linkTag('J1') : ''}`));
    }
    b.push(btn('live', x.live ? '● 방송 끄기' : '○ 방송 켜기<small>배터리 −0.6%/분 · 지금부터 녹화된다</small>', !phoneUsable()));
    if (S.powerbank > 0) b.push(btn('powerbank', `보조배터리 쓰기<small>+30% · ${S.powerbank}개 남음</small>`));
    return b.join('');
  },
  badges() { return { live: S.x.live ? '●' : 0 }; },
  views: {
    live() {
      const x = S.x;
      const chat = x.chat.slice(-14).map((c) => `<div class="${c.hot ? 'hot' : ''}"><b>${hm(c.t)}</b>${esc(c.text)}</div>`).join('');
      return `<div class="hdr">${btn('home', '‹')}<b>라이브</b><small>최고 ${x.peak}명</small></div>
        <div class="livebox ${x.live ? 'on' : ''}"><div>${x.live ? '<b class="rec">● LIVE</b>' : '○ 꺼짐'} · ${esc(x.title)}</div>
        <div class="cap">시청자 ${x.live ? Math.round(x.viewers) : 0}명 · 누적 ${x.liveMin}분 · 녹화: ${[x.j6 === 'rec' ? '07:40 폭음' : x.j6 === 'half' ? '07:40 두 번째 폭음' : null, x.j4 && x.j4 !== 'ignore' ? '능선의 남자' : null, x.flash ? '10:20 섬광' : null].filter(Boolean).join(', ') || '없음'}</div></div>
        <div class="pad">${btn('live', x.live ? '방송 끄기' : '방송 켜기')}</div>
        <div class="cap pad">채팅 — 미확인 소문이 섞여 있다</div><div class="chat">${chat || '<div class="dim">방송이 꺼져 있다</div>'}</div>`;
    },
  },

  resolve() {
    const where = S.seg ? SEG[S.seg].name : NODES[S.node].name, atTop = S.node === 'summit' && !S.seg;
    const power = phoneUsable() || S.powerbank > 0;   // 꺼진 휴대폰으로는 방송도 전송도 못 한다
    return [
      { id: 'summit', label: atTop ? '정상에 남아 끝까지 지켜본다' : '정상까지 올라가 끝까지 지켜본다',
        desc: `2부: ${power ? '방송할 수 있다' : '휴대폰이 꺼져 방송은 못 한다'} · 지금 ${where} · 배터리 ${Math.round(S.battery)}% · 보조배터리 ${S.powerbank}개` },
      { id: 'down', label: '산을 내려간다', desc: '2부: 하산 중 · 휴대폰은 아낀다' },
      { id: 'handover', label: '찍은 영상을 기자에게 넘긴다', desc: `3장: 영상이 정윤아에게 간다 · 2부: ${where}에 남는다` },
    ].filter((o) => o.id !== 'handover' || power);
  },
  onEnd(rid) {
    const x = S.x;
    const J4 = { sneak: '몰래 찍었다 — 남자는 모자를 눌러쓰고 걸음을 빨리했다', selfie: '같이 찍자고 했다 — 남자는 고개만 끄덕였다', ignore: '모른 척 지나갔다', unseen: '능선에 닿지 못해 마주치지 않았다' };
    const J7 = { give: '붉은 등산복에게 보조배터리를 줬다', keep: '보조배터리를 주지 않았다', absent: '10:35에 전망대에 없었다' };
    setFact('J4', x.j4 || 'unseen', J4[x.j4 || 'unseen'] + (x.j4At ? ` (${hm(x.j4At)})` : ''));
    setFact('J5', x.j5 === 'post' ? 'post' : 'no', x.j5 === 'post' ? `${hm(x.j5At)}에 제목을 "본부장 등산 중?"으로 바꿨다` : '제목을 바꾸지 않았다');
    setFact('J6', x.j6 || 'missed', { rec: '폭음 두 번을 방송으로 녹화했다', half: '두 번째 폭음만 찍혔다 — 간격은 남지 않았다', missed: '방송이 꺼져 있어 놓쳤다' }[x.j6 || 'missed']);
    setFact('J7', x.j7 || 'absent', J7[x.j7 || 'absent'] + (x.j7At ? ` (${hm(x.j7At)})` : ''));
    setFact('R2', rid, this.resolve().find((o) => o.id === rid).label);
    L.tracks.hanul = { visited: x.visited, j4At: x.j4At, j5At: x.j5At, j7At: x.j7At, viewAt: x.viewAt, live: x.liveLog, liveMin: x.liveMin, peak: x.peak, flash: x.flash,
      battery: Math.round(S.battery), powerbank: S.powerbank, resolve: rid, endT: S.t, pos: S.seg ? { seg: S.seg, prog: S.prog } : { node: S.node } };
  },

  // 봇: live=0(방송 안 켬) lateLive=1(첫 폭음 뒤에 켬) j4=sneak|selfie|ignore j5=no j7=keep r2=summit|down|handover slow=1(능선 전에 멈춤)
  bot() {
    const x = S.x, q = (k, d) => params.get(k) || d;
    if (S.modal) {
      if (S.modal.resolve) { const o = C.resolve(); act(`resolve:${(o.find((p) => p.id === q('r2', 'summit')) || o[0]).id}`); return; }
      const want = { redman: q('j4', 'sneak'), title: q('j5', 'post'), battery: q('j7', 'give') }[S.modal.id];
      const E = evDef(S.modal.id), o = E.options.find((p) => p.id === want && !p.disabled) || E.options[E.options.length - 1];
      act(`tev:${S.modal.id}:${o.id}`);
      return;
    }
    const spare = S.battery >= 8 || S.powerbank > 0;   // 마지막 몇 퍼센트는 남겨 둔다
    if (x.live && !spare) act('live');
    if (q('live', '1') === '1' && !x.live && spare && phoneUsable() && signal() > 0 && !(q('lateLive') && S.t < toMin('07:40'))) act('live');
    if (S.battery < 12 && S.powerbank > 0) act('powerbank');
    if (!S.seg && !busy()) {
      if (S.node === 'view' && S.t < toMin('10:40')) return;
      if (q('slow') && S.node === 'fork') return;
      const n = nextSegs();
      if (n.length && S.stamina > 30) act(`go:${n[0].id}`);
    } else if (S.seg && !S.walking && S.stamina > 30) act('walk');
    if (S.t - (S.botAt || 0) >= 20) { S.botAt = S.t; act('chan:mom'); act('chan:editor'); act('app:news'); act('app:live'); }
  },
};
