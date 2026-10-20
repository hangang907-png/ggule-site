'use strict';
// 5장 김도윤 — "차 안" (07:41–12:30, 매표소 주차장)
// 읽는 사실: J2b(본부장이 경비 철수를 물어 온 메시지), J5(방송 제목), J7(보조배터리를 받은 사람), J8(차를 찍은 기자), J10(부재중 전화), J11(본부장의 답과 도착 시각)
// 쓰는 사실: J13 대역의 자리, J14 경비 철수 기록, J15 2단계 시각, J10b 기자에게 다시 건 전화, R5 결심
// 휴대폰이 두 대다. 화면 위 탭으로 오간다. 보고 있지 않은 폰은 누가 보냈는지만 알림으로 뜬다.
// (2026-10-05 사용자 플레이: 폰을 바꿔 쥐는 동작이 번거롭기만 했다 → 바꾸는 데 드는 시간과 단계를 없앴다.)

const DOYUN_J11 = { approve: '2단계 승인', stop: '작전 중단' };

CHAPTERS.doyun = {
  num: 5, who: '김도윤', title: '차 안', start: '07:41', end: '12:30', node: 'gate',
  mobile: false, indoor: true, drain: () => 0, rattleLine: '차체가 낮게 떨린다.',
  intro: '시장 비서실장, 마흔넷. 매표소 주차장, 검은 세단 뒷좌석. 1분 전에 남쪽에서 폭음이 났다. 계획대로다. 본부장은 산에 있고, 그가 산에 있었다는 사진을 남길 사람도 따로 올려 보냈다.',
  how: ['휴대폰이 <b>두 대</b>다. 화면 위의 <b>업무폰 / 작전폰</b> 탭(또는 <b>Tab</b> 키)으로 오간다',
    '보고 있지 않은 폰에 온 메시지는 <b>누가 보냈는지만</b> 뜬다. 내용은 그 폰을 열어야 보인다',
    '답에는 마감이 있다. 답하지 않으면 상대가 알아서 정한다',
    '<b>Q/E</b> 몸 돌리기 · <b>Space</b> 일시정지'],
  inherited: () => inheritedNote(),
  resolvePrompt: '12시 반. 13시까지 30분. 김도윤은 무엇을 하기로 하는가?',
  routes: { sns: 'news', press: 'news', poll: 'news' },
  channels: [
    { id: 'boss', dev: 'work', name: '한정우 본부장', tag: '상관', hidden: () => S.x.phone !== 'work' },
    { id: 'pr', dev: 'work', name: '언론팀장 오세린', tag: '대변인실', hidden: () => S.x.phone !== 'work' },
    { id: 'mayor', dev: 'work', name: '시장실', tag: '수행비서', hidden: () => S.x.phone !== 'work' },
    { id: 'reporter', dev: 'work', name: '해령일보 정윤아', tag: '기자 · 모르는 번호', hidden: () => S.x.phone !== 'work' || !S.msgs.some((m) => m.ch === 'reporter') },
    { id: 'op', dev: 'op', name: '단풍', tag: '비공개 대화방 · 4명', danger: true, hidden: () => S.x.phone !== 'op' },
    { id: 'an', dev: 'op', name: '안 실장', tag: '작전팀장 · 외부 용역', danger: true, hidden: () => S.x.phone !== 'op' },
    { id: 'choi', dev: 'op', name: '최', tag: '경호원 · 붉은 등산복', danger: true, hidden: () => S.x.phone !== 'op' },
  ],
  get apps() { return S && S.x.phone === 'op' ? [['msg', '메신저']] : [['msg', '메신저'], ['news', '뉴스']]; },
  phoneTabs() {
    const x = S.x, n = (dev) => S.msgs.filter((m) => !m.read && chOf(m.ch).dev === dev).length;
    const tab = (dev, name) => `<button class="${dev === 'op' ? 'op ' : ''}${x.phone === dev ? 'on' : ''}" data-act="phone:${dev}">${name}${n(dev) && x.phone !== dev ? `<em>${n(dev)}</em>` : ''}</button>`;
    return `<div class="ptabs">${tab('work', '업무폰')}${tab('op', '작전폰')}</div>`;
  },
  // 긴장하면 손이 떨려 답장이 늦게 나간다
  sendDelay: () => (S.x.tension >= 70 ? 2 : 0),
  phoneClass: () => (S.x.phone === 'op' ? 'op' : ''),
  carrier: () => (S.x.phone === 'op' ? '선불 유심' : '해령텔레콤'),
  msgTitle: () => (S.x.phone === 'op' ? '작전폰' : '업무폰'),
  newsHidden: () => S.x.phone === 'op',   // 뉴스 알림은 업무폰에만 온다

  decisions: {
    j14: { title: '경비 철수 공문', ch: 'op', caller: '권 과장', closes: '09:30',
      options: [{ id: 'delete', label: '"지워."' }, { id: 'copy', label: '"지워. 사본은 나한테 보내고."' }] },
    j13: { title: '대역 최의 자리', ch: 'choi', caller: '최', closes: '10:30',
      options: [{ id: 'view', label: '"전망대에 있어."' }, { id: 'summit', label: '"정상으로 가."' }, { id: 'withdraw', label: '"내려와."' }] },
    j10b: { title: '기자의 부재중 전화', ch: 'reporter', caller: '해령일보 정윤아', closes: '12:30',
      options: [{ id: 'callback', label: '(이 번호로 다시 전화한다)' }, { id: 'ignore', label: '(걸지 않는다)' }] },
    j15: { title: '2단계 시각', ch: 'an', caller: '안 실장', closes: '12:30',
      options: [{ id: 'advance', label: '"12시 45분으로 당겨."' }, { id: 'keep', label: '"13시 그대로."' }] },
  },
  trailEvents: {},

  init() {
    S.battery = 100; S.facing = 180;
    S.x = { phone: 'work', other: 0, tension: 35, radio: false, radioSeen: 0, readWorkers: false,
      j13: null, j13At: null, j14: null, j15: null, j10b: null, boss: null, bossAt: null };
  },
  begin() {
    const past = (ch, stamp, text, mine) => S.msgs.push({ id: ++msgId, ch, mine: !!mine, read: true, stamp, t: S.t, text });
    past('op', '10/01 21:14', '한정우: 단풍 최종 승인. 당일엔 산에 있겠다.');
    past('op', '05:10', '안 실장: 3부두 경비 철수 완료.');
    past('choi', '05:50', '입산했습니다. 붉은 등산복, 모자.');
    past('boss', '06:00', '본부장님, 예정대로 진행합니다. 좋은 산행 되십시오.', true);
    // 4장에서 본부장이 쉼터에서 보낸 물음(J2b)이 이 장 시작 전에 왔다면 이미 주고받은 뒤다
    const jw = L.tracks.jungwoo;
    if (factIs('J2b', 'msg') && jw.j2bAt + 6 < S.t) {
      past('boss', hm(jw.j2bAt), '3부두 경비가 새벽에 철수했다는 얘기가 있다. 맞나?');
      past('boss', hm(jw.j2bAt + 6), '정비 작업 때문에 잠시 뺐습니다. 걱정하실 일 아닙니다. 산행 계속하십시오.', true);
      trailText('업무폰에 본부장과 주고받은 메시지가 남아 있다. 누군가 본부장에게 경비 철수를 말했다.', 'clue', linkTag('J2b'));
      this.tense(8);
      noteLink('J2b', '본부장이 경비 철수를 물어 왔다 — 산에서 누가 그에게 말했다');
    }
    trailText('매표소 주차장, 검은 세단 뒷좌석. 07:41. 차 경보가 아직 여기저기서 울린다.', 'place');
    trailText('안주머니의 작전폰이 떤다.', 'dim');
  },

  tense(n) { S.x.tension = clamp(S.x.tension + n, 0, 100); },
  // 대역 최가 그 시각 있던 곳. 10시 전까지는 정해진 길이고, 그 뒤는 J13이 정한다.
  doubleAt(t) {
    const x = S.x, at = x.j13At || toMin('10:30'), j13 = x.j13 || 'view';
    if (t < toMin('07:05')) return 'forest';
    if (t === toMin('07:05')) return 'rest1';
    // 1장의 충전 손님이 한정우가 아니었다면 그 자리에 앉아 있던 건 대역이다
    const jw = L.tracks.jungwoo, m = L.tracks.misuk;
    if (m && !(jw && jw.guest) && t >= m.guest[0] && t < m.guest[1]) return 'rest1';
    if (t < toMin('08:10')) return 'stairs';
    if (t < toMin('09:40')) return 'ridge';
    if (t < at || j13 === 'view') return 'view';
    if (j13 === 'summit') return t < at + 60 ? 'ridge2' : 'summit';
    return 'down';
  },
  // 본부장의 답이 작전폰에 닿는다 — 4장에서 기록된 그 시각에(J11)
  bossAnswer(opt, viaCall) {
    const x = S.x;
    x.boss = opt; x.bossAt = S.t;
    if (viaCall) trailText(`본부장: "${opt === 'approve' ? '…승인한다. 예정대로 해.' : '중단해. 지금 당장.'}"`, 'clue', linkTag('J11'));
    else queueMsg('op', `한정우: ${DOYUN_J11[opt]}`, 0, { urgent: true });
    // 그때 김도윤이 한 대답은 4장에서 이미 들은 그대로다(R1)
    S.msgs.push({ id: ++msgId, ch: 'op', mine: true, read: true, t: S.t, text: opt === 'approve' ? '알겠습니다. 13시 예정대로.' : '…알겠습니다. 철수시키겠습니다. 후회하실 겁니다.' });
    this.tense(opt === 'approve' ? -10 : 20);
    if (opt === 'stop') trailText('그렇게 답했다. 안 실장에게는 아직 아무 말도 전하지 않았다.', 'dim');
    noteLink('J11', `본부장의 답이 ${hm(S.t)}에 닿았다: ${DOYUN_J11[opt]}`);
    truthLog(`본부장의 답 도착: ${DOYUN_J11[opt]}`);
  },
  expire(id, def, line) {
    const st = S.decisions[id];
    if (!st || st.status !== 'open') return;
    st.status = 'expired'; st.via = 'default';
    log(`결정 마감: ${this.decisions[id].title} → 답하지 않음`);
    this.applyDecision(id, def, 'default');
    if (line) queueMsg(this.decisions[id].ch, line, 0);
  },

  timeline() {
    const t = S.t, x = S.x, h = L.tracks.hanul, y = L.tracks.yuna, jw = L.tracks.jungwoo;
    const j11 = getFact('J11') ? getFact('J11').value : { opt: 'none' };
    if (t === toMin('07:45')) queueMsg('an', '실장님. 창고 안에 사람이 있었습니다.', 0, { urgent: true });
    if (t === toMin('07:46')) queueMsg('an', '정비 하청 여섯 명입니다. 일정표엔 다음 주였는데 오늘 들어갔답니다. 둘은 나왔고 넷은 모릅니다.', 0, { urgent: true, workers: true });
    if (t === toMin('08:00')) queueMsg('pr', '실장님, 항만 건으로 기자 전화가 빗발칩니다. 본부장님께 공식 입장을 여쭸습니다.', 0);
    if (t === toMin('08:20')) { openDecision('j14'); queueMsg('op', '권 과장: 경비 철수 지시 공문이 서버에 남아 있습니다. 지울까요?', 0, { dec: 'j14', urgent: true }); }
    if (t === toMin('09:11')) this.tense(10);
    if (t === toMin('09:14')) queueMsg('an', '2차는 우리가 아닙니다. 창고에 있던 유류입니다. 불이 4부두로 갑니다. 통제 밖입니다.', 0, { urgent: true });
    if (t === toMin('09:30')) this.expire('j14', 'untouched', '권 과장: 답이 없으셔서 일단 그대로 둡니다.');
    if (t === toMin('10:00')) { openDecision('j13'); queueMsg('choi', '안개가 낍니다. 능선에선 사진에 충분히 찍혔습니다. 전망대에 계속 있을까요, 정상으로 갈까요, 내려갈까요?', 0, { dec: 'j13', urgent: true }); }
    if (t === toMin('10:20')) this.tense(5);
    if (t === toMin('10:30')) {
      this.expire('j13', 'view', '답이 없으셔서 전망대에 있겠습니다.');
      queueMsg('mayor', '시장님께서 본부장을 연결하라십니다. 지금 어디 있습니까?', 0, { urgent: true });
    }

    // 4장의 물음(J2b)이 이 장 안에서 도착하는 경우. 그때 한 대답은 4장에서 본부장이 받은 그대로다(R1).
    if (factIs('J2b', 'msg') && jw && jw.j2bAt + 6 >= toMin(this.start)) {
      if (t === Math.max(jw.j2bAt, toMin(this.start) + 1)) {
        queueMsg('boss', '3부두 경비가 새벽에 철수했다는 얘기가 있다. 맞나?', 0, { urgent: true });
        this.tense(8);
        noteLink('J2b', '본부장이 경비 철수를 물어 왔다 — 산에서 누가 그에게 말했다');
      }
      if (t === jw.j2bAt + 6) S.msgs.push({ id: ++msgId, ch: 'boss', mine: true, read: true, t, text: '정비 작업 때문에 잠시 뺐습니다. 걱정하실 일 아닙니다. 산행 계속하십시오.' });
    }
    // 2장 서하늘의 방송 제목(J5)
    if (factIs('J5', 'post') && h && t === h.j5At + 4)
      queueMsg('pr', '실장님, "하늘길"이라는 유튜버가 라이브 제목을 "본부장 등산 중?"으로 걸었습니다. 캡처가 돌고 있습니다.', 0, { urgent: true, j5: true });
    // 2장의 보조배터리(J7): 그 시각 전망대에 한정우가 없었고 대역이 거기 있었다면 대역이 받았다
    if (factIs('J7', 'give') && h && t === h.j7At + 2 && !(jw && jw.gotJ7) && this.doubleAt(h.j7At) === 'view') {
      queueMsg('choi', '유튜버가 보조배터리를 주고 갔습니다. 저를 본부장님으로 아는 눈치입니다.', 0, { j7: true });
      noteLink('J7', '전망대의 보조배터리는 대역 최가 받았다');
    }
    // 3장 정윤아가 차를 찍는다(J8). 창을 올리는 것까지는 3장에서 본 그대로다(R2).
    if (y && y.j8At === t) {
      trailText('창밖: 등산복 차림의 여자가 휴대폰으로 이 차를 찍는다. 번호판까지. 창을 올린다.', 'clue', linkTag('J8'));
      this.tense(15);
      noteLink('J8', '기자가 차와 번호판을 찍어 갔다');
    }
    // 3장 정윤아의 전화(J10): 먼저 플레이한 인물이 건 전화는 부재중으로 남는다(R5)
    if (y && y.j10At === t) {
      trailText('업무폰이 울린다. 모르는 번호. 작전폰을 쥔 손이 먼저 굳는다. 받기 전에 끊긴다.', 'clue', linkTag('J10'));
      S.missedCalls++; log('부재중 전화: 해령일보 정윤아');
      this.tense(10);
      openDecision('j10b');
      queueMsg('reporter', '(부재중 전화 1통)', 0, { sys: true });
      queueMsg('reporter', '음성사서함: "해령일보 정윤아입니다. 한정우 본부장님의 오늘 일정에 대해 여쭙고 싶습니다."', 0, { dec: 'j10b', urgent: true });
      noteLink('J10', '기자의 전화가 부재중으로 남았다');
    }

    // 11:30 본부장에게 건 전화. 본부장이 어떻게 답했는지는 4장의 기록 그대로다(J11).
    // 4장에서 본부장이 본 것과 같은 순서, 같은 글이어야 한다(R1): 받았는지, 통화로 답했는지, 대화방에 무엇이 남았는지.
    if (t === toMin('11:30')) {
      if (x.phone !== 'op') { this.swapNow(); trailText('작전폰을 꺼내 쥔다.', 'dim'); }
      const mine = (text) => S.msgs.push({ id: ++msgId, ch: 'op', mine: true, read: true, t, text });
      if (jw && jw.twistAnswered) {
        trailText('작전폰으로 본부장에게 전화를 건다. 본부장이 받는다. 준비한 말을 한다. 1단계가 커졌다는 것, 13시 중앙역, 지난주의 승인.', 'place');
        if (j11.via !== 'call') { trailText('본부장은 대답 없이 끊었다.', 'place'); mine('2단계 지시 바랍니다.'); }
      } else {
        trailText('작전폰으로 본부장에게 전화를 건다. 받지 않는다. 대화방에 남긴다.', 'place');
        for (const text of ['본부장님, 전화를 안 받으셔서 여기 남깁니다.', '1단계가 계획보다 커졌습니다. 4부두까지 번졌습니다. 경비 철수 기록은 지웠습니다.',
          '2단계는 예정대로 13시 중앙역 지하입니다. 12시 반까지 답이 없으시면 승인으로 알겠습니다.', '2단계 지시 바랍니다.']) mine(text);
      }
    }
    if (!x.boss && j11.opt !== 'none' && j11.arriveAt != null && t === Math.max(j11.arriveAt, toMin('11:30'))) this.bossAnswer(j11.opt, j11.via === 'call');
    if (t === toMin('12:00')) {
      // 본부장이 아직 답하지 않았다면 이 보고는 본부장도 보는 대화방에 올라온다(4장에서 본 그대로)
      if (!x.boss) queueMsg('op', '중앙역 2단계 준비 끝났습니다. 지시 기다립니다.', 0, { urgent: true });
      else queueMsg('an', '중앙역 준비 끝났습니다. 지시 기다립니다.', 0, { urgent: true });
    }
    if (t === toMin('12:10')) {
      openDecision('j15');
      queueMsg('an', `역에 경찰이 늘고 있습니다.${y && y.j8At ? ' 기자가 차를 찍어 갔다는 것도 걸립니다.' : ''} 12시 45분으로 당기면 확실합니다. 당길까요?`, 0, { dec: 'j15', urgent: true });
    }
    if (t === toMin('12:30')) {
      this.expire('j15', 'keep');
      this.expire('j10b', 'ignore');
      if (!x.boss) {
        S.msgs.push({ id: ++msgId, ch: 'op', mine: true, read: true, t, text: '12시 반입니다. 답이 없으시니 승인으로 알겠습니다.' });
        if (getFact('J11')) noteLink('J11', '12:30까지 본부장의 답은 작전폰에 닿지 않았다');
      }
    }
  },

  tick() {
    const x = S.x, t = S.t;
    this.tense(t >= toMin('11:30') && !x.boss ? 0.4 : 0.02);
    if (x.radio) {
      const seen = S.pressAll.filter((n) => n.at <= t);
      while (x.radioSeen < seen.length) { trailText(`라디오: ${seen[x.radioSeen].text}`, 'clue'); x.radioSeen++; this.tense(2); x.nextRadio = t + 6; }
      if (t >= (x.nextRadio || 0)) { const line = flavorPick('radio'); if (line) trailText(`라디오: ${line}`, 'dim'); x.nextRadio = t + 9 + Math.floor(Math.random() * 6); }
    }
    if (t >= (x.nextLot || toMin('07:50'))) { const line = flavorPick('lot'); if (line) trailText(`창밖: ${line}`, 'dim'); x.nextLot = t + 12 + Math.floor(Math.random() * 8); }
  },

  swapNow() {
    const x = S.x;
    x.phone = x.phone === 'work' ? 'op' : 'work';
    x.other = 0; S.app = 'home'; S.chan = null;
  },
  // 보고 있지 않은 폰: 누가 보냈는지만 뜬다
  onHiddenMsg(list) {
    const x = S.x, last = list[list.length - 1];
    x.other += list.length;
    notify(x.phone === 'work' ? '작전폰' : '업무폰', `${chOf(last.ch).name} — 새 메시지${list.length > 1 ? ` ${list.length}건` : ''} · 눌러서 열기`, list.some((m) => m.urgent), `phone:${chOf(last.ch).dev}`);
  },
  onDeliver(item) {
    if (item.j5) { this.tense(12); noteLink('J5', '유튜버의 방송 제목으로 본부장이 산에 있다는 게 퍼졌다'); }
  },
  onRead(m) {
    if (m.workers && !S.x.readWorkers) { S.x.readWorkers = true; this.tense(20); trailText('넷은 모른다. 계획에 사람은 없었다.', 'dim'); }
    if (m.j5) trailText('본부장이 산에 있다는 건 알려져야 했다. 다만 오늘 낮은 아니었다.', 'dim', linkTag('J5'));
    if (m.j7) trailText('보조배터리를 받은 건 최였다.', 'dim', linkTag('J7'));
  },

  applyDecision(id, opt) {
    const x = S.x;
    if (id === 'j14') {
      x.j14 = opt;
      if (opt === 'delete') queueMsg('op', '권 과장: 지웠습니다. 복구 안 됩니다.', 1);
      if (opt === 'copy') { queueMsg('op', '권 과장: 지웠습니다. 사본은 실장님 메일로 보냈습니다.', 1); this.tense(-5); }
    }
    if (id === 'j13') {
      x.j13 = opt; x.j13At = S.t;
      if (opt !== 'view' || S.decisions.j13.via !== 'default') queueMsg('choi', { view: '전망대에 있겠습니다.', summit: '정상으로 갑니다. 한 시간쯤 걸립니다.', withdraw: '내려갑니다.' }[opt], 1);
    }
    if (id === 'j10b') {
      x.j10b = opt;
      if (opt === 'callback') {
        // 3장의 정윤아는 이 전화를 받은 적이 없다. 그러니 닿는 곳은 음성사서함이다(R1).
        trailText('기자는 받지 않는다. 삑 소리 뒤에 말한다. "비서실장 김도윤입니다. 본부장님은 오늘 개인 일정으로 산행 중이십니다." 끊고 나서야 안다. 목소리가 남았다.', 'clue');
        this.tense(8);
      }
    }
    if (id === 'j15') {
      x.j15 = opt;
      if (S.decisions.j15.via !== 'default') queueMsg('an', opt === 'advance' ? '12시 45분으로 당깁니다.' : '13시 그대로 갑니다.', 1);
    }
  },

  act(k, a) {
    const x = S.x;
    if (k === 'swap') this.swapNow();
    if (k === 'phone' && a && a !== x.phone) this.swapNow();
    if (k === 'breathe' && !busy()) { S.busyUntil = S.t + 3; this.tense(-12); trailText('창을 조금 내리고 숨을 고른다. 3분.', 'dim'); }
    if (k === 'radio') { x.radio = !x.radio; trailText(x.radio ? '라디오를 켠다.' : '라디오를 끈다.', 'dim'); }
  },

  head() {
    const x = S.x;
    return { place: '매표소 주차장 — 차 안', sub: `시동 켜짐 · 라디오 ${x.radio ? '켜짐' : '꺼짐'} · 보고 있는 폰: ${x.phone === 'op' ? '작전폰' : '업무폰'}` };
  },
  badge() { return { label: '본부장의 답', value: S.x.boss ? (S.x.boss === 'approve' ? '승인' : '중단') : '없음' }; },
  bars() {
    const x = S.x, left = toMin('13:00') - S.t;
    return [{ label: '긴장', pct: x.tension, text: Math.round(x.tension), low: x.tension >= 70 },
            { label: '2단계', pct: ((S.t - toMin('07:40')) / 320) * 100, text: x.boss === 'stop' ? '중단 지시 받음' : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} 전` }];
  },
  rule() { return '<small>긴장 70 이상: 손이 떨려 답장이 2분 늦게 나간다 · 답에는 마감이 있다 · 답하지 않은 결정은 상대가 정한다</small>'; },
  faceHint() { return facingCity() ? ' (앞유리 · 도시 쪽)' : S.facing === 0 ? ' (뒷유리 · 등산로)' : ''; },
  view() {
    const y = L.tracks.yuna, rows = [];
    if (facingCity()) rows.push(S.city.port.danger > 30 ? '앞유리 너머 남쪽 하늘에 검은 연기가 낮게 깔려 있다.' : '앞유리 너머 남쪽 하늘은 아직 맑다.');
    else if (S.facing === 0) rows.push('뒷유리로 매표소와 등산로 입구가 보인다. 붉은 옷은 보이지 않는다.');
    else rows.push('주차장. 등산객들이 휴대폰을 들여다보며 서성인다.');
    if (y && y.j8At && S.t > y.j8At) rows.push('아까 차를 찍던 여자는 등산로로 올라갔다.');
    return `<div class="view"><b>차창 밖</b> <small>직접 본 것</small><ul>${rows.map((r) => `<li>${r}</li>`).join('')}</ul></div>`;
  },
  actions() {
    const x = S.x, b = [];
    if (busy()) b.push(`<div class="dim">숨을 고르는 중… ${S.busyUntil - S.t}분</div>`);
    b.push(btn('breathe', '숨 고르기<small>3분 · 긴장 −12</small>', busy()));
    b.push(btn('radio', x.radio ? '라디오 끄기' : '라디오 켜기<small>공식 보도 — 늦게 나온다 · 들을 때마다 긴장 +2</small>'));
    return b.join('');
  },
  truthExtra() { return `긴장 ${Math.round(S.x.tension)} · 대역 ${this.doubleAt(S.t)}`; },

  resolve() {
    const x = S.x;
    const obey = x.boss === 'approve' ? '2부: 2단계를 진행한다' : x.boss === 'stop' ? '2부: 중단을 지시한다 — 안 실장이 따를지는 모른다' : '2부: 답이 없으니 승인으로 보고 진행한다';
    return [
      { id: 'obey', label: '본부장 지시대로 한다', desc: obey },
      { id: 'finish', label: '본부장이 뭐라 하든 2단계를 완수한다', desc: `2부: ${x.j15 === 'advance' ? '12:45' : '13:00'}에 실행` },
      { id: 'bail', label: '증거를 챙겨 혼자 빠진다', desc: x.j14 === 'copy' ? '2부: 경비 철수 공문 사본을 쥐고 있다' : '2부: 쥔 것은 대화방 기록뿐이다' },
    ];
  },
  onEnd(rid) {
    const x = S.x, y = L.tracks.yuna, h = L.tracks.hanul, jw = L.tracks.jungwoo;
    // 보냈지만 아직 닿지 않은 답도 그 사람이 한 선택이다
    const pending = (id) => { const o = S.outbox.find((q) => q.kind === 'reply' && q.payload.dec === id && q.status !== 'arrived'); return o ? o.payload.opt : null; };
    const j13 = x.j13 || pending('j13') || 'view', j14 = x.j14 || pending('j14') || 'untouched', j15 = x.j15 || pending('j15') || 'keep';
    x.j13 = j13; x.j13At = x.j13At || toMin('10:30');
    setFact('J13', j13, { view: '대역 최를 전망대에 두었다', summit: '대역 최를 정상으로 올려 보냈다', withdraw: '대역 최를 산에서 내렸다' }[j13]);
    setFact('J14', j14, { delete: '경비 철수 공문을 지웠다', copy: '공문을 지우고 사본을 챙겼다', untouched: '답하지 않았다 — 공문은 서버에 그대로 있다' }[j14]);
    setFact('J15', j15, j15 === 'advance' ? '2단계를 12:45로 앞당겼다' : '2단계는 13:00 그대로다');
    if (y && y.j10At) { const v = x.j10b || pending('j10b') || 'ignore'; setFact('J10b', v, v === 'callback' ? '기자에게 다시 걸었다 — 음성사서함에 목소리가 남았다' : '기자에게 다시 걸지 않았다'); }
    setFact('R5', rid, this.resolve().find((o) => o.id === rid).label);

    // J13이 정해졌으니 앞 장들이 본 붉은 등산복이 누구였는지 가릴 수 있다(R3)
    const seen = [];
    if (L.tracks.misuk) seen.push({ who: '오미숙', t: toMin('07:05'), place: 'rest1' });
    if (h && h.j4At) seen.push({ who: '서하늘', t: h.j4At, place: 'ridge' });
    if (h && h.j7At) seen.push({ who: '서하늘', t: h.j7At, place: 'view' });
    if (y && y.sawAt) seen.push({ who: '정윤아', t: y.sawAt, place: 'summit' });
    const verdicts = seen.map((s) => {
      const a = wasAt(jw, s.t, s.place), b = this.doubleAt(s.t) === s.place, name = placeName(NODES[s.place] ? { node: s.place } : { seg: s.place });
      // 긴 구간에서는 둘이 같은 구간에 있어도 마주친 게 아니다. 한정우가 거기 있었다면 찍힌 사람은 한정우다.
      const verdict = a && b && NODES[s.place] ? 'both' : a ? 'jungwoo' : b ? 'double' : 'nobody';
      if (verdict === 'both') contradiction(`${hm(s.t)} ${name}: 붉은 등산복이 둘이었다 — 한정우와 대역 최가 같은 곳에 있었다 (${s.who}의 기록)`);
      if (verdict === 'nobody') contradiction(`${s.who}의 기록: ${hm(s.t)} ${name}의 붉은 등산복 · 그 시각 한정우의 GPS도 대역 최의 자리도 거기가 아니다`);
      return { ...s, verdict };
    });
    L.tracks.doyun = { boss: x.boss, bossAt: x.bossAt, tension: Math.round(x.tension), j13At: x.j13At, verdicts, resolve: rid, endT: S.t };
  },

  // 봇: j13=view|summit|withdraw|none j14=delete|copy|none j15=keep|advance|none j10b=callback|ignore|none r5=obey|finish|bail
  bot() {
    const x = S.x, q = (k, d) => params.get(k) || d;
    if (S.modal) { if (S.modal.resolve) act(`resolve:${q('r5', 'obey')}`); return; }
    if (x.tension >= 70 && !busy()) { act('breathe'); return; }
    const want = { j13: q('j13', 'view'), j14: q('j14', 'delete'), j15: q('j15', 'keep'), j10b: q('j10b', 'callback') };
    const m = S.msgs.find((n) => n.dec && decisionOpen(n.dec) && want[n.dec] !== 'none');
    if (m) {
      if (x.phone !== chOf(m.ch).dev) { act('swap'); return; }
      act(`chan:${m.ch}`); act(`dec:${m.dec}:${want[m.dec]}`);
      return;
    }
    if (S.t - (S.botAt || 0) >= 10) {
      S.botAt = S.t;
      act('swap');
      if (x.phone === 'work') act('app:news');
      for (const c of C.channels) if (chShown(c.id)) act(`chan:${c.id}`);
    }
  },
};
