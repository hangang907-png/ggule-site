'use strict';
// 2부 — 13시 (12:30–13:10). 다섯 대의 휴대폰을 오가며 한 번에 지나간다.
// 여기서 할 수 있는 일은 모두 1부가 남긴 것으로 정해진다: 어디에 있는지, 배터리가 얼마인지, 무엇을 아는지, 무엇을 하기로 했는지.
// 쥐지 않은 사람은 자기 결심대로 움직인다. 플레이어가 할 수 있는 건 그 일을 더 일찍 하게 하는 것, 그리고 서로의 때를 맞추는 것이다.
// 쓰는 사실: T13(13시에 일어난 일), DAEUN(다은), ARTICLE(정윤아의 기사)

const P2_ORDER = ['misuk', 'hanul', 'yuna', 'jungwoo', 'doyun'];
const P2_LEAD = 5;      // 작전팀이 철수하는 데 드는 시간(분). 이보다 늦은 중단은 닿지 않는다.
const P2_EVAC = 10;     // 역을 비우는 데 드는 시간
const P2_ESCAPE = 8;    // 다은이 지하에서 밖으로 나오는 데 드는 시간

// 산길 위의 위치를 앞으로 옮긴다. left: 남은 "산길 분"(걸음 배수를 곱한 값). toSummit 이면 지점에서 멈추지 않는다.
function p2Advance(pos, left, toSummit) {
  let p = pos.seg ? { seg: pos.seg, prog: pos.prog || 0 } : { node: pos.node };
  for (let i = 0; i < 12; i++) {
    if (p.node) {
      const next = SEGMENTS.find((s) => s.from === p.node);
      if (!next || !toSummit || left <= 0) return { p, left };
      p = { seg: next.id, prog: 0 };
    }
    const seg = SEG[p.seg], need = (1 - p.prog) * seg.minutes;
    if (left < need) return { p: { seg: p.seg, prog: p.prog + left / seg.minutes }, left: 0 };
    left -= need; p = { node: seg.to };
    if (!toSummit) return { p, left };
  }
  return { p, left };
}
const p2Place = (p) => (p.away ? p.away : p.pos.node ? NODES[p.pos.node].name : `${SEG[p.pos.seg].name} → ${NODES[SEG[p.pos.seg].to].name}`);
const p2Sig = (p) => (p.sigFixed != null ? p.sigFixed : p.pos.node ? NODES[p.pos.node].signal : SEG[p.pos.seg].signal);
const p2Alive = (p) => p.bat > 0;
const p2Together = (a, b) => !a.away && !b.away && !!a.pos.node && a.pos.node === b.pos.node;

CHAPTERS.part2 = {
  num: 6, who: '다섯 대의 휴대폰', title: '13시', start: '12:30', end: '13:10', node: 'summit',
  mobile: false, drain: () => 0, speedScale: 1 / 6, autoEnd: true, endWord: '13시', placeLabel: '해령산과 그 아래',
  get indoor() { return !!S && ['misuk', 'doyun'].includes(S.x.cur) && !S.x.p[S.x.cur].away; },
  rattleLine: '창이 낮게 떨린다.',
  intro: '12시 반. 다섯 사람은 저마다의 자리에서 30분 뒤를 모른 채, 또는 아는 채로 서 있다. 이제 다섯 대의 휴대폰을 오간다. 쥐지 않은 사람은 자기가 정한 대로 움직인다.',
  how: ['휴대폰 위의 <b>이름 탭</b>(또는 숫자 <b>1~5</b>)으로 사람을 바꾼다. 바꾸는 데 드는 시간은 없다',
    '할 수 있는 일은 <b>1부에서 남긴 것</b>으로 정해진다: 있는 곳, 배터리, 아는 것, 결심',
    '쥐지 않은 사람은 <b>결심대로</b> 움직인다. 다만 느리다. 직접 쥐면 더 일찍 하게 할 수 있다',
    '1분이 6초다. 40분이 4분에 지나간다'],
  inherited: () => inheritedNote(),
  routes: {}, channels: [], apps: [], decisions: {}, trailEvents: {},

  init() {
    const T = L.tracks, f = (id) => (getFact(id) ? getFact(id).value : null);
    const person = (id, o) => ({ id, name: PEOPLE[id], feed: [], unread: 0, done: {}, bat: 100, pos: { node: 'gate' }, resolve: null, ...o });
    const p = {};
    // 오미숙: 10:30부터 두 시간. 내려갔다면 충전기 없이 걷는 중이다.
    const m = T.misuk || {};
    p.misuk = person('misuk', { resolve: f('R1') || 'wait', pos: { node: 'rest1' }, powerbank: m.powerbank || 0,
      bat: f('R1') === 'pickup' ? Math.max(0, (m.battery ?? 60) - 18) : Math.max(m.battery ?? 60, 60) });
    if (p.misuk.resolve === 'pickup') { p.misuk.away = '참나무 숲길 — 걸어서 하산 중'; p.misuk.sigFixed = 3; }
    // 서하늘: 11:30부터 한 시간. 정상으로 가기로 했다면 걸었고, 내려가기로 했다면 내려갔다.
    const h = T.hanul || { pos: { node: 'view' }, battery: 40, powerbank: 0 };
    p.hanul = person('hanul', { resolve: f('R2') || 'summit', bat: h.battery, powerbank: h.powerbank || 0, pace: 1.6, live: false });
    if (p.hanul.resolve === 'summit') p.hanul.pos = p2Advance(h.pos, 60 * 1.6, true).p;
    else if (p.hanul.resolve === 'down') { p.hanul.pos = { node: 'rest1' }; p.hanul.away = '돌계단 — 하산 중'; p.hanul.sigFixed = 2; }
    else p.hanul.pos = h.pos.seg ? p2Advance(h.pos, 60 * 1.6, false).p : h.pos;
    // 정윤아·한정우: 12:30에 서 있던 그 자리
    const y = T.yuna || { pos: { node: 'summit' }, battery: 50, notes: [] };
    p.yuna = person('yuna', { resolve: f('R3') || 'file', bat: y.battery, pos: y.pos, pace: 1.6, notes: (y.notes || []).map((n) => n.k), knows: false });
    const j = T.jungwoo || { pos: { node: 'summit' }, battery: 50, op: 'hidden', alibi: 50 };
    p.jungwoo = person('jungwoo', { resolve: f('R4') || 'silent', bat: j.battery, pos: j.pos, pace: 1, powerbank: j.powerbank || 0, knowsOp: j.op !== 'hidden', alibi: j.alibi });
    const d = T.doyun || {};
    p.doyun = person('doyun', { resolve: f('R5') || 'obey', away: '매표소 주차장 — 차 안', sigFixed: 4, boss: d.boss || null });
    if (p.doyun.resolve === 'bail') p.doyun.away = '매표소 주차장을 빠져나가는 차 안';
    S.x = { p, cur: 'misuk', t2: toMin(f('J15') === 'advance' ? '12:45' : '13:00'), acts: [], later: [],
      daeun: ['shelter'].includes(f('J3')) ? 'shelter' : 'station', daeunSafeAt: null, withdrawAt: null, exposedAt: null, alarmAt: null, outcome: null };
    // 4장에서 신호가 없어 못 나간 본부장의 답은 신호가 잡히는 대로 나간다
    const j11 = f('J11');
    if (j11 && j11.opt !== 'none' && j11.arriveAt == null) S.x.pendingAnswer = j11.opt;
  },
  begin() {
    const x = S.x;
    for (const id of P2_ORDER) {
      const p = x.p[id];
      this.push(id, `12:30 · ${p2Place(p)} · 배터리 ${Math.round(p.bat)}%`, 'sys');
    }
    this.push('misuk', x.daeun === 'station' ? '다은: 12시 40분 기차가 또 밀렸대. 1시 넘어야 온대. 지하 환승통로에서 기다리는 중. 사람 진짜 많아' : '다은: 대피소는 아직 깜깜해. 그래도 다들 같이 있어', '');
    const d = x.p.doyun, obeysStop = d.resolve === 'obey' && d.boss === 'stop';
    if (x.p.jungwoo.knowsOp && !obeysStop) this.push('jungwoo', '단풍 · 김도윤: 13시 중앙역 지하. 예정대로입니다.', 'urg');
    this.push('doyun', `안 실장: 중앙역 준비 끝. ${hm(x.t2)} 정각에 갑니다.`, 'urg');
    if (obeysStop) this.say('doyun', '본부장의 지시는 중단이었다. 안 실장에게는 아직 전하지 않았다. 이제 전해야 한다.', 'dim', linkTag('J11'));
    if (x.t2 !== toMin('13:00')) this.say('doyun', '본부장에게는 13시라고 해 두었다. 실제는 12시 45분이다.', 'dim', linkTag('J15'));
    if (factIs('J15', 'advance')) this.link('J15', '2단계가 12:45로 당겨져 있다');
    this.push('yuna', '강 부장: 13:40 마감이다.', '');
    trailText('12시 반. 산 위와 산 아래, 다섯 대의 휴대폰.', 'place');
    this.focus('misuk', true);
  },

  // 그 사람의 휴대폰에 뜨는 것. 곁에 다른 사람이 있으면 그 사람 귀에는 벨소리로 들린다(GDD 10.1-5).
  push(id, text, cls) {
    const x = S.x, p = x.p[id];
    if (!p2Alive(p) && cls !== 'sys') return;   // 꺼진 휴대폰에는 아무것도 오지 않는다
    p.feed.push({ t: S.t, text, cls: cls || '' });
    if (id === x.cur || cls === 'sys' || S.silent) return;
    p.unread++;
    const me = x.p[x.cur];
    if (p2Together(me, p) && p2Alive(p)) { trailText(`몇 걸음 옆에서 ${p.name}의 휴대폰이 울린다.`, 'dim'); if (AU.ctx && CHAPTERS[id].ringtone) CHAPTERS[id].ringtone(AU); }
  },
  link(id, text) { if (getFact(id)) noteLink(id, text); },
  say(id, text, cls, tag) { trailText(`[${S.x.p[id].name}] ${text}`, cls || '', tag || ''); },
  focus(id, quiet) {
    const x = S.x, p = x.p[id];
    x.cur = id; p.unread = 0;
    S.node = p.pos.node || SEG[p.pos.seg].to;   // 바람과 도시의 웅웅거림은 그 사람이 선 자리의 것이다
    if (!quiet) AU.click();
  },
  record(who, act, eff) { S.x.acts.push({ t: S.t, who, act, eff: eff || null }); log(`${PEOPLE[who]}: ${act}${eff ? ` → ${eff}` : ''}`); },
  after(min, fn) { S.x.later.push({ at: S.t + min, fn }); },

  // 할 수 있는 일. why 가 있으면 지금은 못 한다(그 까닭을 화면에 그대로 쓴다). auto: 쥐지 않아도 결심대로 하게 되는 시각.
  options(id) {
    const x = S.x, p = x.p[id], o = [], sig = p2Sig(p);
    const phone = !p2Alive(p) ? '휴대폰이 꺼져 있다' : sig === 0 ? '신호가 없다' : null;
    if (id === 'misuk') {
      const how = { wait: ['전화로', 2], pickup: ['걸으며 전화로', 3], warn: ['손님들 사이에서 문자로', 6] }[p.resolve];
      const label = x.daeun === 'station' ? `다은에게 "지하에 있지 말고 역 밖으로 나와 있어."` : '다은에게 "거기서 움직이지 마."';
      o.push({ id: 'daeun', label, note: `${how[0]} · ${how[1]}분 뒤 닿는다${x.daeun === 'station' ? ` · 다은이 나오는 데 ${P2_ESCAPE}분` : ''}`, tag: linkTag('R1') + linkTag('J3'),
        why: p.done.daeun ? '이미 말했다' : phone, auto: { pickup: '12:45', wait: '12:52' }[p.resolve], lag: how[1] });
    }
    if (id === 'hanul') {
      const why = p.resolve === 'down' ? '방송을 끄고 내려가기로 했다' : phone;
      o.push({ id: 'live', label: p.live ? '방송 끄기' : '방송 켜기', note: p.live ? '배터리를 아낀다' : '배터리 −0.6%/분 · 곁에서 일어나는 일이 그대로 나간다', tag: linkTag('R2'), why,
        auto: !p.live && !p.done.liveOff && p.resolve === 'summit' ? '12:32' : null });
    }
    if (id === 'hanul' || id === 'jungwoo' || id === 'misuk') {
      if (p.powerbank > 0) o.push({ id: 'powerbank', label: `보조배터리 쓰기 (${p.powerbank}개)`, note: '+30%', why: p.resolve === 'silent' ? '휴대폰을 내려놓았다' : null });
    }
    if (id === 'yuna') {
      const jw = x.p.jungwoo;
      if (p.resolve === 'ask') o.push({ id: 'ask', label: '한정우 본부장에게 다가가 묻는다', note: '같은 자리에 있어야 한다', tag: linkTag('R3'),
        why: p.done.ask ? '이미 물었다' : !p2Together(p, jw) ? `본부장이 곁에 없다 (본부장: ${p2Place(jw)})` : null, auto: '12:40' });
      o.push({ id: 'report', label: '112에 신고한다: "13시 중앙역 지하"', note: `역을 비우는 데 ${P2_EVAC}분`, why: p.done.report ? '이미 신고했다' : !p.knows ? '13시에 무슨 일이 있는지 모른다' : !p2Alive(p) ? '휴대폰이 꺼져 있다' : sig < 2 ? '통화하려면 신호 2칸이 필요하다' : null, auto: 'knows' });
      o.push({ id: 'file', label: `기사를 송고한다: "${this.headline()[1]}"`, note: `수첩 ${p.notes.length}건${p.knows ? ' + 작전 문건' : ''}`, tag: linkTag('R3'),
        why: p.done.file ? '이미 보냈다' : p.resolve === 'hold' && !p.knows ? '확인될 때까지 붙잡기로 했다' : p.resolve === 'ask' && !p.done.ask ? '먼저 본부장에게 묻기로 했다' : phone, auto: p.resolve === 'file' ? '12:55' : 'knows' });
    }
    if (id === 'jungwoo') {
      const quiet = p.resolve === 'silent' ? '휴대폰을 내려놓기로 했다' : null, blind = !p.knowsOp ? '무슨 일이 벌어지는지 모른다' : null;
      if (p.resolve === 'stop') o.push({ id: 'stop', label: '김도윤에게 "중단해. 지금 당장."', note: sig > 0 ? `${SEND_LAG[sig]}분 뒤 닿는다` : '신호가 잡혀야 나간다', tag: linkTag('R4'),
        why: p.done.stop ? '이미 보냈다' : blind || phone, auto: '12:36' });
      if (p.resolve === 'expose') {
        const h = x.p.hanul, near = p2Together(p, h) && h.live;
        o.push({ id: 'expose', label: '방송 중인 유튜버의 카메라 앞에 "단풍" 대화방을 든다', note: '그 순간 세상이 본다', tag: linkTag('R4') + linkTag('R2'),
          why: p.done.expose || p.done.post ? '이미 내보였다' : !p2Alive(p) ? '휴대폰이 꺼져 있다' : !p2Together(p, h) ? `유튜버가 곁에 없다 (서하늘: ${p2Place(h)})` : !h.live ? '곁의 유튜버는 방송을 켜고 있지 않다' : null, auto: near ? '12:40' : null });
        o.push({ id: 'post', label: '대화방 캡처를 직접 SNS에 올린다', note: '퍼지는 데 12분', tag: linkTag('R4'),
          why: p.done.expose || p.done.post ? '이미 내보였다' : !p2Alive(p) ? '휴대폰이 꺼져 있다' : sig < 2 ? '올리려면 신호 2칸이 필요하다' : null, auto: near ? null : '12:44' });
      }
      if (p.resolve === 'approve' || p.resolve === 'silent') o.push({ id: 'none', label: p.resolve === 'approve' ? '2단계를 그대로 둔다' : '아무것도 하지 않는다', tag: linkTag('R4'), why: quiet || '그러기로 했다' });
    }
    if (id === 'doyun') {
      const y = x.p.yuna;
      o.push({ id: 'withdraw', label: '안 실장에게 "철수해. 전부."', note: `철수에 ${P2_LEAD}분 · 지금 받은 지시: ${p.boss === 'stop' ? '중단' : p.boss === 'approve' ? '승인' : '없음(승인으로 간주)'}`, tag: linkTag('R5') + (getFact('J11') ? linkTag('J11') : ''),
        why: p.done.withdraw ? '이미 지시했다' : p.resolve === 'finish' ? '무조건 완수하기로 했다' : p.resolve === 'bail' ? '혼자 빠지기로 했다' : p.boss !== 'stop' ? '본부장의 중단 지시가 없다' : null, auto: 'boss' });
      if (p.resolve === 'bail') o.push({ id: 'leak', label: `정윤아 기자에게 ${factIs('J14', 'copy') ? '경비 철수 공문 사본과 대화방을' : '대화방 캡처를'} 보낸다`, note: '2분 뒤 닿는다', tag: linkTag('R5') + (getFact('J10') ? linkTag('J10') : ''),
        why: p.done.leak ? '이미 보냈다' : !factIs('J10', 'called') ? '기자의 번호를 모른다 (기자는 전화하지 않았다)' : null, auto: '12:42' });
    }
    return o;
  },
  headline() {
    const x = S.x, p = x.p.yuna, n = (k) => p.notes.includes(k);
    const boomed = ['happened', 'evacuated'].includes(x.outcome);   // 이미 터진 뒤에 쓰는 기사는 그 일을 먼저 말한다
    if (p.knows) return ['plot', boomed ? '중앙역 폭발은 예고돼 있었다 — 시 안전본부 "13시" 문건' : '"13시 중앙역" — 시 안전본부 작전 문건 입수'];
    if (boomed) return [n('boss') && n('guard') ? 'guard' : n('boss') || n('summit') || n('met') ? 'boss' : n('tip') || n('car') ? 'hint' : 'sketch',
      n('boss') || n('summit') || n('met') ? '중앙역마저 터진 시각, 안전본부장은 해령산에 있었다' : '중앙역 폭발 — 해령산에서 본 두 번째 연기'];
    if (n('boss') && n('guard')) return ['guard', '폭발 전 새벽 경비 철수… 그날 본부장은 산에 있었다'];
    if (n('boss') || n('summit') || n('met')) return ['boss', '항만이 타던 날, 안전본부장은 해령산에'];
    if (n('tip') || n('car')) return ['hint', '항만 폭발 "사고 아니다" 제보… 시는 침묵'];
    return ['sketch', '단풍 절정의 해령산, 산 아래는 연기'];
  },

  doIt(id, opt) {
    const x = S.x, p = x.p[id], o = this.options(id).find((q) => q.id === opt);
    if (!o || o.why) return;
    p.done[opt] = S.t;
    if (opt === 'powerbank') { p.done.powerbank = null; p.powerbank--; p.bat = Math.min(100, p.bat + 30); this.say(id, '보조배터리를 연결한다. +30%'); this.record(id, '보조배터리 사용'); return; }
    if (opt === 'daeun') {
      this.say(id, x.daeun === 'station' ? '"다은아, 사람 많은 지하에 있지 말고 역 밖에 나와 있어. 엄마가 불안해서 그래."' : '"거기서 움직이지 마. 엄마가 연락할게."', 'clue', linkTag('J3'));
      this.link('J3', x.daeun === 'station' ? '다은은 중앙역 지하에서 기차를 기다리고 있었다' : '다은은 동사무소 대피소에 있었다');
      this.link('R1', { wait: '쉼터에서 전화로 다은에게 닿았다', pickup: '내려가는 길에 다은에게 전화했다', warn: '손님들 틈에서 문자로 다은에게 알렸다' }[p.resolve]);
      this.after(o.lag, () => {
        if (x.daeun !== 'station') { this.push('misuk', '다은: 응. 여기 있을게 엄마', ''); return; }
        x.daeunSafeAt = S.t + P2_ESCAPE;
        this.push('misuk', '다은: 왜? …알았어. 올라갈게. 사람이 많아서 좀 걸려', '');
        this.after(P2_ESCAPE, () => { if (!(x.outcome && x.daeunFate === 'inside')) this.push('misuk', '다은: 나왔어. 역 광장이야', ''); });
      });
      this.record(id, '다은에게 역에서 나오라고 함', `${hm(S.t + o.lag + P2_ESCAPE)}에 밖으로`);
    }
    if (opt === 'live') {
      p.live = !p.live; p.done.live = null;
      if (!p.live) p.done.liveOff = S.t;
      this.say(id, p.live ? '방송을 켠다. "여러분, 저 아직 산에 있어요."' : '방송을 끈다.', '', linkTag('R2'));
      if (p.live) this.link('R2', '서하늘은 산에 남아 방송을 켰다');
      this.record(id, p.live ? '방송 시작' : '방송 끝');
    }
    if (opt === 'ask') {
      const jw = x.p.jungwoo, tells = ['expose', 'stop'].includes(jw.resolve) && jw.knowsOp;
      this.say(id, '"한정우 본부장님. 해령일보 정윤아입니다. 오늘 왜 산에 계십니까."', 'clue', linkTag('R3'));
      this.link('R3', '정윤아는 본부장을 찾아 직접 물었다');
      if (tells) {
        this.say('jungwoo', jw.resolve === 'expose' ? '대답 대신 휴대폰 화면을 내민다. "단풍" 대화방이다.' : '"…13시, 중앙역 지하입니다. 신고하세요. 지금."', 'clue', linkTag('R4'));
        this.link('R4', '본부장이 기자에게 13시를 알렸다');
        this.learn(jw.resolve === 'expose' ? '본부장이 내민 대화방에서 읽었다' : '본부장에게서 직접 들었다');
      } else { this.say('jungwoo', '"산행 중입니다." 그는 등을 돌린다.', 'dim', linkTag('R4')); p.notes.push('met'); }
      this.record(id, '본부장에게 물음', tells ? '13시 중앙역을 알게 됨' : '답을 듣지 못함');
    }
    if (opt === 'report') {
      x.alarmAt = S.t + 2;
      this.say(id, '"해령일보 정윤아 기자입니다. 13시 중앙역 지하입니다. 시 안전본부 내부 대화에서 확인했습니다. 지금 역을 비워야 합니다."', 'clue');
      this.after(2, () => this.push('yuna', '112: 접수됐습니다. 중앙역 대피 방송 시작합니다.', 'urg'));
      this.record(id, '112 신고', `${hm(x.alarmAt)} 대피 시작`);
    }
    if (opt === 'file') {
      const [level, title] = this.headline();
      x.article = { level, title, t: S.t };
      this.say(id, `기사를 보낸다. "${title}"`, 'clue', linkTag('R3'));
      this.link('R3', '정윤아는 마감 전에 기사를 보냈다');
      const boomed = ['happened', 'evacuated'].includes(x.outcome);
      this.after(3, () => this.push('yuna', level === 'plot' ? '강 부장: …이거 진짜냐. 지금 1면 비운다.' : boomed ? '강 부장: 받았다. 지금은 뭐든 건다. 너 거기서 움직이지 마.' : level === 'sketch' ? '강 부장: 스케치는 받았다. 수고했다.' : '강 부장: 받았다. 팩트 한 번 더 확인하고 건다.', ''));
      this.record(id, '기사 송고', title);
    }
    if (opt === 'stop') {
      const lag = SEND_LAG[p2Sig(p)];
      this.say(id, '"중단해. 지금 당장." 보낸다.', 'clue', linkTag('R4'));
      this.link('R4', '본부장은 13시 전에 중단을 지시했다');
      this.after(lag, () => this.bossSays('stop', 'R4'));
      this.record(id, '중단 지시', `${hm(S.t + lag)} 도착`);
    }
    if (opt === 'expose' || opt === 'post') {
      x.exposedAt = S.t + (opt === 'expose' ? 0 : 12);
      p.alibi = 0;
      if (opt === 'expose') {
        this.say(id, '유튜버의 카메라 앞에 휴대폰을 든다. "해령시 안전본부장 한정우입니다. 이 대화방을 보십시오."', 'clue', linkTag('R4'));
        this.say('hanul', '화면에 대화방이 그대로 잡힌다. 시청자 수가 미친 듯이 뛴다.', 'clue', linkTag('R2'));
        this.push('hanul', '채팅: 이거 진짜임???? · 13시 중앙역?? · 다들 퍼뜨려', 'urg');
        this.link('R2', '서하늘의 방송이 그 순간을 내보냈다');
      } else this.say(id, '대화방 캡처를 올린다. 올라가는 막대가 느리다.', 'clue', linkTag('R4'));
      this.link('R4', '본부장은 "단풍" 대화방을 세상에 보였다');
      this.after(opt === 'expose' ? 1 : 12, () => { this.push('doyun', '안 실장: 대화방이 떴습니다. 다 떴습니다.', 'urg'); this.learn('공개된 대화방을 봤다'); });
      this.record(id, opt === 'expose' ? '방송에 대화방 공개' : 'SNS에 캡처 게시', `${hm(x.exposedAt)}부터 퍼짐`);
    }
    if (opt === 'withdraw') {
      x.withdrawAt = S.t + 1;
      this.say(id, '"철수해. 전부. 지금."', 'clue', linkTag('R5'));
      this.link('R5', '김도윤은 본부장의 지시대로 철수를 명령했다');
      if (!p.bossAt) this.link('J11', '1부에서 받은 본부장의 중단 지시가 이제야 안 실장에게 전해졌다');
      this.after(1, () => this.push('doyun', x.withdrawAt <= x.t2 - P2_LEAD ? '안 실장: …철수합니다.' : '안 실장: 늦었습니다. 이미 들어갔습니다.', 'urg'));
      this.record(id, '철수 지시', hm(x.withdrawAt));
    }
    if (opt === 'leak') {
      this.say(id, '업무폰에 남은 번호로 파일을 보낸다. 보내고 번호를 지운다.', 'clue', linkTag('R5'));
      this.link('R5', '김도윤은 증거를 기자에게 넘기고 빠졌다');
      if (getFact('J10')) this.link('J10', '기자가 남긴 번호로 증거가 갔다');
      if (factIs('J14', 'copy')) this.link('J14', '챙겨 둔 공문 사본이 기자에게 갔다');
      this.after(2, () => { x.leakWaiting = true; });
      this.record(id, '기자에게 증거 전달');
    }
  },
  learn(how) {
    const y = S.x.p.yuna;
    if (y.knows) return;
    y.knows = S.t;
    this.push('yuna', `13시 중앙역 지하 — ${how}`, 'urg');
  },
  // fact: 그 지시가 어디서 왔는가. 4장에서 못 나간 답이면 J11, 2부에서 새로 보낸 것이면 R4.
  bossSays(opt, fact) {
    const x = S.x, d = x.p.doyun;
    d.boss = opt; d.bossAt = S.t;
    this.push('doyun', `단풍 · 한정우: ${opt === 'stop' ? '중단해. 지금 당장.' : '2단계 승인'}`, 'urg');
    this.link(fact, fact === 'J11' ? `4장에서 못 나간 본부장의 답이 ${hm(S.t)}에야 닿았다` : `본부장의 새 지시가 ${hm(S.t)}에 김도윤에게 닿았다`);
  },

  tick() {
    const x = S.x, t = S.t;
    // 예약된 일이 또 다른 일을 예약할 수 있으니, 먼저 덜어 내고 나서 실행한다
    const due = x.later.filter((l) => l.at <= t);
    x.later = x.later.filter((l) => l.at > t);
    for (const l of due) l.fn();
    for (const id of P2_ORDER) {
      const p = x.p[id];
      // 걷던 사람은 계속 걷는다
      if (p.pos.seg && !p.away) {
        const r = p2Advance(p.pos, p.pace || 1, id === 'hanul' && p.resolve === 'summit');
        p.pos = r.p;
        if (p.pos.node) { this.say(id, `${NODES[p.pos.node].name}에 닿았다.`, 'place'); if (id === x.cur) S.node = p.pos.node; }
      }
      // 배터리
      const was = p2Alive(p);
      const drain = id === 'doyun' || (id === 'misuk' && !p.away) ? 0 : id === 'hanul' && p.live ? 0.6 : id === 'misuk' ? 0.15 : 0.08;
      p.bat = Math.max(0, p.bat - drain * (p2Sig(p) <= 1 ? 2 : 1));
      if (was && !p2Alive(p)) { this.say(id, '휴대폰이 꺼졌다. 배터리 0%.', 'warn'); if (p.live) { p.live = false; this.say(id, '방송이 끊겼다.', 'warn'); } }
      if (p.live && p2Sig(p) === 0) { p.live = false; this.say(id, '신호가 끊겨 방송이 끊겼다.', 'warn'); }
    }
    // 4장에서 못 나간 답, 기자에게 가는 파일: 신호가 잡혀야 오간다
    const j = x.p.jungwoo, y = x.p.yuna;
    if (x.pendingAnswer && p2Alive(j) && p2Sig(j) > 0) { const opt = x.pendingAnswer; x.pendingAnswer = null; this.say('jungwoo', '신호가 잡힌다. 아까 보낸 답이 이제야 나간다.', 'dim', linkTag('J11')); this.after(SEND_LAG[p2Sig(j)], () => this.bossSays(opt, 'J11')); }
    if (x.leakWaiting && p2Alive(y) && p2Sig(y) > 0) { x.leakWaiting = false; this.learn('모르는 번호에서 온 파일'); }
    // 쥐지 않아도 결심대로 한다 — 다만 정해진 때에
    for (const id of P2_ORDER) for (const o of this.options(id)) {
      if (o.why || !o.auto) continue;
      const p = x.p[id];
      const due = o.auto === 'knows' ? (x.p.yuna.knows ? x.p.yuna.knows + (o.id === 'file' ? 6 : 2) : null) : o.auto === 'boss' ? Math.max(toMin('12:32'), (p.bossAt || 0) + 2) : toMin(o.auto);
      if (due != null && t >= due) this.doIt(id, o.id);
    }
    if (t === x.t2) this.strike();
    if (t === toMin('13:00') && x.t2 !== t && x.outcome) trailText('13시. 원래 약속된 시각이 지나간다.', 'dim');
  },

  // 2단계의 시각
  strike() {
    const x = S.x, lead = x.t2 - P2_LEAD;
    const stopped = x.withdrawAt != null && x.withdrawAt <= lead, exposed = x.exposedAt != null && x.exposedAt <= lead;
    const evac = x.alarmAt != null && x.alarmAt <= x.t2 - P2_EVAC;
    x.outcome = exposed ? 'exposed' : stopped ? 'stopped' : evac ? 'evacuated' : 'happened';
    const boom = x.outcome === 'happened' || x.outcome === 'evacuated';
    x.daeunFate = x.daeun !== 'station' ? 'shelter' : !boom ? 'spared' : (x.daeunSafeAt != null && x.daeunSafeAt <= x.t2) || evac ? 'out' : 'inside';
    truthLog(`[13시] ${{ exposed: '공개로 무산', stopped: '중단', evacuated: '발생 — 대피로 피해 감소', happened: '발생' }[x.outcome]}`);
    if (boom) {
      explosion('station', 3);
      // 같은 소리를 다섯 자리에서 듣는다
      const heard = { misuk: x.p.misuk.away ? '숲길에서 발이 멈춘다. 남쪽이다. 역 쪽이다.' : '쉼터 유리창이 떨린다. TV 화면이 한 번 깨진다.',
        hanul: x.p.hanul.live ? '카메라가 저절로 남쪽으로 돌아간다. 채팅창이 멈춘다.' : '남쪽에서 가슴을 치는 소리. 손이 휴대폰을 찾는다.',
        yuna: evac ? '수첩을 쥔 손이 떨린다. 신고는 들어갔다. 얼마나 비웠을까.' : '수첩에 시각을 적는다. 손이 말을 듣지 않는다.',
        jungwoo: '남쪽 하늘에 새 연기가 선다. 그는 그것이 어디인지 안다.', doyun: '차체가 낮게 떨린다. 안주머니의 작전폰이 한 번 울고 조용해진다.' };
      for (const id of P2_ORDER) this.say(id, heard[id], 'boom');
      this.after(4, () => { for (const id of P2_ORDER) if (id !== 'doyun') this.push(id, evac ? '[속보] 중앙역 지하 폭발… 직전 대피 방송으로 승객 대부분 빠져나와' : '[속보] 중앙역 지하 환승통로 폭발… 사상자 다수', 'urg'); });
    } else {
      trailText(`${hm(S.t)}. 아무 소리도 나지 않는다.`, 'place');
      const ex = x.outcome === 'exposed', known = ex || x.alarmAt != null;   // 역에 무슨 말이라도 돌았는가
      const calm = { misuk: x.p.misuk.away ? '숲길은 조용하다. 남쪽에서 아무 소리도 오지 않는다.' : ex ? 'TV 자막이 바뀐다. "안전본부장 대화방 공개".' : 'TV는 여전히 항만을 비춘다.',
        hanul: x.p.hanul.live ? (ex ? '채팅창이 읽을 수 없는 속도로 올라간다.' : '카메라는 조용한 남쪽 하늘을 비춘다.') : '바람 소리뿐이다.', yuna: known ? '데스크 전화가 끊이지 않는다.' : '시계를 본다. 초침이 지나간다.',
        jungwoo: ex ? '휴대폰이 쉬지 않고 울린다. 받지 않는다.' : '남쪽 하늘에 새 연기는 서지 않는다.', doyun: ex ? '작전폰의 대화방에서 사람들이 하나씩 나간다.' : '작전폰은 조용하다. 안 실장의 "철수합니다"가 마지막 글이다. 그는 기어를 넣는다.' };
      if (ex) this.push('jungwoo', '부재중 전화 23통 · 시장실, 언론팀, 모르는 번호들', 'urg');
      for (const id of P2_ORDER) this.say(id, calm[id], 'dim');
    }
    const waited = x.daeunSafeAt != null && x.daeunSafeAt <= x.t2;
    const cleared = x.outcome === 'exposed' || x.alarmAt != null;   // 역에 대피 방송이나 소문이 돌았다
    const d = { shelter: '다은: 엄마, 나 대피소야. 괜찮아', spared: cleared ? '다은: 엄마, 역에서 다 나가래. 방송 나오고 난리야. 나 밖에 있어' : waited ? '다은: 엄마, 밖에 나와 있는데 아무 일도 없어. 기차 놓치겠다. 다시 들어가도 돼?' : '다은: 기차가 또 지연이래. 엄마 나 그냥 여기서 기다릴게', out: '다은: 엄마… 방금 역에서 터졌어. 나 밖이야. 엄마 말 듣고 나와 있었어', inside: null }[x.daeunFate];
    this.after(3, () => { if (d) this.push('misuk', d, x.daeunFate === 'out' ? 'urg' : ''); else this.push('misuk', '(다은에게서 답이 없다)', 'sys'); });
  },

  act(k, a) {
    if (k === 'who' && S.x.p[a]) this.focus(a);
    if (k === 'do') this.doIt(S.x.cur, a);
  },

  head() {
    const p = S.x.p[S.x.cur];
    const res = { misuk: { pickup: '딸을 데리러 내려가기로 했다', wait: '쉼터에서 기다리며 연락하기로 했다', warn: '손님들을 내려보내기로 했다' },
      hanul: { summit: '끝까지 지켜보기로 했다', down: '내려가기로 했다', handover: '영상을 기자에게 넘겼다' }, yuna: { file: '확인한 것만 쓰기로 했다', hold: '확인될 때까지 붙잡기로 했다', ask: '본부장에게 직접 묻기로 했다' },
      jungwoo: { approve: '2단계를 그대로 두기로 했다', stop: '어떻게든 멈추기로 했다', silent: '아무것도 하지 않기로 했다', expose: '대화방을 세상에 보이기로 했다' },
      doyun: { obey: '본부장 지시대로 하기로 했다', finish: '무조건 완수하기로 했다', bail: '증거를 챙겨 빠지기로 했다' } }[p.id][p.resolve];
    return { place: `${p.name} — ${p2Place(p)}`, sub: `12:30의 결심: ${res}` };
  },
  badge() {
    const x = S.x, knows = x.cur === 'doyun' ? x.t2 : toMin('13:00'), left = knows - S.t;
    return { label: x.cur === 'doyun' ? '2단계까지' : '13시까지', value: x.outcome && S.t >= x.t2 && x.cur === 'doyun' ? '지났다' : left > 0 ? `${left}분` : '지났다' };
  },
  bars() {
    const p = S.x.p[S.x.cur], sig = p2Alive(p) ? p2Sig(p) : 0;
    return [{ label: '배터리', pct: p.bat, text: `${Math.round(p.bat)}%`, low: p.bat < 15 }, { label: '신호', pct: sig * 25, text: `${sig}칸`, low: sig < 2 }];
  },
  rule() { return '<small>쥐지 않은 사람은 결심대로 움직인다(버튼의 "그냥 두면" 시각) · 숫자 1~5로 사람을 바꾼다 · 1분 = 6초</small>'; },
  faceHint() { return facingCity() ? ' (도시 쪽)' : ''; },
  view() {
    const x = S.x, me = x.p[x.cur];
    const near = P2_ORDER.filter((id) => id !== x.cur && p2Together(me, x.p[id])).map((id) => `${x.p[id].name}${x.p[id].live ? ' (방송 중)' : ''}`);
    const rows = [near.length ? `곁에 있는 사람: <b>${near.join(', ')}</b>` : '아는 얼굴은 곁에 없다.'];
    if (me.pos.node && NODES[me.pos.node].overlook && !me.away) rows.push(facingCity() ? `남쪽: ${DISTRICTS.filter((d) => S.city[d.id].danger > 22).map((d) => `${d.name} 쪽 연기`).join(', ') || '도시는 조용해 보인다'}` : '도시는 남쪽에 있다. (Q/E)');
    return `<div class="view"><b>${me.name}의 자리</b><ul>${rows.map((r) => `<li>${r}</li>`).join('')}</ul></div>`;
  },
  actions() {
    return this.myActions() + this.overview();
  },
  myActions() {
    return this.options(S.x.cur).map((o) => btn(`do:${o.id}`, `${esc(o.label)}<small>${o.why ? `할 수 없다 — ${esc(o.why)}` : esc(o.note || '')}${!o.why && o.auto && !['knows', 'boss'].includes(o.auto) ? ` · 그냥 두면 ${o.auto}에 한다` : ''}</small>${o.tag || ''}`, !!o.why)).join('')
      || '<div class="dim">지금 이 사람이 할 수 있는 일은 없다.</div>';
  },
  // 다섯 사람이 지금 어디서 무엇을 앞두고 있는지 한눈에. 누르면 그 사람의 휴대폰을 쥔다.
  overview() {
    const x = S.x;
    const rows = P2_ORDER.map((id, i) => {
      const p = x.p[id], opts = this.options(id).filter((o) => !o.why && o.id !== 'powerbank' && o.id !== 'none');
      const due = (o) => (o.auto === 'knows' || o.auto === 'boss' || !o.auto ? null : o.auto);
      const next = opts.find((o) => due(o));
      const state = !p2Alive(p) ? '휴대폰 꺼짐' : next ? `그냥 두면 ${due(next)}에: ${next.label.replace(/<[^>]+>/g, '')}` : opts.length ? `지금 할 수 있다: ${opts[0].label}` : '할 수 있는 일 없음';
      return `<button class="p2row${id === x.cur ? ' on' : ''}" data-act="who:${id}"><b>${i + 1} ${p.name}</b> <small>${esc(p2Place(p))} · ${Math.round(p.bat)}%${p.live ? ' · 방송 중' : ''}</small><small>${esc(state)}</small></button>`;
    }).join('');
    return `<div class="cap">다섯 사람 — 누르거나 숫자 키로 바꾼다</div>${rows}`;
  },
  phoneView() {
    const x = S.x, p = x.p[x.cur], alive = p2Alive(p), sig = alive ? p2Sig(p) : 0;
    const tabs = P2_ORDER.map((id) => { const q = x.p[id]; return `<button class="${id === x.cur ? 'on' : ''}${p2Alive(q) ? '' : ' dead'}" data-act="who:${id}">${q.name.slice(1)}${q.unread ? `<em>${q.unread}</em>` : ''}</button>`; }).join('');
    const bars = [1, 2, 3, 4].map((i) => `<i class="${i <= sig ? 'on' : ''}" style="height:${3 + i * 3}px"></i>`).join('');
    const feed = p.feed.map((f) => (f.cls === 'sys' ? `<div class="sys">${esc(f.text)}</div>` : `<div class="bub ${f.cls}"><p>${esc(f.text)}</p><small>${hm(f.t)}</small></div>`)).join('');
    return { cls: `p2 ${val(CHAPTERS[x.cur].phoneClass) || ''}`,
      status: alive ? `<span>${p.name}</span><span class="sig">${bars}</span><b>${hm(S.t)}</b><span class="bat ${p.bat < 20 ? 'low' : ''}">${Math.round(p.bat)}%</span>` : '',
      body: `<div class="ptabs five">${tabs}</div>${alive ? `<div class="bubs">${feed}</div>` : '<div class="dead">전원 꺼짐<small>이 사람은 아무에게도 닿지 못한다</small></div>'}` };
  },

  resolve() {
    const x = S.x;
    return [{ id: 'end', label: { exposed: '2단계는 공개로 무산됐다', stopped: '2단계는 중단됐다', evacuated: '2단계는 일어났다 — 역은 비워지는 중이었다', happened: '2단계는 일어났다' }[x.outcome] }];
  },
  onEnd() {
    const x = S.x;
    setFact('T13', x.outcome, `${hm(x.t2)} — ${this.resolve()[0].label}`);
    setFact('DAEUN', x.daeunFate, { shelter: '다은은 대피소에 있었다', spared: '다은은 중앙역에 있었고, 2단계는 일어나지 않았다', out: '다은은 폭발 전에 역 밖으로 나와 있었다', inside: '다은은 그 시각 중앙역 지하에 있었다' }[x.daeunFate]);
    setFact('ARTICLE', x.article ? x.article.level : 'none', x.article ? `${hm(x.article.t)} 송고: "${x.article.title}"` : '13:10까지 기사를 보내지 않았다');
    L.tracks.part2 = { t2: x.t2, acts: x.acts, withdrawAt: x.withdrawAt, exposedAt: x.exposedAt, alarmAt: x.alarmAt, daeunSafeAt: x.daeunSafeAt, yunaKnows: x.p.yuna.knows || null,
      alibi: Math.round(x.p.jungwoo.alibi ?? 0), people: Object.fromEntries(P2_ORDER.map((id) => [id, { place: p2Place(x.p[id]), battery: Math.round(x.p[id].bat), resolve: x.p[id].resolve }])) };
  },

  // 봇: 기본은 아무것도 쥐지 않는다(모두 결심대로). p2=<사람>.<행동>@<시각>,… 으로 직접 시킨다. 예: p2=misuk.daeun@12:33
  bot() {
    for (const cmd of (params.get('p2') || '').split(',').filter(Boolean)) {
      const [, who, what, at] = cmd.match(/^(\w+)\.(\w+)@(\d\d:\d\d)$/);
      if (S.t === toMin(at) && !S.x.p[who].done[`bot_${what}`]) { S.x.p[who].done[`bot_${what}`] = true; act(`who:${who}`); act(`do:${what}`); }
    }
  },
};
