'use strict';
// 4장 한정우 — "정상 보고" (06:00–12:30, 등산로 전체). v0 프로토타입이 원형.
// 읽는 사실: J1·J2(쉼터에서 오미숙의 기록 재생), R1(산길 소문), J4·J5·J7(서하늘), J9(약수터 아이)
// 쓰는 사실: J2b(쉼터에서의 반응 — 사장이 1장에서 본 것과 어긋나지 않는 것만), J11(반전 전화에 대한 답과 도착 시각), J12(읽음 기록), R4 결심

const CARDS = { evac: '대피', lock: '봉쇄', unlock: '봉쇄 해제', deploy: '부대 투입', withdraw: '부대 철수', hold: '보류' };
const GUEST_BY = '07:40';   // 이 시각 전에 쉼터에 닿아야 1장의 그 손님이다. 그 손님은 폭음 전에 들어와 07:47에 나갔다.

CHAPTERS.jungwoo = {
  num: 4, who: '한정우', title: '정상 보고', start: '06:00', end: '12:30', node: 'gate',
  mobile: true, allowExp: true, commands: true,
  intro: '해령시 안전관리본부장, 쉰둘. 오늘 아침 산에 오른다. 비서실이 지난주 잡아 둔 일정이다. 도시에 무슨 일이 생기면 휴대폰으로 지휘하면 된다. 그렇게 들었다.',
  how: ['<b>W</b> 걷기/멈추기 · <b>Q/E</b> 몸 돌리기(소리 방향이 바뀐다) · <b>Space</b> 일시정지 · <b>T</b> 실제 상황(개발용)',
    '대화방을 열면 <b>읽음 기록</b>이 남는다. 잠금화면 미리보기만 보면 남지 않는다.',
    '신호가 약하면 보고가 늦게 오고 지시도 늦게 도착한다. 신호 0칸이면 둘 다 멈춘다.',
    '도시는 남쪽. 전망대·정상에서 남쪽을 보면 실제 연기가 보인다. 헤드폰 권장.'],
  inherited: () => inheritedNote(),
  resolvePrompt: () => {
    const st = S.decisions.twist, x = S.x;
    if (x.op === 'hidden') return '12시 반. 휴대폰은 조용하다. 도시 쪽 연기는 걷히지 않는다. 한정우는 무엇을 하기로 하는가?';
    if (st && st.status === 'done') return '12시 반. 13시까지 30분. 대답은 이미 건너갔다. 그 대답대로 될지는 모른다. 한정우는 무엇을 하기로 하는가?';
    return '12시 반. "답이 없으시니 승인으로 알겠습니다." 13시까지 30분. 한정우는 무엇을 하기로 하는가?';
  },
  routes: { police: 'police', fire: 'fire', ward: 'ward', field: 'field', sns: 'news', press: 'news', poll: 'news' },
  channels: [
    { id: 'chief',  name: '비서실장 김도윤', tag: '측근' },
    { id: 'police', name: '경찰 상황실',     tag: '느림 · 정확' },
    { id: 'fire',   name: '소방 본부',       tag: '보통 · 정확' },
    { id: 'ward',   name: '구청 당직실',     tag: '빠름 · 과장 잦음' },
    { id: 'field',  name: '현장 박주임',     tag: '빠름 · 현장 목격' },
    { id: 'press',  name: '언론팀',          tag: '대변인실' },
    { id: 'op',     name: '단풍',            tag: '비공개 대화방 · 4명', danger: true, hidden: () => S.x.op === 'hidden' },
  ],
  apps: [['msg', '메신저'], ['map', '상황 지도'], ['news', '뉴스'], ['cmd', '지시'], ['cam', '카메라'], ['gps', '등산 기록']],
  deadHint: '쉼터 충전기나 보조배터리가 필요하다. 꺼진 동안 등산 기록(GPS)도 끊긴다',
  firstBoomLine: '주변 등산객들이 멈춰 선다. "방금 뭐야?"',

  decisions: {
    press1: {
      title: '항만 공식 입장', ch: 'press', caller: '언론팀장 오세린', closes: '09:30',
      lines: ['본부장님, 오세린입니다. 항만 건으로 기자들 전화가 빗발칩니다.', '공식 입장을 지금 내야 합니다. 어떻게 할까요?'],
      missed: ['본부장님, 항만 건 공식 입장 지시 부탁드립니다.', '9시 반까지는 나가야 합니다. 안 그러면 "시 침묵"으로 기사 나옵니다.'],
      prompt: '공식 입장 선택해 주세요.',
      options: [{ id: 'reassure', label: '"정비 중 단순 사고"로 발표' }, { id: 'honest', label: '"원인 조사 중"으로 발표' }],
    },
    twist: {
      title: '단풍 2단계', ch: 'op', caller: '비서실장 김도윤', closes: '13:00',
      lines: ['본부장님, 김도윤입니다. 통화 괜찮으십니까.',
        '…1단계가 계획보다 커졌습니다. 3부두만 정리하기로 했는데 4부두까지 번졌습니다.',
        '그래도 여기까진 사고로 정리됩니다. 경비 철수 기록은 다 지웠습니다.',
        '2단계, 13시 중앙역 지하 환승통로입니다. 비상권한을 받으려면 2단계까지 가야 합니다.',
        '지난주에 승인하셨잖습니까. "당일엔 산에 있겠다"고.',
        '본부장님은 오늘 산에 계셨던 겁니다. 그게 계획이었고요.'],
      missed: ['본부장님, 전화를 안 받으셔서 여기 남깁니다.',
        '1단계가 계획보다 커졌습니다. 4부두까지 번졌습니다. 경비 철수 기록은 지웠습니다.',
        '2단계는 예정대로 13시 중앙역 지하입니다. 12시 반까지 답이 없으시면 승인으로 알겠습니다.'],
      prompt: '2단계 지시 바랍니다.',
      options: [{ id: 'approve', label: '2단계 승인' }, { id: 'stop', label: '작전 중단' }],
    },
  },

  trailEvents: {
    hiker: {
      title: '알아본 등산객',
      text: '등산객 둘이 다가온다. "혹시… 해령시 안전본부장님 아니세요? 사진 한 장만 같이!"',
      options: [{ id: 'photo', label: '같이 찍는다', note: '목격자가 생긴다 · 기록 무결성 +10' }, { id: 'ignore', label: '모자를 눌러쓰고 지나간다' }],
    },
    child: {
      title: '약수터의 아이',
      text: '약수터 옆에서 초등학생 하나가 울고 있다. 일행을 놓쳤다고 한다. 여긴 전화도 안 된다.',
      options: [{ id: 'guide', label: '아이를 데리고 계곡길을 내려가 본다', note: '40분 · 체력 −10 · 내내 신호 없음' }, { id: 'leave', label: '내려가는 등산객에게 부탁하고 간다', note: '5분' }],
    },
    // 1장에서 오미숙이 겪은 장면을 그대로 재생한다(R1). 한정우의 첫 반응은 1장에서 본 그대로다(R2).
    misuk: {
      title: '쉼터 사장', replays: 'gossip',
      tag: () => linkTag('J1') + (factIs('J2', 'tell') ? '' : ''),
      text: () => {
        const m = L.tracks.misuk;
        let s = `매점 사장이 계산대 너머로 당신을 본다. ${inRanges(m.plug, S.t) ? '충전기에 꽂아 둔 휴대폰에 자꾸 눈이 간다.' : '손에 휴대폰을 꼭 쥐고 있다.'}`;
        if (factIs('J1', 'charger')) s += inRanges(m.plug.filter((r) => r[0] > m.guest[0]), S.t)
          ? ' 충전기엔 사장 휴대폰이 꽂혀 있다. "아까는 비어 있었는데… 딸 전화를 기다려서요. 제 것 좀 차면 쓰세요."'
          : ' "충전하실 거면 이거 쓰세요." 충전기를 이쪽으로 밀어 준다.';
        else if (factIs('J1', 'powerbank')) s += ' 서랍에서 보조배터리를 꺼내 내민다. "마지막 하나예요. 오늘 하루 버티셔야죠." 돈은 받지 않는다.';
        else s += inRanges(m.plug, S.t) ? ' 충전기엔 사장 휴대폰이 꽂혀 있다. "죄송해요, 제 것도 충전해야 해서요."' : ' "충전기는 지금 못 써요." 이유는 말하지 않는다.';
        if (factIs('J2', 'tell')) s += ' 그리고 목소리를 낮춘다. "항만 쪽이 좀 이상하대요. 딸이 그러는데 3부두 경비들이 새벽에 다 철수했다고…" 당신은 잠깐 굳는다. 고개만 끄덕인다.';
        return s;
      },
      options: () => (factIs('J2', 'tell')
        // 1장에서 사장이 본 것은 "말없이 고개만 끄덕이고, 휴대폰만 들여다보던 손님"이다. 그 기록 안에서만 고를 수 있다(R1·R2).
        ? [{ id: 'turn', looks: 'silent', label: '아무 말 없이 TV 쪽으로 돌아앉는다' },
           { id: 'msg', looks: 'silent', label: '자리로 가서 비서실장에게 메시지로 묻는다', note: '"3부두 경비가 새벽에 철수했다는데, 맞나?" · 물었다는 기록이 남는다', disabled: !phoneUsable() }]
        : [{ id: 'thanks', label: '고개를 끄덕이고 자리에 앉는다' }]),
    },
    // 3장에서 정윤아가 그 뒤에 아이를 만났다. 아이는 그때까지 여기 있어야 한다(R1).
    childFixed: {
      title: '약수터의 아이', replays: 'child',
      tag: () => linkTag('J9'),
      text: () => `약수터 옆에서 초등학생 하나가 웅크리고 있다. 일행을 놓친 것 같다. 아이가 당신을 올려다본다. 아이는 ${hm(L.tracks.yuna.childAt)}에 온 기자에게 말한다. 아무도 멈춰 주지 않았다고.`,
      options: [{ id: 'pass', looks: 'walked_past', label: '걸음을 멈추지 않는다' }],
    },
    misukLate: {
      title: '쉼터 사장',
      text: '사장이 당신을 보고 고개를 갸웃한다. "어? 아까 그 옷 입은 분… 다시 오셨어요?" 붉은 등산복. 당신과 똑같은 옷이다.',
      options: [{ id: 'first', label: '"오늘 처음 왔는데요."' }, { id: 'nod', label: '대충 고개를 끄덕인다' }],
    },
  },

  init() {
    S.battery = 100; S.powerbank = 0;
    S.x = { visited: [{ t: START_MIN, node: 'gate' }], alibi: 70, op: 'hidden', gpsGap: 0, spots: {}, metMisuk: null, j2b: null, restAt: null, opened: false, j2bAt: null, gotJ7: false, child: null };
  },
  begin() {
    trailText(`${NODES.gate.name}. ${NODES.gate.text}`, 'place');
    queueMsg('chief', '본부장님, 예정대로 진행합니다. 좋은 산행 되십시오.', 0);
  },

  timeline() {
    const t = S.t, x = S.x;
    if (t === toMin('08:00')) incomingCall('press1');
    if (t === toMin('09:30') && S.decisions.press1 && S.decisions.press1.status === 'open') {
      S.decisions.press1.status = 'expired';
      S.opinion -= 4;
      queueNews('press', '[해령시] 항만 폭발 관련 공식 입장 없어… "시는 뭐 하나"', 10);
      log('결정 마감: 항만 공식 입장 → 무응답');
    }
    misukRumor();
    const mk = L.tracks.misuk;
    if (mk && x.metMisuk === 'window' && !x.leftSeat && t === mk.guest[1]) {
      x.leftSeat = true;
      if (S.charging) S.charging = false;
      trailText('휴대폰을 본다. 충전기에서 뽑아 들고 일어선다. 사장에게 인사할 틈도 없다.', 'place', linkTag('J1'));
    }
    // 2장 서하늘의 기록이 그 시각 그 자리에서 재생된다(R1). 한정우가 거기 없으면 아무 일도 없다.
    const h = L.tracks.hanul;
    if (h) {
      if (t === h.j4At && S.seg === 'ridge') {
        if (factIs('J4', 'ignore')) { trailText('짐벌을 든 유튜버가 스쳐 지나간다. 카메라는 단풍을 향해 있다.', 'dim', linkTag('J4')); noteLink('J4', '능선에서 유튜버가 찍지 않고 지나쳤다'); }
        else {
          // 2장에서 서하늘이 본 그대로다. 그 장면에 없던 행동은 여기서도 할 수 없다(R1·R2).
          trailText(factIs('J4', 'sneak')
            ? '짐벌을 든 젊은 여자가 뒤에서 따라붙는다. 렌즈가 슬쩍 이쪽을 향한다. 당신은 모자를 더 눌러쓰고 걸음을 빨리한다.'
            : '짐벌을 든 젊은 여자가 말을 건다. "안녕하세요! 같이 한 장 찍어도 돼요?" 당신은 멈칫하다가 고개만 끄덕인다. 찰칵. 말은 하지 않는다.', 'clue', linkTag('J4'));
          x.alibi += 10;
          trailText('찍혔다. 오늘 산에 있었다는 영상이 하나 더 생겼다. 기록 무결성 +10', 'dim');
          noteLink('J4', '능선에서 유튜버에게 찍혔다');
        }
      }
      if (factIs('J5', 'post') && t === h.j5At + 3) queueNews('sns', '등산 유튜버 하늘길 라이브 제목: "본부장 등산 중?" 해령산에서 한정우 닮은 사람 찍힘', 0, { j5: true });
      if (factIs('J7', 'give') && t === h.j7At && S.node === 'view' && !S.seg) {
        S.powerbank += 1; x.gotJ7 = true;
        trailText('옆에서 방송하던 유튜버가 보조배터리를 내민다. "이거 쓰세요. 전 하나 더 있어요." 당신은 고개를 숙이고 받는다.', 'clue', linkTag('J7'));
        noteLink('J7', '전망대에서 유튜버에게 보조배터리를 받았다');
      }
    }
    // 3장 정윤아가 12:10 정상에서 본 붉은 등산복
    const y = L.tracks.yuna;
    if (y && y.sawAt === t && S.node === 'summit' && !S.seg) {
      trailText('인증샷 줄 쪽에서 누군가 이쪽을 오래 본다. 수첩을 든 여자다. 멀어서 얼굴은 서로 안 보인다.', 'clue', linkTag('R3'));
      noteLink('R3', '정상에서 기자의 눈에 띄었다');
    }
    if (t === toMin('11:30')) incomingCall('twist');
    if (t === toMin('12:00') && x.op === 'pending') queueMsg('op', '중앙역 2단계 준비 끝났습니다. 지시 기다립니다.', 0, { urgent: true });
    if (t === toMin('12:30') && (x.op === 'pending' || x.op === 'hidden')) {
      x.op = 'silent';
      queueMsg('op', '12시 반입니다. 답이 없으시니 승인으로 알겠습니다.', 0, { urgent: true });
      truthLog('작전: 무응답 → 승인으로 간주');
    }
  },

  tick() {
    // 쉼터 충전 중인데 사장이 자기 휴대폰을 꽂을 시각이 되면 비켜 줘야 한다(1장 기록 재생)
    if (S.charging && this.charger() === 'other') { S.charging = false; trailText('충전기 주인이 돌아왔다. 휴대폰을 뽑아 비켜 준다.', 'dim'); }
    if (S.charging && this.charger() !== 'free') {
      S.charging = false;
      trailText('사장이 미안한 얼굴로 자기 휴대폰을 꽂아야 한다고 한다. 딸 전화를 기다린다고.', 'dim', linkTag('J1'));
      noteLink('J1', '충전 중에 사장 휴대폰에 자리를 비켜 줬다');
    }
  },
  phoneTick() {
    // 휴대폰이 꺼져 있으면 등산 앱 GPS 기록도 끊긴다
    if (!S.exp && !phoneUsable()) { S.x.alibi -= 0.25; S.x.gpsGap++; }
    S.x.alibi = clamp(S.x.alibi, 0, 100);
  },

  // 쉼터 충전기 상태 — 1장 오미숙의 충전 기록과 선택(J1)으로 정해진다
  charger() {
    const m = L.tracks.misuk, x = S.x;
    if (!m) return 'free';
    if (x.metMisuk === 'closed') return 'closed';
    if (x.leftSeat) return 'done';
    if (x.metMisuk === 'window' && factIs('J1', 'none')) return 'refused';
    // 사장이 충전기를 내준 건 손님이 있던 동안뿐이다. 그 뒤 자기 휴대폰을 다시 꽂은 기록은 4장이 바꿀 수 없다(R1).
    const plug = x.metMisuk === 'window' && factIs('J1', 'charger') ? m.plug.filter((r) => r[0] > m.guest[0]) : m.plug;
    return { owner: 'busy', other: 'other' }[chargerTakenAt(S.t, plug)] || 'free';
  },

  onDeliver(item) {
    if (item.ch === 'op') this.reveal();
    if (item.j5) { S.opinion -= 5; S.x.alibi += 6; trailText('뉴스 알림에 당신 이름이 뜬다. 누가 산에서 당신을 찍어 올렸다.', 'clue', linkTag('J5')); noteLink('J5', '유튜버의 방송 제목으로 산에 있다는 게 퍼졌다'); }
  },
  onAnswer(id) { if (id === 'twist') { S.x.twistAnswered = true; this.reveal(); } },
  onRead(m) { if (m.ch === 'op' && !S.x.opened) { S.x.opened = true; S.x.openedAt = S.t; } },
  reveal() {
    if (S.x.op !== 'hidden') return;
    S.x.op = 'pending';
    S.msgs.unshift({ id: ++msgId, ch: 'op', mine: true, read: true, stamp: '10/01 21:14', text: '단풍 최종 승인. 당일엔 산에 있겠다.' });
    log('[반전] "단풍" 대화방이 드러났다');
  },

  applyDecision(id, opt, via) {
    const x = S.x;
    if (id === 'press1') {
      S.opinion += opt === 'reassure' ? 6 : -2;
      queueNews('press', opt === 'reassure' ? '[해령시] "항만 사고는 정비 작업 중 단순 사고"' : '[해령시] "항만 폭발 원인 조사 중… 확인되는 대로 공개"', 15);
    }
    if (id === 'twist') {
      x.op = opt === 'approve' ? 'approved' : 'stopped';
      x.alibi -= via === 'msg' ? (opt === 'approve' ? 10 : 15) : (opt === 'approve' ? 3 : 5);
      queueMsg('op', opt === 'approve' ? '알겠습니다. 13시 예정대로.' : '…알겠습니다. 철수시키겠습니다. 후회하실 겁니다.', 1);
      truthLog(`작전 결정 도착: ${opt === 'approve' ? '승인' : '중단'} (${via === 'call' ? '통화' : '메시지'})`);
    }
  },

  arrive(o) { if (o.kind === 'cmd') this.applyCommand(o.payload); },
  applyCommand({ d, card }) {
    const c = S.city[d], name = DIST[d].name;
    let ack = null;
    switch (card) {
      case 'evac':
        if (c.evacOn) { ack = `${name}은(는) 이미 대피 중입니다.`; break; }
        c.evacOn = true; S.opinion += c.danger < 20 ? -3 : 2;
        ack = `${name} 대피령 발령. 완료까지 약 45분.`;
        break;
      case 'lock': c.locked = true; ack = `${name} 봉쇄선 설치했습니다.`; break;
      case 'unlock': c.locked = false; ack = `${name} 봉쇄 해제했습니다.`; break;
      case 'deploy':
        if (S.squadsFree <= 0) { ack = '가용 부대가 없습니다. 다른 구역에서 철수시켜야 합니다.'; break; }
        S.squadsFree--; c.squads.push(S.t + 20);
        if (d === 'campus') S.opinion -= 10;
        ack = `${name}에 부대 출동. 약 20분 뒤 도착.`;
        break;
      case 'withdraw':
        if (!c.squads.length) { ack = `${name}에 철수시킬 부대가 없습니다.`; break; }
        c.squads.pop(); S.squadsFree++;
        ack = `${name} 부대 철수합니다.`;
        break;
    }
    truthLog(`지시 도착: ${name} ${CARDS[card]}`);
    if (ack) queueMsg('police', `[지시 접수] ${ack}`, 1);
  },

  onWalk(seg) { if (seg.id === 'ridge' && S.prog > 0.4) openTrailEvent('hiker'); },
  onArrive(n) {
    const x = S.x;
    if (n === 'spring') this.springChild();
    if (n === 'view') { const h = L.tracks.hanul; if (h && wasAt(h, S.t, 'view') && S.t <= h.endT) trailText('난간 앞에서 짐벌을 든 유튜버가 도시 쪽을 찍고 있다.', 'dim'); }
    if (n !== 'rest1') return;
    x.restAt = S.t;
    const m = L.tracks.misuk;
    if (!m) return;
    if (m.resolve === 'pickup' && S.t >= m.endT) {
      x.metMisuk = 'closed';
      trailText('쉼터 셔터가 반쯤 내려져 있다. "급한 일로 잠시 닫습니다." 사장은 없다.', 'dim', linkTag('R1'));
      noteLink('R1', '쉼터가 닫혀 있었다');
      return;
    }
    if (S.t < toMin(GUEST_BY)) { x.metMisuk = 'window'; openTrailEvent('misuk'); }
    else {
      if (S.t < m.guest[1]) trailText('문간에서 붉은 등산복 하나와 어깨가 스친다. 모자를 눌러쓴 남자는 뒤도 돌아보지 않고 올라간다.', 'clue');
      // R3: 1장의 증언과 어긋난다. 고치지 않고 남긴다.
      x.metMisuk = 'late';
      trailText('사장이 당신을 다른 누군가와 헷갈리는 것 같다.', 'clue', linkTag('J1'));
      contradiction(`오미숙 증언: 07:20쯤 붉은 등산복 손님이 들러 충전을 부탁했다 · 한정우 GPS: ${hm(S.t)}에야 쉼터 도착`);
      openTrailEvent('misukLate');
    }
  },

  // 약수터 아이 — 3장 정윤아의 기록이 있으면 그 기록을 지울 수 없다(J9)
  springChild() {
    const y = L.tracks.yuna, x = S.x;
    if (!y) { openTrailEvent('child'); return; }
    if (S.t < toMin(CHILD_FROM)) return;
    if (!y.childAt) { openTrailEvent('child'); return; }
    if (S.t < y.childAt) { openTrailEvent('childFixed'); return; }
    x.child = 'gone';
    trailText('약수터엔 아무도 없다. 바위 위에 아이 모자 하나가 놓여 있다.', 'dim', linkTag('J9'));
    noteLink('J9', factIs('J9', 'help') ? '약수터 아이는 이미 기자가 데리고 내려간 뒤였다' : '약수터 아이는 이미 다른 등산객을 따라 내려간 뒤였다');
  },

  onTrailChoice(id, opt) {
    const x = S.x;
    if (id === 'childFixed') {
      x.child = opt;
      trailText('아이의 눈이 등 뒤에 붙는다. 물소리가 그 위를 덮는다.', 'dim');
      noteLink('J9', '약수터 아이를 두고 지나갔다 — 아이는 뒤에 온 기자에게 아무도 멈추지 않았다고 말한다');
    }
    if (id === 'hiker') {
      if (opt === 'photo') { x.alibi += 10; trailText('찰칵. "본부장님도 등산하시네요!" 둘이 웃으며 사진을 확인한다.'); }
      else trailText('모자를 눌러쓰고 지나친다. 뒤에서 "맞는 것 같은데…" 하는 소리.');
    }
    if (id === 'child') {
      x.child = opt;
      if (opt === 'guide') {
        S.busyUntil = S.t + 40; S.stamina = Math.max(0, S.stamina - 10);
        S.later.push({ at: S.t + 40, key: 'childBack' });
        trailText('아이 손을 잡고 계곡길을 되짚어 내려간다.');
      } else { S.busyUntil = S.t + 5; trailText('내려가던 부부에게 아이를 부탁한다. 아내 쪽이 당신 얼굴을 한참 본다.'); }
    }
    if (id === 'misuk') {
      // 장면이 지나간 뒤에도 무엇을 물려받았는지 로그에 남긴다(연결 표시)
      const taken = factIs('J1', 'charger') && this.charger() === 'busy';
      const j1 = taken ? '사장은 충전기를 내주려 했지만, 지금은 사장 휴대폰이 꽂혀 있다.'
        : { charger: '사장이 충전기를 내줬다.', powerbank: '사장에게서 마지막 보조배터리를 받았다.', none: '사장은 충전기를 내주지 않았다.' }[getFact('J1').value];
      trailText(j1, 'clue', linkTag('J1'));
      if (factIs('J2', 'tell')) trailText('"3부두 경비들이 새벽에 다 철수했다고…" 사장의 말이 귀에 남는다.', 'clue', linkTag('J2'));
      if (factIs('J1', 'powerbank')) { S.powerbank += 1; noteLink('J1', '쉼터 사장에게서 보조배터리를 받았다'); }
      if (factIs('J1', 'charger')) noteLink('J1', taken ? '사장은 충전기를 내주려 했지만 자기 휴대폰을 꽂아 둔 뒤였다' : '쉼터 사장이 충전기를 내줬다');
      if (factIs('J1', 'none')) noteLink('J1', '쉼터 사장이 충전기를 내주지 않았다');
      if (factIs('J2', 'tell')) {
        x.j2b = opt;
        noteLink('J2', '쉼터 사장에게서 "3부두 경비가 새벽에 철수했다"는 말을 들었다');
        if (opt === 'turn') trailText('TV에선 단풍 명소가 나온다. 사장은 더 말을 걸지 않는다.', 'dim');
        if (opt === 'msg') {
          x.j2bAt = S.t;
          trailText('구석 자리에 앉아 휴대폰을 꺼낸다. 사장 쪽에선 화면만 들여다보는 손님으로 보일 것이다.', 'clue');
          S.msgs.push({ id: ++msgId, ch: 'chief', mine: true, read: true, t: S.t, text: '3부두 경비가 새벽에 철수했다는 얘기가 있다. 맞나?' });
          queueMsg('chief', '정비 작업 때문에 잠시 뺐습니다. 걱정하실 일 아닙니다. 산행 계속하십시오.', 6);
          log('비서실장에게 물음: 3부두 경비 철수');
        }
      }
    }
    if (id === 'misuk') {
      // 1장의 그 손님은 구석 자리에 앉아 07:47까지 머물렀다. 그 기록대로 앉아 있는다(R1).
      const m = L.tracks.misuk;
      trailText('구석 자리에 앉는다. 휴대폰 화면을 자꾸 확인하게 된다.', 'dim');
      if (factIs('J1', 'charger') && this.charger() === 'free' && !S.exp) { S.charging = true; trailText('고개를 숙이고 충전기에 휴대폰을 꽂는다.', '', linkTag('J1')); noteLink('J1', '사장이 내준 충전기로 충전했다'); }
      S.busyUntil = Math.max(S.busyUntil, m.guest[1]);
    }
    if (id === 'misukLate') {
      x.j2b = `late_${opt}`;
      if (factIs('J1', 'powerbank')) { trailText('사장 말로는 마지막 보조배터리는 "아까 그 손님"이 가져갔다고 한다.', 'dim', linkTag('J1')); noteLink('J1', '보조배터리는 먼저 온 붉은 등산복이 가져갔다'); }
    }
  },
  later(key) { if (key === 'childBack') trailText('계곡길 중간에서 아이를 찾아 올라오던 엄마를 만났다. 연신 고개를 숙인다. 약수터로 되돌아왔다.'); },

  act(k, a) {
    const x = S.x;
    switch (k) {
      case 'charge':
        if (S.charging) { S.charging = false; trailText('충전기를 뽑는다.'); }
        else if (this.charger() === 'free') {
          S.charging = true; trailText('공용 충전기에 휴대폰을 꽂는다.');
        }
        break;
      case 'tv': {
        const p = S.pressAll.filter((n) => n.at <= S.t).pop();
        trailText(p ? `TV: ${p.text}` : 'TV: 아침 교양 프로그램. 단풍 명소를 소개하고 있다.', 'clue');
        break;
      }
      case 'drink': if (!S.flags.drank) { S.flags.drank = true; S.stamina = Math.min(100, S.stamina + 25); trailText('약수가 이가 시리게 차다.'); } break;
      case 'cmd': if (phoneUsable()) { S.app = 'cmd'; S.ui = { d: a || S.ui.d, card: null }; } break;
      case 'dsel': S.ui = { d: a, card: null }; break;
      case 'card': S.ui.card = a; break;
      case 'send': {
        const { d, card } = S.ui;
        if (!d || !card) break;
        const label = `${DIST[d].name} ${CARDS[card]}`;
        if (send('cmd', { d, card }, label)) { log(`지시 보냄: ${label} (신호 ${signal()}칸)`); S.ui.card = null; }
        break;
      }
      case 'shoot':
        if (!x.spots[S.node]) {
          x.spots[S.node] = 'shot'; x.alibi += 8; if (!S.exp) S.battery = Math.max(0, S.battery - 1);
          trailText(`${NODES[S.node].name}에서 인증샷을 찍는다.`); log(`인증샷: ${NODES[S.node].name}`);
        }
        break;
      case 'post':
        if (x.spots[S.node] === 'shot' && signal() > 0) {
          x.spots[S.node] = 'posted'; x.alibi += 5;
          if (avgDanger() > 20) S.opinion -= 6;
          log(`SNS 게시: ${NODES[S.node].name} 인증샷`);
        }
        break;
    }
  },

  head() {
    const h = here(), pace = S.stamina < 25 ? 0.6 : 1;
    const alt = S.seg ? Math.round(NODES[h.from].alt + (NODES[h.to].alt - NODES[h.from].alt) * S.prog) : h.alt;
    return {
      place: S.seg ? `${h.name} → ${NODES[h.to].name}` : h.name,
      sub: S.seg
        ? `고도 ${alt}m · 남은 시간 약 ${Math.ceil((1 - S.prog) * h.minutes / pace)}분${pace < 1 ? ' (지쳐서 느림)' : ''} · ${S.walking ? '걷는 중' : '멈춤'}`
        : `고도 ${alt}m · ${busy() ? '다른 일 하는 중' : '멈춰 있음 — 쉬면 체력 회복'}`,
    };
  },
  badge() { return { label: '기록 무결성', value: Math.round(S.x.alibi) }; },
  bars() {
    return [{ label: '체력', pct: S.stamina, text: Math.round(S.stamina), low: S.stamina < 25 },
            { label: '구간', pct: S.seg ? S.prog * 100 : 0, text: S.seg ? `${Math.round(S.prog * 100)}%` : '-' }];
  },
  faceHint() { return S.facing === 0 ? ' (정상 쪽)' : facingCity() ? ' (도시 쪽)' : ''; },
  view() {
    if (S.seg || !NODES[S.node].overlook) return '';
    if (!facingCity()) return '<div class="view dim">도시는 등 뒤에 있다. 남쪽으로 돌아서야 보인다. (Q/E)</div>';
    const rows = DISTRICTS.filter((d) => S.city[d.id].danger > 22).map((d) => {
      const v = S.city[d.id].danger;
      return `<li>${absWord(d.bearing)} (${d.name} 쪽) — ${v > 70 ? '굵고 검은 연기 기둥' : v > 45 ? '검은 연기' : '옅은 연기'}</li>`;
    });
    return `<div class="view"><b>내려다본 도시</b> <small>직접 본 것 — 보고가 아니다</small><ul>${rows.join('') || '<li>도시는 평온해 보인다.</li>'}</ul></div>`;
  },
  actions() {
    const b = [];
    if (busy()) b.push(`<div class="dim">다른 일을 하는 중… ${S.busyUntil - S.t}분</div>`);
    else if (S.seg) b.push(S.walking ? btn('stop', '■ 멈추기 <small>W</small>') : btn('walk', '▶ 걷기 <small>W</small>', S.stamina <= 0));
    else {
      for (const s of nextSegs()) b.push(btn(`go:${s.id}`, `${s.name} → ${NODES[s.to].name}<small>${s.minutes}분 · 신호 ${s.signal}칸 · 체력 −${s.stamina}${s.exposed ? ' · 사람 많음' : ''}</small>`, S.stamina <= 0));
      const nd = NODES[S.node];
      if (nd.charger && !S.exp) {
        const st = this.charger();
        if (S.charging) b.push(btn('charge', '충전기 뽑기'));
        else if (st === 'free') b.push(btn('charge', `충전기 꽂기<small>+1.2%/분 · 멈춰 있는 동안</small>${S.x.metMisuk === 'window' && factIs('J1', 'charger') ? linkTag('J1') : ''}`));
        else if (st === 'refused') b.push(btn('charge', `충전기 — 사장이 내주지 않았다${linkTag('J1')}`, true));
        else if (st === 'busy') b.push(btn('charge', `충전기 — 사장 휴대폰이 꽂혀 있다${linkTag('J1')}`, true));
        else if (st === 'other') b.push(btn('charge', CHARGER_BUSY.other, true));
        else if (st === 'done') b.push(btn('charge', '충전기 — 쓰고 일어선 자리다', true));
        else b.push(btn('charge', `쉼터가 닫혀 있다${linkTag('R1')}`, true));
      }
      if (nd.tv) b.push(btn('tv', 'TV 뉴스 보기'));
      if (nd.spring) b.push(btn('drink', S.flags.drank ? '물을 마셨다' : '약수 마시기<small>체력 +25</small>', S.flags.drank));
    }
    if (S.powerbank > 0 && !S.exp) b.push(btn('powerbank', `보조배터리 쓰기<small>+30% · 1회</small>${getFact('J1') && factIs('J1', 'powerbank') ? linkTag('J1') : ''}`));
    return b.join('');
  },
  onPowerbank() { if (factIs('J1', 'powerbank')) noteLink('J1', '사장이 준 보조배터리를 썼다'); },

  badges() { return { cmd: S.outbox.filter((o) => o.kind === 'cmd' && o.status !== 'arrived').length }; },
  views: {
    cmd() {
      const sig = signal(), u = S.ui;
      const ds = DISTRICTS.map((d) => { const p = S.pins[d.id]; return `<button class="chip ${u.d === d.id ? 'on' : ''}" data-act="dsel:${d.id}">${d.name}<small>${p ? p.danger : '?'}</small></button>`; }).join('');
      let cards = '';
      if (u.d) {
        const c = S.city[u.d];
        const avail = ['evac', c.locked ? 'unlock' : 'lock', 'deploy', ...(c.squads.length ? ['withdraw'] : []), 'hold'];
        cards = avail.map((k) => `<button class="chip ${u.card === k ? 'on' : ''}" data-act="card:${k}">${CARDS[k]}</button>`).join('');
      }
      const info = [];
      if (!S.exp) info.push('배터리 −2%');
      info.push(sig === 0 ? '신호 없음 → 신호 잡힐 때까지 대기' : `도착까지 ${SEND_LAG[sig]}분`);
      if (S.walking && S.seg) info.push('걸으며 입력: 2분 지체');
      const sent = S.outbox.filter((o) => o.kind === 'cmd').slice().reverse().map((o) =>
        `<div class="sent"><b>${hm(o.created)}</b> ${esc(o.label)} <small>${o.status === 'queued' ? '대기' : o.status === 'sent' ? `전송 중 ${o.arriveAt - S.t}분` : '도착'}</small></div>`).join('');
      return `<div class="hdr">${btn('home', '‹')}<b>지시</b><small>부대 ${S.squadsFree}/3 대기</small></div>
        <div class="pad"><div class="cap">구역</div><div class="chips">${ds}</div>
        ${u.d ? `<div class="cap">지시 카드</div><div class="chips">${cards}</div>` : ''}
        <div class="cap">${info.join(' · ')}</div>${btn('send', '보내기', !(u.d && u.card))}
        <div class="cap">보낸 지시</div>${sent || '<div class="dim">없음</div>'}</div>`;
    },
    cam() {
      const nd = !S.seg && NODES[S.node];
      let inner;
      if (!nd || !nd.overlook) inner = '<div class="dim">찍을 만한 풍경이 아니다.<br><br>전망대·정상에서 인증샷을 남기면 기록 무결성이 오른다.</div>';
      else {
        const shot = S.x.spots[S.node];
        if (!shot) inner = btn('shoot', `${nd.name} 인증샷 찍기<small>기록 무결성 +8 · 배터리 −1%</small>`);
        else if (shot === 'shot') inner = `<div>찍었다. 단풍과 하늘. 남쪽 연기는 프레임 밖이다.</div>${btn('post', 'SNS에 올리기<small>기록 무결성 +5 · 신호 필요 · 도시 상황이 나쁘면 역풍</small>', signal() === 0)}`;
        else inner = '<div>SNS에 올렸다. 좋아요가 하나씩 붙는다.</div>';
      }
      return `<div class="hdr">${btn('home', '‹')}<b>카메라</b></div><div class="pad">${inner}</div>`;
    },
    gps() {
      const path = S.x.visited.filter((v) => v.node).map((v) => `<div class="sent"><b>${hm(v.t)}</b> ${NODES[v.node].name}</div>`).join('');
      return `<div class="hdr">${btn('home', '‹')}<b>등산 기록</b></div><div class="pad">
        <div class="big-num">${Math.round(S.x.alibi)}<small>/100 기록 무결성</small></div>
        <div class="cap">"그날 산에 있었다"를 밖에서 증명해 주는 기록.<br>+ 인증샷, SNS 게시, 목격자<br>− 휴대폰 꺼짐(GPS 끊김), 작전 대화방에 남긴 글</div>
        <div class="cap">GPS: ${phoneUsable() ? '<span class="ok">● 기록 중</span>' : '<span class="bad">끊김</span>'} · 끊긴 시간 ${S.x.gpsGap}분</div>
        <div class="cap">경로</div>${path}</div>`;
    },
  },
  truthExtra() { return `무결성 ${Math.round(S.x.alibi)} · 작전 ${S.x.op}`; },

  resolve() {
    const x = S.x;
    const said = S.decisions.twist && S.decisions.twist.status !== 'open'
      ? ` (이미 "${S.decisions.twist.choice === 'approve' ? '승인' : S.decisions.twist.choice === 'stop' ? '중단' : '…'}"으로 답했다)` : '';
    return [
      { id: 'approve', label: '2단계를 그대로 둔다', desc: `2부: 아무것도 막지 않는다${said}` },
      { id: 'stop', label: '어떻게든 멈춘다', desc: '2부: 비서실장에게 중단을 밀어붙인다' },
      { id: 'silent', label: '아무것도 하지 않는다', desc: '2부: 휴대폰을 내려놓는다' },
      { id: 'expose', label: '"단풍" 대화방을 세상에 보일 준비를 한다', desc: `2부: 정상에서 공개할 수 있다 · 지금 위치 ${S.seg ? SEG[S.seg].name : NODES[S.node].name}` },
    ].filter((o) => x.op !== 'hidden' || o.id !== 'expose');
  },
  onEnd(rid) {
    const x = S.x;
    // J11: 반전 전화에 대한 답과 그것이 비서실장 작전폰에 닿는 시각 — 5장에서 그대로 도착한다
    const st = S.decisions.twist, o = S.outbox.find((q) => q.kind === 'reply' && q.payload.dec === 'twist');
    let J11v, J11l;
    if (st && st.status === 'done') {
      const word = st.choice === 'approve' ? '2단계 승인' : '작전 중단';
      J11v = { opt: st.choice, via: st.via, sentAt: o ? o.created : st.at, arriveAt: st.at };
      J11l = st.via === 'call' ? `통화로 "${word}" (${hm(st.at)})` : `메시지로 "${word}" — ${hm(o.created)} 보냄 · ${hm(st.at)} 도착`;
    } else if (o) {
      const word = o.payload.opt === 'approve' ? '2단계 승인' : '작전 중단';
      J11v = { opt: o.payload.opt, via: 'msg', sentAt: o.created, arriveAt: o.status === 'sent' ? o.arriveAt : null };
      J11l = `메시지로 "${word}" — ${hm(o.created)} 보냄 · ${o.status === 'sent' ? `${hm(o.arriveAt)} 도착 예정` : '아직 전송 대기 (신호 없음)'}`;
    } else {
      J11v = { opt: 'none' };
      J11l = x.op === 'hidden' ? '반전 전화도 메시지도 받지 못했다 — 12:30 승인으로 간주' : '답하지 않았다 — 12:30 승인으로 간주';
    }
    setFact('J11', J11v, J11l);
    const unread = S.msgs.filter((m) => !m.read && !m.mine && !m.sys).length + S.inbox.filter((i) => i.kind === 'msg').length;
    setFact('J12', { reads: S.reads, unread, opened: x.opened, openedAt: x.openedAt || null }, `읽은 보고 ${S.reads}건 · 읽지 않은 보고 ${unread}건${x.opened ? ' · "단풍" 대화방을 열었다' : ''}`);
    if (x.j2b) {
      const J2b = { turn: '아무 말 없이 TV 쪽으로 돌아앉았다', msg: `말없이 자리로 가 비서실장에게 경비 철수를 물었다 (${hm(x.j2bAt || 0)})`,
        late_first: '"오늘 처음 왔다"고 했다 — 사장은 고개를 갸웃했다', late_nod: '대충 고개를 끄덕였다' };
      setFact('J2b', x.j2b, J2b[x.j2b]);
    }
    setFact('R4', rid, this.resolve().find((q) => q.id === rid).label);
    // R3: 앞 장들이 본 붉은 등산복이 한정우가 아니었다면, 고치지 않고 어긋난 기록으로 남긴다
    const me = { visited: x.visited }, h = L.tracks.hanul, y = L.tracks.yuna;
    if (h && h.j4At && !factIs('J4', 'ignore') && !wasAt(me, h.j4At, 'ridge'))
      contradiction(`서하늘 영상: ${hm(h.j4At)} 능선의 붉은 등산복 · 한정우 GPS: 그 시각 ${placeName(posAt(me, h.j4At))}`);
    if (h && factIs('J7', 'give') && !x.gotJ7)
      contradiction(`서하늘: ${hm(h.j7At)} 전망대에서 붉은 등산복에게 보조배터리를 줬다 · 한정우 GPS: 그 시각 ${placeName(posAt(me, h.j7At))}`);
    if (y && y.sawAt && !wasAt(me, y.sawAt, 'summit'))
      contradiction(`정윤아 목격: ${hm(y.sawAt)} 정상의 붉은 등산복 · 한정우 GPS: 그 시각 ${placeName(posAt(me, y.sawAt))}`);
    L.tracks.jungwoo = { visited: x.visited, restAt: x.restAt, alibi: Math.round(x.alibi), battery: Math.round(S.battery), gpsGap: x.gpsGap,
      pos: S.seg ? { seg: S.seg, prog: S.prog } : { node: S.node }, op: x.op, powerbank: S.powerbank, guest: x.metMisuk === 'window', twistAnswered: !!x.twistAnswered, j2bAt: x.j2bAt, gotJ7: x.gotJ7, child: x.child, endT: S.t };
  },

  bot() {
    if (S.modal) {
      if (S.modal.resolve) act(`resolve:${params.get('r4') || 'stop'}`);
      else { const E = evDef(S.modal.id), o = E.options.find((p) => p.id === params.get('j2b') && !p.disabled) || E.options[0]; act(`tev:${S.modal.id}:${o.id}`); }
      return;
    }
    if (S.call) {
      const D = C.decisions[S.call.id];
      if (S.call.state === 'ring') act('call:answer');
      else if (S.call.line < D.lines.length - 1) act('call:next');
      else act(`call:opt:${S.call.id === 'twist' ? (BOT === 'approve' ? 'approve' : 'stop') : D.options[0].id}`);
      return;
    }
    if (!S.seg && !busy()) {
      if (params.get('late') && S.node === 'gate' && S.t < toMin('07:40')) return;
      if (params.get('stay') && S.node === 'rest1' && S.t < toMin('08:00')) { if (!S.charging && this.charger() === 'free') act('charge'); }
      else if (S.node === 'rest1' && !S.exp && S.battery < 90 && this.charger() === 'free' && !S.charging) act('charge');
      else if (S.stamina > 40 && !(S.node === 'rest1' && S.charging && S.battery < 90)) {
        const n = nextSegs();
        if (n.length) act(`go:${(params.get('route') === 'valley' ? n[n.length - 1] : n[0]).id}`);
      }
    } else if (S.seg && !S.walking && S.stamina > 40) act('walk');
    if (S.walking && S.stamina < 5) act('stop');
    if (S.t - (S.botAt || 0) >= 30) {
      S.botAt = S.t;
      for (const c of ['police', 'field', 'op']) act(`chan:${c}`);
      act('app:news'); act('app:map');
    }
    if (S.t === toMin('08:10') && !S.botCmd) { S.botCmd = 1; act('cmd:port'); act('card:evac'); act('send'); }
  },
};
