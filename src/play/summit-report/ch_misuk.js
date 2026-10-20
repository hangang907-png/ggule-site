'use strict';
// 1장 오미숙 — "충전기는 하나" (06:30–10:30, 참나무 쉼터)
// 쓰는 사실: J1 충전기·보조배터리, J2 손님에게 한 말, J3 다은의 행선지, R1 결심
// 한정우는 아직 플레이하지 않은 인물이라 R2(최소 반응)로만 나온다.

CHAPTERS.misuk = {
  num: 1, who: '오미숙', title: '충전기는 하나', start: '06:30', end: '10:30', node: 'rest1',
  mobile: false, indoor: true, phoneClass: 'old', drain: 0.15, chargeRate: 0.6, callDrain: 1.0,
  intro: '참나무 쉼터 사장, 쉰여덟. 어젯밤 휴대폰 충전을 깜빡했다. 딸 다은은 항만 4부두 앞 원룸에 산다. 오늘은 단풍 절정이라 손님이 많을 것이다.',
  how: ['<b>Q/E</b> 몸 돌리기 — 남쪽 창을 보면 도시 쪽 하늘이 보인다', '가게 충전기는 <b>하나</b>뿐이다',
    '문자 대화방을 열어야 내용을 읽은 것이다. 잠금화면 미리보기는 한 줄뿐', '<b>Space</b> 일시정지 · <b>T</b> 실제 상황(개발용)'],
  resolvePrompt: '10시 반. 도시 소식은 계속 나빠진다. 오미숙은 어떻게 하기로 하는가?',
  routes: { sns: 'merchants', press: 'news', poll: 'news' },
  channels: [
    { id: 'daughter', name: '우리 다은이', tag: '딸' },
    { id: 'merchants', name: '해령산 상인회', tag: '단톡방 · 퍼온 글 많음' },
  ],
  msgTitle: '문자',
  apps: [['msg', '문자'], ['news', '뉴스'], ['calls', '전화']],
  deadHint: '충전기에 꽂아야 켜진다',
  firstBoomLine: '손님들이 일제히 남쪽 창으로 고개를 돌린다. 누군가 컵을 떨어뜨린다.',
  ringtone: (a) => { [523, 659, 784, 659].forEach((f, i) => a.tone(f, 0.18, 0.04, i * 0.2, 'square')); },

  decisions: {
    dcall: {
      title: '다은의 전화', ch: 'daughter', caller: '우리 다은이', closes: '08:10',
      lines: ['엄마!! 방금 항만에서 엄청 크게 터졌어. 창문이 다 흔들렸어.',
              '3부두 쪽이야. 연기가 막 올라와. 엄마 거기서도 들렸어?'],
      missed: ['엄마 전화 좀 받아', '항만 터졌어. 창문 다 흔들렸어. 연기 엄청나'],
      options: [{ id: 'out', label: '"얼른 밖으로 나가! 창문 닫고!"' }, { id: 'calm', label: '"진정해. 엄마가 뉴스 볼게."' }],
    },
    where: {
      title: '다은의 행선지', ch: 'daughter', caller: '우리 다은이', closes: '09:30',
      options: [{ id: 'station', label: '"역으로 가. 기차 타고 엄마한테 와."' }, { id: 'shelter', label: '"동사무소 대피소에 있어."' }],
    },
    // 마음이 바뀌면 한 번 더 보낼 수 있다. 다은이 이미 도착한 뒤라면 늦은 것이다.
    toShelter: { title: '다은에게 다시', ch: 'daughter', caller: '우리 다은이', closes: '10:30', options: [{ id: 'go', label: '"역은 가지 마. 동사무소 대피소로 가."' }] },
    toStation: { title: '다은에게 다시', ch: 'daughter', caller: '우리 다은이', closes: '10:30', options: [{ id: 'go', label: '"거기 있지 말고 역으로 가. 기차 타고 와."' }] },
  },

  trailEvents: {
    guest: {
      title: '붉은 등산복 손님',
      text: () => `남자가 계산대로 온다. "사장님, 혹시 충전 좀 할 수 있을까요? 오늘 하루 종일 버텨야 해서요." 충전기엔 ${S.charging ? '당신 휴대폰이 꽂혀 있다' : '아무것도 꽂혀 있지 않다'}.`,
      options: () => [
        { id: 'charger', label: S.charging ? '내 휴대폰을 뽑고 충전기를 내준다' : '충전기를 쓰라고 한다', note: '손님이 있는 동안 내 휴대폰은 충전 못 한다' },
        { id: 'powerbank', label: '마지막 보조배터리를 내준다', note: '내 비상용이 없어진다', disabled: S.powerbank < 1 },
        { id: 'none', label: S.charging ? '"죄송해요, 제 것도 충전해야 해서요."' : '"충전기는 지금 못 써요."' },
      ],
    },
    gossip: {
      title: '붉은 등산복 손님',
      text: '남자가 TV 쪽을 힐끗 본다. 새벽에 다은이가 보낸 문자가 떠오른다. "3부두 경비 아저씨들 새벽에 싹 철수했어."',
      options: [{ id: 'tell', label: '"항만 쪽이 좀 이상하대요. 경비들이 새벽에 다 철수했다고…"' }, { id: 'quiet', label: '말하지 않는다' }],
    },
  },

  init() {
    S.battery = 0; S.powerbank = 1; S.facing = 0;
    S.x = { queue: 2, anx: 15, tv: false, tvSeen: 0, plugLog: [], guestHere: false, guestCharging: false, guestLeft: null,
      j1: null, j2: 'unknown', where: null, clueRead: false, lastContact: null, testimony: [] };
  },
  begin() {
    trailText('셔터를 올린다. 참나무 쉼터. 휴대폰은 꺼져 있다. 어젯밤 충전을 깜빡했다.', 'place');
    // 휴대폰이 꺼져 있는 동안 온 문자 — 켜지는 순간 몰려 들어온다(R4)
    queueMsg('daughter', '엄마 오늘 가게 일찍 열지? 단풍철이라 사람 많겠다', toMin('05:50') - S.t);
    queueMsg('daughter', '나 오늘 쉬는 날이라 늦잠 자려 했는데 밖이 시끄러워서 깼어', toMin('06:12') - S.t);
    queueMsg('daughter', '근데 이상해. 3부두 경비 아저씨들 새벽에 싹 철수했어. 차도 다 빠지고. 정비한다더니', toMin('06:40') - S.t, { clue: true });
  },

  timeline() {
    const t = S.t, x = S.x;
    if (t === toMin('07:05')) {
      trailText('붉은 등산복 하나가 쉼터 앞을 인사도 없이 빠르게 지나 올라간다.', 'dim');
      x.testimony.push('07:05 붉은 등산복 남자가 쉬지 않고 지나갔다');
    }
    if (t === toMin('07:20')) {
      x.guestHere = true;
      trailText('붉은 등산복에 모자를 눌러쓴 남자가 들어와 구석 자리에 앉는다. 휴대폰 화면을 자꾸 확인한다.', 'place');
      x.testimony.push('07:20 붉은 등산복 손님이 들어와 충전을 부탁했다');
    }
    if (t === toMin('07:22')) openTrailEvent('guest');
    if (t === toMin('07:41')) x.anx += 25;
    if (t === toMin('07:42')) incomingCall('dcall');
    if (t === toMin('07:47') && x.guestHere) {
      x.guestHere = false; x.guestLeft = t;
      trailText('붉은 등산복 손님이 휴대폰을 보더니 급히 일어선다. 인사도 없이 나간다.', 'place');
      x.testimony.push('07:47 붉은 등산복 손님이 폭음 직후 급히 나갔다');
      if (x.guestCharging) { x.guestCharging = false; trailText('충전기가 비었다.', 'dim'); }
    }
    if (t === toMin('07:55')) queueMsg('daughter', '연기가 창문으로 들어와. 나가야 될 것 같아', 0, { urgent: true });
    if (t === toMin('08:20')) {
      openDecision('where');
      queueMsg('daughter', '엄마 어떡해? 역 가서 기차 타고 엄마한테 갈까? 아니면 동사무소 대피소 갈까?', 0, { dec: 'where', urgent: true });
    }
    if (t === toMin('09:11')) x.anx += 15;
    if (t === toMin('09:12')) queueMsg('daughter', '또 터졌어?? 엄마 거기는 괜찮아?', 0, { urgent: true });
    if (t === toMin('09:30') && !x.where) {
      x.where = 'station_default';
      S.decisions.where.status = 'expired';
      log('결정 마감: 다은의 행선지 → 답하지 못함');
      queueMsg('daughter', '엄마 답이 없어서 일단 역으로 갈게. 기차 타면 연락할게', 0, { urgent: true, dec: 'toShelter' });
      this.daughterPath('station', 0);
    }
  },

  // 다은의 이후 문자. 엄마의 답(또는 무응답)에 따라 갈린다. 가는 데 걸리는 시간이 지나면 되돌릴 수 없다.
  daughterPath(where, lag) {
    const x = S.x, p = { path: true };
    x.heading = where; x.arriveAt = S.t + lag + (where === 'station' ? 50 : 25);
    if (where === 'station') {
      queueMsg('daughter', '역 가는 중. 버스가 다 끊겨서 걸어가', lag + 25, p);
      queueMsg('daughter', '역 도착. 사람 엄청 많아. 기차 다 지연이래', lag + 50, { path: true, dec: 'toShelter' });
      queueMsg('daughter', '12시 40분 기차표 끊었어. 역에서 기다릴게', Math.max(lag + 70, toMin('10:12') - S.t), p);
    } else {
      queueMsg('daughter', '대피소 왔어. 동네 사람들 다 있어', lag + 25, { path: true, dec: 'toStation' });
      queueMsg('daughter', '여기 정전됐어. 깜깜해 ㅠ', Math.max(lag + 30, toMin('10:22') - S.t), p);
      queueMsg('daughter', '휴대폰 아껴 쓸게. 배터리 15%', Math.max(lag + 35, toMin('10:26') - S.t), p);
    }
    openDecision(where === 'station' ? 'toShelter' : 'toStation');
  },
  // 엄마가 말을 바꿨다. 아직 가는 길이면 돌아서고, 이미 닿았으면 못 움직인다.
  redirect(to) {
    const x = S.x;
    x.changed = S.t;
    if (S.t >= x.arriveAt) {
      x.tooLate = true; x.anx += 10;
      queueMsg('daughter', to === 'shelter' ? '엄마 나 벌써 역이야. 사람이 너무 많아서 지금은 못 나가. 여기 있을게' : '엄마, 지금은 밖에 못 나가. 여기 사람들이 나가지 말래', 1, { urgent: true });
      return;
    }
    S.inbox = S.inbox.filter((it) => !it.item.path);   // 가던 길의 소식은 오지 않는다
    x.where = to;
    queueMsg('daughter', to === 'shelter' ? '알았어 엄마. 돌아갈게. 대피소로 갈게' : '알았어. 지금 나가서 역으로 갈게', 1);
    this.daughterPath(to, 1);
  },

  tick() {
    const x = S.x, t = S.t;
    // 손님: 아침 피크, 사고 소식 이후엔 줄어든다
    const p = t < toMin('07:30') ? 0.12 : t < toMin('09:30') ? 0.22 : 0.08;
    if (Math.random() < p) x.queue++;
    if (x.queue >= 8) { x.queue -= 2; x.anx += 3; trailText('계산을 기다리던 등산객 둘이 투덜대며 나간다.', 'dim'); }
    // 사고 이후 딸 소식이 30분 넘게 없으면 불안이 쌓인다
    if (t >= toMin('07:40') && t - (x.lastContact || toMin('07:40')) > 30) x.anx += 0.25;
    x.anx = clamp(x.anx, 0, 100);
    if (x.tv) {
      const seen = S.pressAll.filter((n) => n.at <= t);
      while (x.tvSeen < seen.length) { trailText(`TV: ${seen[x.tvSeen].text}`, 'clue'); x.tvSeen++; x.nextTv = t + 6; }
      if (t >= (x.nextTv || 0)) { const line = flavorPick('tv'); if (line) trailText(`TV: ${line}`, 'dim'); x.nextTv = t + 11 + Math.floor(Math.random() * 7); }
    }
  },

  onRead(m) {
    if (m.clue) {
      S.x.clueRead = true;
      // 손님이 아직 가게에 있고 충전 이야기가 끝났다면, 지금이라도 말할 기회가 생긴다
      if (S.x.guestHere && S.x.j1 && !S.flags.ev_gossip) openTrailEvent('gossip');
    }
    if (m.ch === 'daughter' && !m.mine && S.t >= toMin('07:40')) { S.x.lastContact = S.t; S.x.anx = Math.max(0, S.x.anx - 10); }
  },
  onAnswer(id) { if (id === 'dcall') { S.x.lastContact = S.t; S.x.anx = Math.max(0, S.x.anx - 15); } },

  applyDecision(id, opt) {
    const x = S.x;
    if (id === 'dcall') queueMsg('daughter', opt === 'out' ? '알았어 일단 나갈게' : '응… 근데 무서워 엄마', 3);
    if (id === 'where') {
      x.where = opt;
      queueMsg('daughter', opt === 'station' ? '알았어. 역으로 갈게. 기차 타면 연락할게' : '알았어. 동사무소 대피소 갈게', 1, { dec: opt === 'station' ? 'toShelter' : 'toStation' });
      this.daughterPath(opt, 1);
    }
    if (id === 'toShelter') this.redirect('shelter');
    if (id === 'toStation') this.redirect('station');
  },

  onTrailChoice(id, opt) {
    const x = S.x;
    if (id === 'guest') {
      x.j1 = opt;
      if (opt === 'charger') {
        if (S.charging) { S.charging = false; x.plugLog.push([S.t, false]); }
        x.guestCharging = true;
        trailText('남자가 고개를 숙이고 휴대폰을 꽂는다.');
      } else if (opt === 'powerbank') {
        S.powerbank = 0;
        trailText('서랍에서 마지막 보조배터리를 꺼내 준다. 남자가 지갑을 꺼내려 하자 손을 젓는다.');
      } else trailText('남자는 말없이 고개를 끄덕이고 자리로 돌아간다.');
      if (x.clueRead) openTrailEvent('gossip');
    }
    if (id === 'gossip') {
      x.j2 = opt;
      if (opt === 'tell') {
        // R2: 아직 플레이하지 않은 인물은 최소 반응만 한다
        trailText('남자가 잠깐 굳는다. 대답 없이 고개만 끄덕인다.', 'clue');
        sawLooks('gossip', 'silent');
        x.testimony.push(`${hm(S.t)} 손님에게 "경비가 새벽에 다 철수했대요"라고 말했다. 손님은 굳은 채 고개만 끄덕였다`);
      }
    }
  },

  act(k) {
    const x = S.x;
    if (k === 'serve' && x.queue > 0 && !busy()) {
      S.busyUntil = S.t + (x.anx >= 70 ? 6 : 3);
      x.queue--;
      const line = flavorPick('customers');
      if (line) trailText(`손님: ${line}`, 'dim');
    }
    if (k === 'tv') {
      x.tv = !x.tv;
      if (x.tv) x.nextTv = S.t;
    }
    if (k === 'plug' && !(x.guestHere && x.guestCharging)) {
      S.charging = !S.charging;
      x.plugLog.push([S.t, S.charging]);
      trailText(S.charging ? '내 휴대폰을 충전기에 꽂는다.' : '휴대폰을 충전기에서 뽑는다.');
    }
  },

  head() {
    const x = S.x;
    const charger = x.guestHere && x.guestCharging ? '손님 사용 중' : S.charging ? '내 휴대폰' : '비어 있음';
    return { place: '참나무 쉼터', sub: `고도 410m · TV ${x.tv ? '켜짐' : '꺼짐'} · 충전기: ${charger}${busy() ? ' · 손님 응대 중' : ''}` };
  },
  badge() { return { label: '다은 마지막 연락', value: S.x.lastContact ? hm(S.x.lastContact) : '—' }; },
  bars() {
    const x = S.x;
    return [{ label: '손님', pct: x.queue * 10, text: `${x.queue}명`, low: x.queue >= 7 },
            { label: '불안', pct: x.anx, text: Math.round(x.anx), low: x.anx >= 70 }];
  },
  rule() { return '<small>불안 70 이상: 손이 떨려 응대가 두 배로 걸린다 · 손님 8명이 넘으면 떠난다 · 충전 +0.6%/분, 낡은 배터리는 빨리 닳는다</small>'; },
  faceHint() { return facingCity() ? ' (남쪽 창)' : S.facing === 0 ? ' (입구 · 등산로)' : ''; },
  view() {
    const x = S.x;
    if (facingCity()) {
      const rows = DISTRICTS.filter((d) => S.city[d.id].danger > 30 && Math.abs(relDeg(d.bearing)) < 60)
        .map((d) => `<li>${absWord(d.bearing)}쪽 — ${S.city[d.id].danger > 60 ? '굵은 검은 연기' : '연기 한 줄기'}</li>`);
      return `<div class="view"><b>남쪽 창</b> <small>나무 사이로 보이는 하늘 — 직접 본 것</small><ul>${rows.join('') || '<li>파란 하늘. 평온하다.</li>'}</ul></div>`;
    }
    if (S.facing === 0) return `<div class="view dim">입구 — 등산로로 사람들이 오르내린다.${x.guestHere ? ' 구석 자리에 붉은 등산복 손님.' : ''}</div>`;
    return '';
  },
  actions() {
    const x = S.x, q = x.queue, b = [];
    if (busy()) b.push(`<div class="dim">손님 응대 중… ${S.busyUntil - S.t}분</div>`);
    b.push(btn('serve', `손님 받기<small>${x.anx >= 70 ? 6 : 3}분 · 대기 ${q}명 · 손님들 이야기가 들린다</small>`, busy() || q === 0));
    b.push(btn('tv', x.tv ? 'TV 끄기' : 'TV 켜기<small>공식 보도 — 늦게 나온다</small>'));
    b.push(btn('plug', S.charging ? '내 휴대폰 뽑기' : '내 휴대폰 충전기에 꽂기<small>+0.6%/분 · 충전기는 하나</small>', x.guestHere && x.guestCharging));
    if (S.powerbank > 0) b.push(btn('powerbank', '보조배터리 쓰기<small>+30% · 하나뿐</small>'));
    return b.join('');
  },
  views: {
    calls() {
      const rows = S.log.filter((l) => /통화|부재중/.test(l)).slice().reverse().map((l) => `<div class="sent">${esc(l)}</div>`).join('');
      return `<div class="hdr">${btn('home', '‹')}<b>전화</b></div><div class="pad">${rows || '<div class="dim">통화 기록 없음</div>'}</div>`;
    },
  },

  resolve() {
    return [
      { id: 'pickup', label: '가게 문을 닫고 다은이를 데리러 내려간다', desc: '2부: 산 아래로 이동 중 · 충전기 없음' },
      { id: 'wait', label: '쉼터에서 기다리며 계속 연락한다', desc: '2부: 충전기 곁 · 전화와 문자' },
      { id: 'warn', label: '손님들에게 도시 상황을 알리고 하산을 권한다', desc: '4장: 산길에 소문이 돈다 · 2부: 쉼터에 남는다' },
    ];
  },
  onEnd(rid) {
    const x = S.x;
    const J1 = { charger: '손님에게 충전기를 내줬다', powerbank: '손님에게 마지막 보조배터리를 내줬다', none: '충전기도 보조배터리도 내주지 않았다' };
    const J2 = { tell: '"경비가 새벽에 다 철수했대요"라고 말했다', quiet: '알고 있었지만 말하지 않았다', unknown: '딸의 문자를 읽지 않아 할 말이 없었다' };
    const J3 = { station: '"역으로 가서 기차 타" — 다은은 중앙역으로', shelter: '"대피소에 있어" — 다은은 동사무소 대피소로', station_default: '답을 못 받은 다은은 스스로 중앙역으로' };
    const j3More = x.tooLate ? ` · ${hm(x.changed)}에 말을 바꿨지만 다은은 이미 도착한 뒤였다` : x.changed ? ` · ${hm(x.changed)}에 말을 바꿔 다은이 돌아섰다` : '';
    setFact('J1', x.j1 || 'none', J1[x.j1 || 'none']);
    setFact('J2', x.j2, J2[x.j2]);
    setFact('J3', x.where || 'station_default', J3[x.where || 'station_default'] + j3More);
    setFact('R1', rid, this.resolve().find((o) => o.id === rid).label);
    // 충전기 사용 구간 — 4장에서 그대로 재생된다(R1). 가게를 떠나면 그때 뽑는다.
    const plug = [];
    let from = null;
    for (const [t, on] of x.plugLog) { if (on) from = t; else if (from != null) { plug.push([from, t]); from = null; } }
    if (from != null) plug.push([from, rid === 'pickup' ? S.t : 24 * 60]);
    L.tracks.misuk = { plug, guest: [toMin('07:20'), x.guestLeft || toMin('07:47')], battery: Math.round(S.battery), powerbank: S.powerbank,
      resolve: rid, endT: S.t, testimony: x.testimony };
  },

  bot() {
    const x = S.x;
    if (S.modal) {
      if (S.modal.resolve) act(`resolve:${params.get('r1') || 'wait'}`);
      else { const E = evDef(S.modal.id), pref = params.get('j1'); act(`tev:${S.modal.id}:${(E.options.find((o) => o.id === pref) || E.options.find((o) => o.id === 'tell') || E.options[0]).id}`); }
      return;
    }
    if (S.call) { act(S.call.state === 'ring' ? 'call:answer' : S.call.line < C.decisions[S.call.id].lines.length - 1 ? 'call:next' : `call:opt:${C.decisions[S.call.id].options[0].id}`); return; }
    if (!S.charging && !(x.guestHere && x.guestCharging) && S.battery < 60) act('plug');
    if (!x.tv) act('tv');
    if (x.queue > 0 && !busy()) act('serve');
    if (S.t - (S.botAt || 0) >= 15) {
      S.botAt = S.t; act('chan:daughter'); act('app:news');
      const dec = S.msgs.find((m) => m.dec === 'where' && decisionOpen(m.dec));
      if (dec) act(`dec:where:${C.decisions.where.options[params.get('where') === 'shelter' ? 1 : 0].id}`);
      // where2=1: 곧바로 말을 바꾼다. where2=late: 다은이 도착한 뒤에야 바꾼다.
      const again = params.get('where2') && !x.changed && S.msgs.find((m) => m.dec && m.dec !== 'where' && decisionOpen(m.dec));
      if (again && (params.get('where2') !== 'late' || S.t >= x.arriveAt + 3)) act(`dec:${again.dec}:go`);
    }
  },
};
