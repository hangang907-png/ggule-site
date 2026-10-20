'use strict';
// 3부 — 정상 보고 (11월 14일, 첫눈). 조사관 문태오가 같은 길을 오르며 남은 기록으로 보고서 다섯 문항을 쓴다.
// 볼 수 있는 것은 장부 가운데 증거를 남긴 것뿐이다(R8). 증거 카드는 장부에서 뽑아낸다(p3Cards): 없는 기록은 빈칸으로 보인다.
// 문항마다 카드를 석 장까지 붙이고, 붙인 카드로 문장과 판정(인정 · 부분 인정 · 확인 불가)이 정해진다(p3Judge).
// 시계는 흐르지 않는다. 걷거나 묻는 만큼만 간다. 갈림길에서는 한쪽만 갈 수 있다.
// 쓰는 사실: REPORT(다섯 문항의 판정), ENDING(13시의 결과 × 보고서)

const P3_Q = [
  { id: 'q1', title: '07:40 폭발은 사고였는가?' },
  { id: 'q2', title: '본부장은 언제 알았는가?' },
  { id: 'q3', title: '2단계 결정은 누가 했는가?' },
  { id: 'q4', title: '13:00에 무슨 일이 왜 일어났는가?' },
  { id: 'q5', title: '그날 본부장은 어디에 있었는가?' },
];
const P3_SLOTS = 3;
const P3_LEVEL = ['확인 불가', '부분 인정', '인정'];
const P3_HOLDER = { misuk: '오미숙의 휴대폰', hanul: '서하늘의 휴대폰 · 방송 원본', yuna: '정윤아의 취재폰', jungwoo: '한정우의 업무폰', doyun: '김도윤의 업무폰 · 시 서버', site: '산에서 얻은 것' };
// 지점마다: 눈 온 날의 풍경, 거기서 물을 수 있는 것(ask), 드는 시간
const P3_PLACE = {
  gate: { text: '11월 14일, 해령산 매표소. 밤새 첫눈이 왔다. 주차장은 절반이 비었다. 단풍은 다 졌다.', ask: '주차 관제실에서 그날의 출입 기록을 뗀다', min: 15 },
  rest1: { text: '처마에 고드름이 달렸다. 충전기는 계산대 옆 그 자리에 하나 있다.', ask: '쉼터 사장에게 그날 일을 묻는다', min: 25 },
  fork: { text: '이정표에 눈이 얹혀 있다. 능선길 끝 전망대에서는 서하늘이 기다리기로 했다. 계곡길 약수터에는 민준과 엄마가 나와 있기로 했다. 해가 짧아 한쪽만 갈 수 있다.' },
  view: { text: '난간 너머로 해령시가 내려다보인다. 항만의 크레인 하나가 아직 검다.', ask: '서하늘에게 그날 본 것을 묻는다', min: 20 },
  spring: { text: '물소리는 그날과 같다. 태블릿 구석에 "서비스 없음".', ask: '민준과 엄마에게 그날 일을 묻는다', min: 20 },
  summit: { text: '정상석에 눈이 쌓였다. 인증샷 줄은 없다. 남쪽으로 도시가 한눈에 들어온다. 보고서는 여기서 보낸다.' },
};
const P3_WALK = { forest: '참나무 숲길. 눈 위에 먼저 간 발자국이 한 줄 있다.', stairs: '돌계단. 계단마다 얼음이 얇게 앉았다.', ridge: '능선길. 바람이 눈을 쓸어 간다. 그날은 여기가 사람으로 가득했다.',
  ridge2: '정상 능선. 구름이 낮다.', valley: '계곡길. 물은 얼지 않았다. 신호가 끊긴다.', valley2: '계곡길 위쪽. 발밑이 미끄럽다.' };
const P3_END = {
  happened: { truth: ['늦은 정의', '역은 터졌다. 한 달 뒤 보고서는 누가 왜 그랬는지를 적었다. 적는다고 돌아오지 않는 것들이 있다.'],
    partial: ['꼬리 자르기', '역은 터졌다. 보고서는 몇 사람의 이름에서 멈췄다. 그 위는 "확인되지 않았다".'],
    cover: ['모든 게 정상입니다', '역은 터졌다. 보고서는 까닭도 사람도 적지 못했다. 적히지 않은 것은 없던 일이 된다.'] },
  stopped: { truth: ['정상에서 내린 결정', '13시는 오지 않았다. 보고서는 그것을 멈춘 손과, 그 전에 승인한 손을 함께 적었다.'],
    partial: ['막았지만 묻혔다', '13시는 오지 않았다. 멈춘 사람이 있었다는 것은 보고서 어디에도 온전히 남지 않았다.'],
    cover: ['아무 일도 없었던 날', '13시는 오지 않았다. 보고서에 따르면 애초에 아무것도 예정돼 있지 않았다.'] },
  exposed: { truth: ['정상 보고', '본부장은 정상에서 제 손으로 보고했다. 한 달 뒤의 보고서는 그것을 받아 적었다.'],
    partial: ['영상만 남았다', '모두가 그 화면을 봤다. 보고서는 그 가운데 일부만 인정했다.'],
    cover: ['보고서만 몰랐다', '모두가 그 화면을 봤다. 보고서만 "확인 불가"라고 적었다.'] },
  evacuated: { truth: ['경보는 울렸다', '역은 터졌지만 비어 가는 중이었다. 보고서는 누가 터뜨렸고 누가 알렸는지를 적었다.'],
    partial: ['누가 신고했나', '역은 터졌지만 비어 가는 중이었다. 알린 사람의 이름은 남았고, 터뜨린 쪽의 이름은 절반만 남았다.'],
    cover: ['운이 좋았다', '역은 터졌지만 비어 가는 중이었다. 보고서는 그것을 "다행"이라고 적었다.'] },
};

const p3v = (id) => (getFact(id) ? getFact(id).value : null);
const p3Acts = () => (L.tracks.part2 ? L.tracks.part2.acts : []);
const p3Did = (who, re) => p3Acts().find((a) => a.who === who && re.test(a.act));
const p3Outcome = () => p3v('T13') || 'happened';
const p3T2 = () => (L.tracks.part2 ? L.tracks.part2.t2 : toMin('13:00'));

// "단풍" 대화방이 밖으로 나온 길. 없으면 null — 서버는 내용을 보관하지 않고, 두 사람은 지웠다.
function p3ChatSource() {
  const p2 = L.tracks.part2;
  if (!p2) return null;
  const ask = p3Did('yuna', /본부장에게 물음/);
  if (p3Did('jungwoo', /방송에 대화방/)) return ['R4', '서하늘의 방송 원본에 잡힌 화면'];
  if (p3Did('jungwoo', /SNS에 캡처/)) return ['R4', '한정우가 직접 올린 캡처'];
  if (ask && /알게/.test(ask.eff || '') && p2.people.jungwoo.resolve === 'expose') return ['R4', '한정우가 정상에서 내민 화면을 정윤아가 찍은 사진'];
  if (p3Did('doyun', /기자에게 증거/) && p2.yunaKnows != null) return ['R5', '김도윤이 정윤아에게 보낸 캡처'];
  return null;
}
// 2단계를 누가 정했는가 — 장부가 아는 대로
function p3TruthQ3() {
  const j11 = p3v('J11') || { opt: 'none' }, s = [];   // [시각, 문장] — 일어난 순서대로 읽히게 한다
  if (j11.opt === 'approve') s.push([j11.sentAt, `한정우가 ${hm(j11.sentAt)} ${j11.via === 'call' ? '통화로' : '메시지로'} 2단계를 승인했다.`]);
  else if (j11.opt === 'stop') s.push([j11.sentAt, `한정우는 ${hm(j11.sentAt)} ${j11.via === 'call' ? '통화로' : '메시지로'} 중단을 지시했다${j11.arriveAt == null ? '. 신호가 없어 그 답은 12:30까지 닿지 않았다' : ''}.`]);
  else s.push([toMin('12:30'), '한정우는 12:30까지 답하지 않았고, 김도윤은 그것을 승인으로 간주했다.']);
  if (p3v('J15') === 'advance') s.push([toMin('12:10'), '12시 넘어 김도윤은 본부장에게 알리지 않고 2단계를 12:45로 당겼다.']);
  const again = p3Did('jungwoo', /중단 지시/), w = p3Did('doyun', /철수 지시/);
  if (again) s.push([again.t, `${hm(again.t)} 한정우가 ${j11.opt === 'stop' ? '다시 ' : ''}중단을 지시했다.`]);
  if (w) s.push([w.t, `김도윤은 ${hm(w.t)} 작전팀에 철수를 지시했다.`]);
  else if (p3v('R5') === 'finish') s.push([toMin('12:31'), '김도윤은 무슨 지시가 와도 끝까지 가기로 했다.']);
  else if (p3v('R5') === 'bail') s.push([toMin('12:31'), '김도윤은 손을 떼고 혼자 빠졌다. 작전팀은 받은 대로 움직였다.']);
  return s.sort((p, q) => p[0] - q[0]).map((p) => p[1]).join(' ');
}

// 장부에서 증거 카드를 뽑는다. has 가 거짓이면 빈칸이다: text 에는 왜 없는지가 적힌다. hint: 어느 선택이 그 기록을 남겼을지(마지막 장의 빈칸 목록).
function p3Cards() {
  const T = L.tracks, m = T.misuk, h = T.hanul, y = T.yuna, jw = T.jungwoo, p2 = T.part2, c = [];
  const add = (id, holder, where, kind, title, has, text, blank, more) => c.push({ id, holder, where, kind, title, has: !!has, text: has ? text : blank, ...more });
  const note = (k) => !!y && y.notes.some((n) => n.k === k);

  add('m_text', 'misuk', 'locker', '문자', '다은의 문자 06:40', m,
    '오다은 → 오미숙, 그날 06:40. "근데 이상해. 3부두 경비 아저씨들 새벽에 싹 철수했어. 차도 다 빠지고. 정비한다더니" 폭발 한 시간 전에 보낸 글이다. 누가 철수시켰는지는 적혀 있지 않다.',
    '오미숙의 휴대폰 백업이 없다.', { hearsay: true });

  const j6 = p3v('J6');
  add('h_blast', 'hanul', 'locker', '영상', '07:40 라이브 원본', j6 === 'rec',
    '07:40 해령산 들머리. 남쪽에서 폭음이 두 번 들어온다. 간격은 삼 초. 아래 주차장에서 차량 경보가 줄줄이 울린다. 감정 소견: 연쇄 기폭의 간격.',
    j6 === 'half' ? '07:40 라이브 원본에는 두 번째 폭음만 있다. 방송을 그 사이에 켰다. 간격은 알 수 없다.' : '07:40에는 방송이 꺼져 있었다. 그 시각의 영상은 없다.',
    { fact: 'J6', hint: '2장: 07:40 첫 폭음 때 서하늘의 방송이 켜져 있었다면' });
  const j4 = p3v('J4'), filmed = !!h && (j4 === 'sneak' || j4 === 'selfie') && h.j4At;
  // 같이 찍은 사진에는 얼굴이 정면으로 남는다. 그 얼굴이 한정우인지는 그 시각 그가 능선에 있었는지로 정해진다.
  const face = filmed && j4 === 'selfie' && !!jw, faceHan = face && wasAt(jw, h.j4At, 'ridge');
  add('h_ridge', 'hanul', 'locker', '영상', filmed ? `${hm(h.j4At)} 능선길의 붉은 등산복` : '능선길의 붉은 등산복', filmed,
    filmed ? `${hm(h.j4At)} 능선길. 붉은 등산복에 모자를 쓴 남자. ${j4 === 'sneak' ? '뒤에서 찍혔다. 모자를 눌러쓰고 걸음을 빨리한다. 얼굴은 모자챙에 가렸다.' : `나란히 서서 고개만 끄덕인다. 말소리는 없다. 얼굴이 정면으로 남았다.${face ? ` 대조 결과: ${faceHan ? '한정우 본인이다.' : '한정우가 아니다.'}` : ''}`}` : '',
    '능선에서 찍힌 것은 단풍뿐이다. 붉은 등산복은 화면에 없다.',
    { fact: 'J4', hint: '2장: 능선에서 붉은 등산복을 찍었다면', meet: faceHan, other: face && !faceHan, sights: filmed ? [{ t: h.j4At, place: 'ridge' }] : [] });

  add('y_tip', 'yuna', 'locker', '문자', '09:00 익명 제보', note('tip'),
    '발신번호 없는 메시지. "오늘 항만 폭발은 사고가 아닙니다." "안전본부장 한정우가 지금 해령산에 있습니다." 보낸 사람은 추적되지 않았다.',
    '09:00에 온 발신번호 없는 메시지는 열어 보지 않은 채로 남아 있다.', { hearsay: true });
  const shot = p3v('J8') === 'shoot';
  add('y_car', 'yuna', 'locker', '사진', '주차장의 관용차 사진', shot,
    shot ? `${hm(y.j8At)} 매표소 주차장. 검은 세단, 시청 관용차 번호인 해령 02가. 뒷좌석 창이 올라가는 중이고, 안에 사람이 있다.` : '', '주차장에서 찍은 사진은 없다.',
    { fact: 'J8', hint: '3장: 주차장의 관용차를 찍었다면' });
  add('y_seen', 'yuna', 'locker', '목격', '12:10 정상의 붉은 등산복', y && y.sawAt,
    '취재 수첩: "12:10 정상. 인증샷 줄에서 떨어진 바위 끝에 붉은 등산복. 얼굴 미확인."', '12:10에 정윤아는 정상에 없었다. 수첩에 그 줄이 없다.',
    { hint: '3장: 12:10에 정상에 닿아 있었다면', sights: y && y.sawAt ? [{ t: y.sawAt, place: 'summit' }] : [] });
  add('y_voice', 'yuna', 'locker', '녹음', '음성사서함의 목소리', p3v('J10b') === 'callback',
    '정윤아의 음성사서함. "비서실장 김도윤입니다. 본부장님은 오늘 개인 일정으로 산행 중이십니다." 그날 오전, 시청 번호가 아닌 업무용 휴대폰에서 걸려 왔다.',
    p3v('J10') === 'called' ? '정윤아가 남긴 음성에 김도윤은 다시 걸지 않았다. 남은 목소리가 없다.' : '정윤아는 그날 비서실장에게 전화하지 않았다.',
    { fact: getFact('J10b') ? 'J10b' : 'J10', hint: '3장: 기자가 비서실장에게 전화했고, 5장: 그가 다시 걸었다면' });
  const ask = p3Did('yuna', /본부장에게 물음/), told = !!ask && /알게/.test(ask.eff || '') && p2.people.jungwoo.resolve === 'stop';
  add('y_rec', 'yuna', 'locker', '녹음', '정상에서 한 녹음', ask,
    ask ? `${hm(ask.t)} 녹음. 정윤아: "한정우 본부장님. 오늘 왜 산에 계십니까." 한정우: ${told ? '"…13시, 중앙역 지하입니다. 신고하세요. 지금."' : p2.people.jungwoo.resolve === 'expose' ? '(대답이 없다. 무언가를 내미는 소리.)' : '"산행 중입니다."'}` : '',
    '정윤아와 한정우가 그날 마주 서서 말한 기록은 없다.',
    { fact: 'R3', told, meet: !!ask, hint: '3장 결심: 본부장에게 직접 묻는다 · 4장 결심: 어떻게든 멈춘다 · 그리고 12:30에 둘이 같은 자리에' });
  add('y_112', 'yuna', 'locker', '녹취', '112 신고 녹취', p2 && p2.alarmAt != null,
    p2 && p2.alarmAt != null ? `${hm(p2.alarmAt - 2)} 112. "해령일보 정윤아 기자입니다. 13시 중앙역 지하입니다. 시 안전본부 내부 대화에서 확인했습니다. 지금 역을 비워야 합니다."` : '',
    '그날 13시 전에 중앙역을 말한 112 신고는 없었다.', { fact: 'R3', hint: '2부: 13시를 알게 된 기자가 신고했다면' });

  add('j_gps', 'jungwoo', 'locker', '기록', '등산 앱 GPS 기록', jw,
    jw ? `${jw.visited.filter((v) => v.node).map((v) => `${hm(v.t)} ${NODES[v.node].name}`).join(' → ')}. 끊긴 시간 ${jw.gpsGap}분. 휴대폰이 그 길을 갔다는 기록이다.` : '', '한정우의 등산 기록이 없다.');
  const j12 = p3v('J12') || {};
  add('j_read', 'jungwoo', 'locker', '기록', '메신저 읽음 표시', j12.opened,
    `메신저 서버 기록. 네 명이 든 비공개 대화방에 한정우 계정의 읽음 표시가 ${hm(j12.openedAt || toMin('11:30'))}부터 찍혀 있다. 대화 내용은 서버에 남지 않는다.`,
    '비공개 대화방의 알림은 잠금화면 미리보기로만 지나갔다. 읽음 표시가 없다.', { fact: 'J12', t: j12.openedAt || toMin('11:30'), hint: '4장: "단풍" 대화방을 열어서 읽었다면 (미리보기는 기록을 남기지 않는다)' });
  add('j_call', 'jungwoo', 'locker', '기록', '11:30 통화 기록', jw && jw.twistAnswered,
    '통신사 기록. 11:30 선불 번호 → 한정우, 통화 연결. 가입자는 확인되지 않는다. 통화 내용은 남지 않았다.',
    '11:30 선불 번호에서 걸려 온 전화. 연결되지 않았다.', { fact: 'J11', hint: '4장: 11:30의 전화를 받았다면' });
  const asked = p3v('J2b') === 'msg';
  add('j_ask', 'jungwoo', 'locker', '문자', asked ? `${hm(jw.j2bAt)} 본부장이 비서실장에게 물은 것` : '본부장이 비서실장에게 물은 것', asked,
    asked ? `${hm(jw.j2bAt)} 한정우 → 김도윤. "3부두 경비가 새벽에 철수했다는 얘기가 있다. 맞나?" ${hm(jw.j2bAt + 6)} 김도윤: "정비 작업 때문에 잠시 뺐습니다. 걱정하실 일 아닙니다. 산행 계속하십시오."` : '',
    '그날 아침 두 사람의 업무폰 사이에는 06:00의 인사 한 줄뿐이다.', { fact: 'J2b', t: asked ? jw.j2bAt : null, hint: '1장: 손님에게 귀띔했고, 4장: 쉼터에서 비서실장에게 물었다면' });
  const src = p3ChatSource(), j11 = p3v('J11') || { opt: 'none' }, d = T.doyun;
  // 대화방에 실제로 올라온 글만 싣는다. 11:30의 전화가 연결됐다면 그때 한 말은 대화방에 없다.
  const room = ['10/01 21:14 한정우: "단풍 최종 승인. 당일엔 산에 있겠다."', '05:10 안 실장: "3부두 경비 철수 완료."'];
  if (jw && !jw.twistAnswered) room.push('11:30 김도윤: "2단계는 예정대로 13시 중앙역 지하입니다. 12시 반까지 답이 없으시면 승인으로 알겠습니다."');
  const landed = j11.opt !== 'none' && j11.arriveAt != null;
  if (landed && j11.via === 'msg') room.push(`${hm(j11.arriveAt)} 한정우: "${j11.opt === 'approve' ? '2단계 승인' : '작전 중단'}"`);
  if (landed) room.push(`${hm(Math.max(j11.arriveAt, toMin('11:30')))} 김도윤: "${j11.opt === 'approve' ? '알겠습니다. 13시 예정대로.' : '…알겠습니다. 철수시키겠습니다. 후회하실 겁니다.'}"`);
  else room.push('12:30 김도윤: "12시 반입니다. 답이 없으시니 승인으로 알겠습니다."');
  if (p2 && jw && jw.op !== 'hidden' && !(p3v('R5') === 'obey' && d && d.boss === 'stop')) room.push('12:30 김도윤: "13시 중앙역 지하. 예정대로입니다."');
  add('chat', 'jungwoo', 'locker', '대화방', src ? '비공개 대화방 "단풍"' : '비공개 대화방', src,
    src ? `${src[1]}. ${room.join(' ')}` : '',
    `네 명이 든 비공개 대화방의 내용은 어디에도 없다. 서버는 내용을 보관하지 않는다.${j12.opened ? ' 한정우의 휴대폰에는 그날 오후에 지운 흔적만 있다.' : ''}`,
    { fact: src ? src[0] : 'R4', j11: landed ? j11.opt : 'none', hint: '4장 결심: 대화방을 세상에 보인다(2부에서 공개) · 또는 5장 결심: 혼자 빠진다 + 3장: 기자의 전화' });

  const j14 = p3v('J14'), bail = p3v('R5') === 'bail', leaked = !!p3Did('doyun', /기자에게 증거/) && p2.yunaKnows != null;
  const doc = j14 === 'untouched' || (j14 === 'copy' && (bail || leaked));
  add('d_doc', 'doyun', 'locker', '문서', '3부두 경비 철수 공문', doc,
    `"3부두 경비 인력 일시 철수" 시행 05:10. 기안 법무 권 과장, 전결 비서실장. ${j14 === 'untouched' ? '시 문서 서버에 그대로 남아 있었다.' : '서버의 원본은 그날 아침 지워졌다. 이것은 김도윤이 챙겨 둔 사본이다.'}`,
    '시 문서 서버: 그날 아침 문서 한 건이 삭제됐다. 제목도 내용도 복구되지 않았다.', { fact: 'J14', hint: '5장: 공문을 지우지 않았다면 (또는 사본을 챙겨 혼자 빠졌다면)' });
  add('d_state', 'doyun', 'locker', '진술', '김도윤의 진술', bail,
    `감경을 조건으로 한 진술. "10월 1일에 본부장이 최종 승인했습니다. ${j11.opt === 'approve' ? '그날 11시 반에도 다시 승인했고요.' : j11.opt === 'stop' ? '그날 11시 반 넘어 중단하라는 말을 들었습니다. 저는 그때 손을 뗐습니다.' : '그날은 답이 없었습니다. 답이 없으면 승인으로 보기로 돼 있었습니다.'}${p3v('J15') === 'advance' ? ' 시각을 당기자고 한 건 안 실장입니다.' : ''}" 뒷받침하는 기록 없이는 한 사람의 말이다.`,
    '김도윤은 진술을 거부했다.', { fact: 'R5', j11: j11.opt, hint: '5장 결심: 증거를 챙겨 혼자 빠진다' });
  add('d_op', 'doyun', 'locker', '빈칸', '두 번째 휴대폰', false, '', '작전에 쓴 선불 휴대폰이 따로 있었다는 말이 있다. 제출되지 않았다.', { never: true });

  add('p_park', 'site', 'gate', '기록', '주차 관제 기록', true,
    `시청 관용차 해령 02가. 그날 06:52 입차, ${bail ? '12:31' : '13:24'} 출차. 그 사이 한 번도 움직이지 않았다. 누가 타고 있었는지는 기록되지 않는다.`, '');
  const inside = p3v('DAEUN') === 'inside', told1 = m && m.testimony.find((s) => s.includes('경비')), tell = !!told1;
  // 4장에서 한정우가 늦게 닿았다면 사장은 같은 옷을 두 번 본 것이다
  const again = !!m && !!jw && !jw.guest && jw.restAt && !(m.resolve === 'pickup' && jw.restAt >= m.endT);
  add('p_owner', 'site', 'rest1', '진술', '쉼터 사장의 진술', m && !inside,
    m ? `오미숙의 진술. ${m.testimony.map((s) => `"${s}"`).join(' ')}${again ? ` "${hm(jw.restAt)} 같은 붉은 등산복이 또 들어왔다. 아까 그 손님이 다시 온 줄 알았다"` : ''} 손님의 얼굴은 모자에 가려 제대로 보지 못했다고 한다.` : '',
    inside ? '참나무 쉼터는 닫혀 있다. 셔터에 "당분간 쉽니다"라고 적힌 종이가 눈에 젖어 있다.' : '쉼터 사장은 그날 아침 손님을 기억하지 못한다.',
    { fact: tell ? 'J2' : 'J1', tell, t: tell ? toMin(told1.slice(0, 5)) : null, hint: inside ? '2부: 다은이 13시 전에 역에서 나왔다면' : null, sights: m ? [{ t: m.guest[0], place: 'rest1', isHan: !!(jw && jw.guest) }] : [] });
  const gave = p3v('J7') === 'give', sawView = !!h && h.j7At;
  add('p_hanul', 'site', 'view', '진술', sawView ? `${hm(h.j7At)} 전망대의 붉은 등산복` : '전망대의 붉은 등산복', sawView,
    sawView ? `서하늘의 진술. "${hm(h.j7At)}쯤 여기 난간에 붉은 등산복 아저씨가 서 있었어요. 꺼진 휴대폰을 보시다가 남는 보조배터리가 있냐고 물으셨어요. ${gave ? '하나 드렸어요.' : '저도 방송해야 해서 못 드렸어요.'} 모자 때문에 얼굴은 잘 못 봤어요."` : '',
    '서하늘은 그날 10:35에 전망대에 없었다. 여기서 본 것이 없다.', { fact: 'J7', hint: '2장: 10:35에 전망대에 있었다면', sights: sawView ? [{ t: h.j7At, place: 'view' }] : [] });
  const met = !!jw && ['guide', 'leave', 'pass'].includes(jw.child), sp = met && jw.visited.find((v) => v.node === 'spring'), known = met || !!(y && y.childAt);
  add('p_child', 'site', 'spring', '진술', known ? '민준과 엄마의 진술' : '약수터의 증인', met && sp,
    met && sp ? `민준(9)의 말. "${hm(sp.t)}쯤 붉은 등산복 아저씨가 ${{ guide: '저를 데리고 계곡길을 내려갔어요', leave: '내려가는 아줌마 아저씨한테 저를 부탁했어요', pass: '저를 보고도 그냥 갔어요' }[jw.child]}." 사진 여섯 장 가운데 한정우를 짚었다. 얼굴을 가까이서 본 사람이다.` : '',
    known ? `민준은 그날 약수터에서 붉은 등산복을 보지 못했다고 한다.${p3v('J9') === 'help' ? ' 데려다준 사람은 기자였다.' : ''}` : '약수터에는 아무도 나와 있지 않다. 그날 여기서 누가 누구를 봤다는 기록이 없다.',
    { fact: 'J9', known, meet: true, hint: '4장: 본부장이 계곡길로 가서 약수터의 아이와 마주쳤다면', sights: met && sp ? [{ t: sp.t, place: 'spring' }] : [] });
  return c;
}

// 문항 하나의 판정. ids: 붙인 카드. 돌려주는 것: level(0~2), text(보고서 문장), used(판정에 쓰인 카드), gap(더 올리려면 어떤 기록이 있어야 하는가)
function p3Judge(qid, ids, cards) {
  const K = Object.fromEntries(cards.map((c) => [c.id, c])), on = (id) => ids.includes(id) && K[id] && K[id].has;
  const jw = L.tracks.jungwoo, out = p3Outcome(), t2 = p3T2(), p2 = L.tracks.part2;
  const r = (level, text, used, gap) => ({ level, text, used: used.filter(on), gap: level < 2 ? gap : null });
  const hearsay = ids.filter((id) => on(id) && (K[id].hearsay || (id === 'p_owner' && K[id].tell)));
  if (qid === 'q1') {
    const gap = '철수를 지시한 문서, 폭음의 간격, 또는 계획 그 자체';
    if (on('chat')) return r(2, '07:40 항만 폭발은 사고가 아니다. "단풍"이라는 이름으로 계획된 폭파였고, 3부두 경비는 05:10에 미리 철수됐다.', ['chat']);
    if (on('d_doc') && on('h_blast')) return r(2, '07:40 항만 폭발은 사고가 아니다. 폭발 두 시간 반 전에 경비를 철수시킨 공문이 있고, 삼 초 간격의 두 차례 폭음은 연쇄 기폭의 것이다.', ['d_doc', 'h_blast']);
    if (on('d_doc')) return r(1, '폭발 전 새벽에 3부두 경비가 공문으로 철수된 사실은 인정된다. 폭발 자체가 계획된 것인지는 확인할 수 없다.', ['d_doc'], '폭발이 터뜨린 것임을 보여 주는 기록');
    if (on('h_blast')) return r(1, '폭음은 삼 초 간격으로 두 번이었다. 정비 중의 단순 사고로 보기 어렵다. 누가 준비했는지는 확인할 수 없다.', ['h_blast'], '누가 준비했는지 보여 주는 문서');
    return r(0, `07:40 항만 폭발은 정비 작업 중의 사고로 본다.${hearsay.length ? ' 경비가 미리 철수했다는 전언은 있으나 문서로 확인되지 않았다.' : ' 달리 볼 기록이 없다.'}`, hearsay, gap);
  }
  if (qid === 'q2') {
    const gap = '10월 1일의 승인이 적힌 기록, 또는 그것을 말하는 사람과 뒷받침하는 기록';
    if (on('chat')) return r(2, '한정우 본부장은 처음부터 알았다. 10월 1일 21:14, 그는 "단풍 최종 승인. 당일엔 산에 있겠다."라고 썼다.', ['chat']);
    const back = ['j_read', 'j_ask', 'j_call'].find(on);
    if (on('d_state') && back) return r(2, `한정우 본부장은 처음부터 알았다. 10월 1일에 그가 최종 승인했다는 김도윤의 진술이 있고, 남은 기록(${K[back].title})이 그 진술과 맞는다.`, ['d_state', back]);
    const cand = [];
    if (on('j_ask')) cand.push([K.j_ask.t, '3부두 경비 철수를 알고 비서실장에게 묻고 있었다', 'j_ask']);
    if (on('p_owner') && K.p_owner.tell && on('j_gps') && jw && jw.guest) cand.push([K.p_owner.t, '참나무 쉼터에서 경비 철수 이야기를 들었다(사장의 진술, GPS와 일치)', 'p_owner', 'j_gps']);
    if (on('j_read')) cand.push([K.j_read.t, '네 명뿐인 비공개 대화방을 읽고 있었다(무엇을 읽었는지는 남지 않았다)', 'j_read']);
    if (on('y_rec') && K.y_rec.told) cand.push([p3Did('yuna', /본부장에게 물음/).t, '"13시, 중앙역 지하"를 제 입으로 말했다', 'y_rec']);
    cand.sort((a, b) => a[0] - b[0]);
    if (cand.length) return r(1, `한정우 본부장은 늦어도 그날 ${hm(cand[0][0])}에는 ${cand[0][1]}. 그 전부터 알았는지는 확인할 수 없다.`, cand[0].slice(2), gap);
    const why = on('p_owner') && K.p_owner.tell ? ' 쉼터 사장이 경비 철수를 말해 준 손님이 본부장이었는지는 확인되지 않는다.' : on('d_state') ? ' 김도윤의 진술은 뒷받침하는 기록이 없어 채택하지 않았다.' : on('j_call') ? ' 11:30의 통화는 내용이 남지 않았다.' : '';
    return r(0, `한정우 본부장이 미리 알았다고 볼 기록이 없다.${why}`, [], gap);
  }
  if (qid === 'q3') {
    const gap = '둘 사이에 오간 말이 적힌 기록, 또는 김도윤의 진술과 그것을 뒷받침하는 기록';
    // 문장은 붙인 카드가 말하는 데까지만 간다: 대화방에 올라온 글, 또는 김도윤이 한 말
    const said = (o, who) => ({ approve: `한정우 본부장이 10월 1일에 작전을 승인했고, 그날 2단계도 그의 승인으로 갔다${who}.`,
      stop: `한정우 본부장은 10월 1일에 작전을 승인했으나 그날 중단을 말했고, 김도윤은 그 말을 받았다${who}. 그 뒤 누가 무엇을 했는지는 여기 없다.`,
      none: `한정우 본부장은 10월 1일에 작전을 승인했고 그날은 답하지 않았다. 김도윤이 12:30에 그것을 승인으로 간주했다${who}.` }[o]);
    if (on('chat')) return r(2, said(K.chat.j11, ''), ['chat']);
    const back = ['j_call', 'p_park', 'y_car', 'j_ask'].find(on);
    if (on('d_state') && back) return r(2, said(K.d_state.j11, ` (김도윤의 진술. ${K[back].title}이 그와 맞는다)`), ['d_state', back]);
    const car = ['p_park', 'y_car'].find(on), talk = ['j_ask', 'y_voice'].find(on);
    if (car && talk) return r(1, `시청 관용차가 ${car === 'p_park' ? '그날 아침부터 낮까지' : '그날 아침'} 산 아래 주차장에 서 있었고, 비서실장 김도윤은 그날 ${talk === 'j_ask' ? '본부장과 경비 철수를 두고 메시지를 주고받았다' : '기자에게 본부장의 산행을 제 입으로 확인해 주었다'}. 두 사람이 무엇을 정했는지는 남지 않았다.`, [car, talk], gap);
    if (on('y_rec') && K.y_rec.told) return r(1, '한정우 본부장은 13시 전에 2단계를 알고 있었다. 누가 정했는지는 확인할 수 없다.', ['y_rec'], gap);
    const none = { happened: '중앙역 폭발을 결정한 사람은 확인할 수 없다.', evacuated: '중앙역 폭발을 결정한 사람은 확인할 수 없다.',
      stopped: '13시에 무엇이 예정돼 있었다는 기록이 없다. 결정한 사람을 물을 수 없다.', exposed: '인터넷에 돈 대화방 화면은 진위를 확인하지 않았다. 결정한 사람은 확인할 수 없다.' }[out];
    return r(0, `${none}${on('d_state') ? ' 김도윤의 진술은 뒷받침하는 기록이 없어 채택하지 않았다.' : ''}`, [], gap);
  }
  if (qid === 'q4') {
    const plan = ['chat', 'd_state'].find(on) || (on('y_rec') && K.y_rec.told ? 'y_rec' : null), call = on('y_112'), at = hm(t2);
    const rang = p2 && p2.alarmAt != null ? hm(p2.alarmAt - 2) : '직전';
    const gap = '13시가 예정된 일이었음을 보여 주는 기록';
    if (out === 'happened') {
      if (plan) return r(2, `${at} 중앙역 지하 환승통로의 폭발은 예정된 2단계였다. 그 시각을 미리 안 사람들이 있었고, 역은 비워지지 않았다.`, [plan]);
      if (call) return r(1, `${at} 중앙역 지하에서 폭발이 있었다. ${rang}에 그것을 말한 신고가 있었으나 역을 비우기엔 늦었다. 신고자가 어떻게 알았는지는 확인되지 않는다.`, ['y_112'], gap);
      return r(0, `${at} 중앙역 지하 환승통로에서 원인 미상의 폭발이 있었다. 항만 사고와의 관련은 확인되지 않는다.`, [], gap);
    }
    if (out === 'evacuated') {
      if (plan && call) return r(2, `${at} 중앙역 지하의 폭발은 예정된 2단계였다. ${rang} 정윤아 기자의 신고로 역이 비워지는 중이어서 피해가 줄었다.`, [plan, 'y_112']);
      if (plan) return r(1, `${at} 중앙역 지하의 폭발은 예정된 2단계였다. 직전의 대피 방송이 어떻게 나왔는지는 적지 못했다.`, [plan], '역을 비우게 한 신고의 기록');
      if (call) return r(1, `${at} 중앙역 지하에서 폭발이 있었다. ${rang}의 신고로 역은 비워지는 중이었다. 신고자가 어떻게 알았는지는 확인되지 않는다.`, ['y_112'], gap);
      return r(0, `${at} 중앙역 지하에서 원인 미상의 폭발이 있었다. 직전에 대피 방송이 나온 경위는 확인되지 않는다. 다행이었다.`, [], gap);
    }
    if (out === 'stopped') {
      const w = p3Did('doyun', /철수 지시/);
      if (plan) return r(2, `${at} 중앙역 지하에서 2단계가 예정돼 있었고, ${w ? `${hm(w.t)}의 철수 지시로` : '직전의 철수 지시로'} 일어나지 않았다.`, [plan]);
      if (call) return r(1, `${at} 중앙역에 폭발물이 있다는 신고가 있었으나 아무 일도 일어나지 않았다. 신고의 근거는 확인되지 않는다.`, ['y_112'], gap);
      return r(0, '13:00에는 아무 일도 일어나지 않았다.', [], gap);
    }
    if (on('chat')) return r(2, `${p2 && p2.exposedAt != null ? hm(p2.exposedAt) : '13시 전에'} "단풍" 대화방이 세상에 공개됐고, 작전팀이 물러나 ${at}의 2단계는 일어나지 않았다.`, ['chat']);
    return r(plan ? 1 : 0, plan ? `${at}에 2단계가 예정돼 있었으나 일어나지 않았다. 왜 멈췄는지는 적지 못했다.` : '13:00에는 아무 일도 일어나지 않았다. 그 무렵 인터넷에 돈 화면과의 관련은 확인하지 않았다.', plan ? [plan] : [], '공개된 대화방 그 자체');
  }
  // q5: GPS 는 휴대폰의 자리다. 목격이 그것과 맞으면 알리바이가 서고, 어긋나면 같은 옷이 둘이었다는 뜻이다.
  const gps = on('j_gps'), sights = [];
  for (const id of ids.filter(on)) for (const s of K[id].sights || []) sights.push({ ...s, id, han: s.isHan != null ? s.isHan : !!jw && wasAt(jw, s.t, s.place) });
  const off = sights.find((s) => !s.han), fit = sights.filter((s) => s.han), meet = ids.filter(on).find((id) => K[id].meet), other = ids.filter(on).find((id) => K[id].other);
  const name = (s) => placeName(NODES[s.place] ? { node: s.place } : { seg: s.place });
  if (gps && off) return r(2, `한정우 본부장의 휴대폰은 그날 06:00부터 해령산에 있었다. 그러나 ${hm(off.t)} ${name(off)}의 붉은 등산복은 그가 아니다. 그 시각 그의 GPS는 ${placeName(posAt(jw, off.t))}에 있다. 같은 옷을 입은 사람이 한 명 더 있었다. 그날 "산에 있던 본부장"을 봤다는 기록은 그대로 믿을 수 없다.`, ['j_gps', off.id]);
  if (other) return r(2, `${hm(K[other].sights[0].t)} 능선길에서 찍힌 붉은 등산복의 얼굴은 한정우 본부장이 아니다. 같은 옷을 입은 사람이 한 명 더 있었다. 그날 "산에 있던 본부장"을 봤다는 기록은 그대로 믿을 수 없다.`, [other]);
  if (gps && fit.length) return r(1, `한정우 본부장은 그날 해령산에 있었다. GPS 기록이 ${hm(fit[0].t)} ${name(fit[0])}의 목격과 일치한다.`, ['j_gps', fit[0].id], 'GPS와 어긋나는 목격');
  if (meet) return r(1, '한정우 본부장은 그날 해령산에 있었다. 얼굴을 마주한 사람이 있다.', [meet], 'GPS 기록과, 그것과 어긋나는 목격');
  if (gps) return r(0, '한정우 본부장의 휴대폰은 그날 해령산에 있었다. 본인이 그 휴대폰과 함께 있었는지는 확인할 수 없다.', ['j_gps'], '그를 본 사람의 기록');
  return r(0, `그날 한정우 본부장이 어디에 있었는지 확인할 수 없다.${sights.length ? ' 붉은 등산복을 본 사람은 있으나 얼굴을 본 사람은 없다.' : ''}`, [], '그의 위치 기록과 그를 본 사람의 기록');
}

// 실제로 일어난 일 — 장부 전체가 아는 대로(마지막 장에서 보고서 옆에 펼친다)
function p3Truth() {
  const jw = L.tracks.jungwoo, d = L.tracks.doyun, out = p3Outcome(), at = hm(p3T2());
  const acts = p3Acts().map((a) => `${hm(a.t)} ${PEOPLE[a.who]}: ${a.act}`).join(' · ');
  const m = L.tracks.misuk;
  const who = { jungwoo: '한정우였다', double: '대역이었다', both: '둘이 함께 있었다', nobody: '한정우도 대역도 아니었다(단풍철의 산에 붉은 등산복은 흔했다)' };
  const seen = d && d.verdicts.length ? ` ${d.verdicts.map((v) => `${hm(v.t)} ${v.who}의 눈에 띈 붉은 등산복은 ${who[v.verdict]}.`).join(' ')}` : '';
  return {
    q1: '사고가 아니다. 작전 "단풍"의 1단계였다. 05:10에 경비를 빼고 3부두 빈 창고를 터뜨렸다. 일정 착오로 정비 작업자 여섯이 안에 있었고, 불은 4부두까지 번졌다.',
    q2: `처음부터. 10월 1일 21:14 "단풍 최종 승인. 당일엔 산에 있겠다."${jw ? ` 13시 중앙역이라는 것은 그날 11:30 ${jw.twistAnswered ? '통화로' : '이후 대화방에서'} 다시 들었다.` : ''}`,
    q3: p3TruthQ3(),
    q4: `${{ happened: `${at} 중앙역 지하에서 2단계가 실행됐다.`, evacuated: `${at} 중앙역 지하에서 2단계가 실행됐다. 역은 신고로 비워지는 중이었다.`, stopped: `2단계는 ${at}에 예정돼 있었고, 철수 지시로 멈췄다.`, exposed: `2단계는 ${at}에 예정돼 있었고, 대화방이 공개되자 작전팀이 물러났다.` }[out]}${acts ? ` 그 40분: ${acts}.` : ' 그 40분 동안 아무도 아무것도 하지 않았다.'}`,
    q5: `한정우는 06:00부터 산에 있었다. 그것이 계획이었다. 김도윤은 그 몰래 같은 붉은 등산복의 대역 최를 05:50에 먼저 올려 보냈다.${m && jw ? ` ${hm(m.guest[0])} 쉼터에 앉은 손님은 ${jw.guest ? '한정우였다' : '대역이었다'}.` : ''}${seen}`,
    more: '09:00의 익명 제보는 같은 대화방의 권 과장이 보냈다. 혼자 빠져나가려는 것이었다.',
  };
}

CHAPTERS.part3 = {
  num: 7, who: '문태오', title: '정상 보고', start: '09:00', end: '23:59', node: 'gate',
  mobile: false, still: true, drain: () => 0, endWord: '보고', placeLabel: '11월 14일 · 첫눈 온 해령산',
  intro: '진상조사단 조사관, 마흔하나. 한 달 전 그날 다섯 사람이 지나간 길을 오른다. 태블릿에는 다섯 대의 휴대폰 백업이 들어 있다. 보고서는 한 장이고, 문항은 다섯이다. 그날 실제로 무슨 일이 있었는지는 묻지 않는다. 무엇이 남았는지를 묻는다.',
  how: ['시계는 흐르지 않는다. <b>걷거나 물을 때만</b> 시간이 간다',
    '오른쪽 태블릿의 <b>증거함</b>에는 남은 기록과 <b>빈칸</b>이 있다. 산의 지점마다 물어서 얻는 기록이 더 있다',
    '<b>보고서</b>의 문항마다 카드를 <b>석 장</b>까지 붙인다. 붙인 카드에 따라 문장과 판정이 바뀐다',
    '갈림길에서는 <b>한쪽만</b> 갈 수 있다. 정상에서 보고서를 보내면 끝난다'],
  inherited: () => inheritedNote(),
  routes: {}, channels: [], apps: [], decisions: {}, trailEvents: {},

  init() {
    S.x = { visited: [{ t: toMin('09:00'), node: 'gate' }], route: null, asked: {}, got: {}, attached: Object.fromEntries(P3_Q.map((q) => [q.id, []])), tab: 'locker', pick: null, armed: false, cards: p3Cards() };
    for (const c of S.x.cards) if (c.where === 'locker') S.x.got[c.id] = true;
  },
  begin() {
    trailText(P3_PLACE.gate.text, 'place');
    const blanks = S.x.cards.filter((c) => c.where === 'locker' && !c.has).length;
    trailText(`태블릿을 켠다. 다섯 대의 백업. 남은 기록 ${S.x.cards.filter((c) => c.where === 'locker' && c.has).length}건, 빈칸 ${blanks}건.`, 'dim');
  },

  card(id) { return S.x.cards.find((c) => c.id === id); },
  // 그 지점의 풍경. 쉼터가 닫혔는지, 약수터에 나올 사람이 있는지는 앞에서 남긴 것으로 정해진다.
  placeText(n) {
    if (n === 'rest1' && p3v('DAEUN') === 'inside') return '셔터가 내려져 있다. 처마에 고드름이 달렸다.';
    if (n === 'fork' && !this.card('p_child').known) return '이정표에 눈이 얹혀 있다. 능선길 끝 전망대에서는 서하늘이 기다리기로 했다. 계곡길 쪽에는 찾아낸 증인이 없다. 해가 짧아 한쪽만 갈 수 있다.';
    return P3_PLACE[n].text;
  },
  judge(qid) { return p3Judge(qid, S.x.attached[qid], S.x.cards); },
  levels() { return Object.fromEntries(P3_Q.map((q) => [q.id, this.judge(q.id).level])); },
  // 엔딩의 한 축: Q1~Q3이 모두 인정이면 진상 인정, 거의 다 확인 불가면 은폐, 그 사이는 부분 인정(GDD 8장)
  column() { const lv = this.levels(), sum = lv.q1 + lv.q2 + lv.q3; return sum === 6 ? 'truth' : sum <= 1 ? 'cover' : 'partial'; },
  ending() { return P3_END[p3Outcome()][this.column()]; },
  // 판정을 가장 높이는 카드 조합(봇과 테스트용). 같은 판정이면 적은 장수.
  best(qid) {
    const have = S.x.cards.filter((c) => S.x.got[c.id] && c.has).map((c) => c.id), sets = [[]];
    for (let i = 0; i < have.length; i++) { sets.push([have[i]]); for (let j = i + 1; j < have.length; j++) { sets.push([have[i], have[j]]); for (let k = j + 1; k < have.length; k++) sets.push([have[i], have[j], have[k]]); } }
    sets.sort((p, q) => p.length - q.length);
    let top = [], lv = -1;
    for (const s of sets) { const l = p3Judge(qid, s, S.x.cards).level; if (l > lv) { lv = l; top = s; } }
    return top;
  },

  act(k, a, b) {
    const x = S.x;
    if (k !== 'submit') x.armed = false;
    if (k === 'tab') { x.tab = a; x.pick = null; x.jump = true; }
    if (k === 'pick') { x.tab = 'report'; x.pick = x.pick === a ? null : a; }
    if (k === 'att' && x.attached[a] && x.got[b] && this.card(b).has) {
      const list = x.attached[a];
      if (list.includes(b)) list.splice(list.indexOf(b), 1);
      else if (list.length < P3_SLOTS) list.push(b);
      log(`보고서 ${a.toUpperCase()}: ${list.map((id) => this.card(id).title).join(', ') || '(없음)'} → ${P3_LEVEL[this.judge(a).level]}`);
    }
    if (k === 'inq' && !S.seg && P3_PLACE[S.node].ask && !x.asked[S.node]) {
      x.asked[S.node] = true; S.t += P3_PLACE[S.node].min;
      for (const c of x.cards.filter((q) => q.where === S.node)) {
        x.got[c.id] = true;
        trailText(`${c.has ? '증거함에 넣는다' : '빈칸'}: ${c.title} — ${c.text}`, c.has ? 'clue' : 'dim', c.has && c.fact && getFact(c.fact) ? linkTag(c.fact) : '');
        log(`${c.has ? '증거' : '빈칸'}: ${c.title}`);
      }
    }
    if (k === 'climb' && SEG[a] && SEG[a].from === S.node) {
      const seg = SEG[a];
      if (seg.id === 'ridge' || seg.id === 'valley') x.route = seg.id;
      S.t += seg.minutes; S.node = seg.to;
      x.visited.push({ t: S.t - seg.minutes, seg: seg.id }, { t: S.t, node: seg.to });
      trailText(P3_WALK[seg.id], 'dim');
      trailText(`${NODES[seg.to].name} (${NODES[seg.to].alt}m). ${this.placeText(seg.to)}`, 'place');
      const boom = ['happened', 'evacuated'].includes(p3Outcome());
      if ((seg.to === 'view' || seg.to === 'summit') && !x.sawCity && (x.sawCity = true)) trailText(boom ? '중앙역 자리에는 파란 가림막이 둘러쳐 있다.' : '중앙역 지붕 위로 기차가 드나든다.', 'dim', getFact('T13') ? linkTag('T13') : '');
      log(`도착: ${NODES[seg.to].name}`);
      ambientTick();
    }
    if (k === 'submit' && S.node === 'summit') {
      if (!x.armed) { x.armed = true; return; }
      finishChapter('submit');
    }
  },

  head() { return { place: NODES[S.node].name, sub: `11월 14일 · 첫눈 · 고도 ${NODES[S.node].alt}m` }; },
  badge() { const n = S.x.cards.filter((c) => S.x.got[c.id] && c.has).length; return { label: '증거', value: `${n}장` }; },
  bars() {
    const lv = this.levels(), sum = Object.values(lv).reduce((a, b) => a + b, 0), steps = S.x.visited.filter((v) => v.node).length - 1;
    return [{ label: '길', pct: (steps / 4) * 100, text: `${steps}/4` }, { label: '보고', pct: sum * 10, text: `${Object.values(lv).filter((l) => l === 2).length}/5` }];
  },
  rule() { return '<small>남은 기록만 결론이 된다 · 문항마다 카드 석 장 · 붙인 카드에 따라 문장이 바뀐다</small>'; },
  faceHint() { return facingCity() ? ' (도시 쪽)' : ''; },
  view() {
    const found = S.x.cards.filter((c) => c.where === S.node), P = P3_PLACE[S.node];
    const rows = [this.placeText(S.node)];
    if (P.ask) rows.push(S.x.asked[S.node] ? `여기서 얻은 것: ${found.map((c) => `<b>${esc(c.title)}</b>${c.has ? '' : ' (빈칸)'}`).join(', ')}` : '여기서 물을 수 있는 것이 있다.');
    return `<div class="view"><b>${NODES[S.node].name}</b><ul>${rows.map((r) => `<li>${r}</li>`).join('')}</ul></div>`;
  },
  actions() {
    const x = S.x, P = P3_PLACE[S.node], b = [];
    if (P.ask) b.push(btn('inq', `${S.node === 'spring' && !this.card('p_child').known ? '약수터 둘레를 살펴본다' : P.ask}<small>${x.asked[S.node] ? '이미 물었다' : `${P.min}분`}</small>`, !!x.asked[S.node]));
    for (const s of nextSegs()) b.push(btn(`climb:${s.id}`, `${s.name} → ${NODES[s.to].name}<small>${s.minutes}분${S.node === 'fork' ? ` · ${s.id === 'ridge' ? '전망대: 서하늘의 진술' : this.card('p_child').known ? '약수터: 민준과 엄마의 진술' : '약수터: 약속된 증인 없음'} · 다른 길은 못 간다` : ''}</small>`));
    if (S.node === 'summit') {
      const lv = Object.values(this.levels()), n = (l) => lv.filter((q) => q === l).length;
      b.push(btn('submit', x.armed ? '한 번 더 누르면 보낸다 — 보낸 뒤에는 고칠 수 없다' : `보고서를 보낸다<small>인정 ${n(2)} · 부분 인정 ${n(1)} · 확인 불가 ${n(0)}</small>`));
    }
    return b.join('');
  },

  phoneView() {
    const x = S.x, got = x.cards.filter((c) => x.got[c.id]), lv = this.levels();
    const tabs = `<div class="ptabs">${[['locker', `증거함 ${got.filter((c) => c.has).length}`], ['report', `보고서 ${Object.values(lv).filter((l) => l > 0).length}/5`]].map(([id, name]) => `<button class="${x.tab === id ? 'on' : ''}" data-act="tab:${id}">${name}</button>`).join('')}</div>`;
    const where = (c) => P3_Q.filter((q) => x.attached[q.id].includes(c.id)).map((q) => q.id.toUpperCase()).join(' ');
    const cardHtml = (c) => `<div class="ev${c.has ? '' : ' blank'}"><b>${esc(c.title)}</b> <em>${c.has ? c.kind : '빈칸'}</em>${where(c) ? `<i>${where(c)}</i>` : ''}<p>${esc(c.text)}</p></div>`;
    let body;
    if (x.tab === 'locker') {
      body = Object.entries(P3_HOLDER).map(([hid, name]) => {
        const mine = x.cards.filter((c) => c.holder === hid);
        const rows = mine.filter((c) => x.got[c.id]).map(cardHtml).join('');
        const todo = [...new Set(mine.filter((c) => !x.got[c.id]).map((c) => c.where))].map((n) => `<div class="ev todo">${NODES[n].name} — ${x.route && ((n === 'view' && x.route === 'valley') || (n === 'spring' && x.route === 'ridge')) ? '가지 않은 길' : S.x.visited.some((v) => v.node === n) ? '아직 묻지 않았다' : '아직 가지 않았다'}</div>`).join('');
        return `<div class="cap pad">${name}</div>${rows}${todo}`;
      }).join('');
    } else {
      body = P3_Q.map((q, i) => {
        const j = this.judge(q.id), list = x.attached[q.id];
        const chips = list.map((id) => `<button class="chip on" data-act="att:${q.id}:${id}">${esc(this.card(id).title)}<small>${j.used.includes(id) ? '근거' : '무관'} ×</small></button>`).join('');
        const picker = x.pick !== q.id ? '' : `<div class="pickbox">${got.filter((c) => c.has && !list.includes(c.id)).map((c) => `<button class="chip" data-act="att:${q.id}:${c.id}"${list.length >= P3_SLOTS ? ' disabled' : ''}>${esc(c.title)}<small>${c.kind}</small></button>`).join('') || '<span class="dim">붙일 카드가 없다</span>'}</div>`;
        return `<div class="rq lv${j.level}"><b>Q${i + 1}. ${q.title}</b><span class="lv">${P3_LEVEL[j.level]}</span><p>${esc(j.text)}</p>${j.gap ? `<small>빈칸 — ${esc(j.gap)}</small>` : ''}
          <div class="chips">${chips}<button class="chip add" data-act="pick:${q.id}">${x.pick === q.id ? '닫기' : `증거 붙이기 ${list.length}/${P3_SLOTS}`}</button></div>${picker}</div>`;
      }).join('');
    }
    const scroll = x.jump ? 'top' : 'keep';
    x.jump = false;
    return { cls: 'tab', scroll, status: `<span>증거함 태블릿</span><b>11/14 ${hm(S.t)}</b><span>${NODES[S.node].signal ? '' : '서비스 없음'}</span>`, body: tabs + body };
  },

  resolve() { return [{ id: 'submit', label: this.ending()[0] }]; },
  onEnd() {
    const x = S.x, out = p3Outcome(), col = this.column(), [name, line] = this.ending(), truth = p3Truth();
    const report = P3_Q.map((q) => { const j = this.judge(q.id); return { id: q.id, title: q.title, level: j.level, text: j.text, used: j.used, attached: x.attached[q.id].slice() }; });
    trailText('정상에서 보고서를 보낸다.', 'place');
    for (const [i, q] of report.entries()) {
      trailText(`Q${i + 1}. ${q.title} [${P3_LEVEL[q.level]}] ${q.text}`, q.level === 2 ? 'clue' : q.level ? '' : 'dim');
      // 근거가 된 카드는 앞 장의 선택에서 왔다
      for (const id of q.used) { const c = this.card(id); if (c.fact && getFact(c.fact)) noteLink(c.fact, `Q${i + 1}의 근거가 됐다: ${c.title}`); }
    }
    if (getFact('T13')) noteLink('T13', `엔딩의 한 축: ${getFact('T13').label}`);
    // 빈칸: 인정에 이르지 못한 문항마다, 있었다면 판정을 올렸을 기록
    const blanks = [];
    for (const q of report.filter((r) => r.level < 2)) for (const c of x.cards.filter((k) => !k.never && !q.attached.includes(k.id))) {
      if (p3Judge(q.id, [...q.attached, c.id], x.cards.map((k) => (k.id === c.id ? { ...k, has: true } : k))).level <= q.level) continue;
      const why = c.has ? (x.got[c.id] ? '증거함에 있었지만 붙이지 않았다' : `${NODES[c.where].name}에서 묻지 않았다`) : c.hint;
      if (why) blanks.push({ q: q.id, card: c.title, why, had: c.has });
    }
    const n = (l) => report.filter((r) => r.level === l).length;
    setFact('REPORT', Object.fromEntries(report.map((r) => [r.id, r.level])), `인정 ${n(2)} · 부분 인정 ${n(1)} · 확인 불가 ${n(0)}`);
    setFact('ENDING', `${out}/${col}`, `${name} — ${line}`);
    L.tracks.part3 = { route: x.route, visited: x.visited, asked: Object.keys(x.asked), cards: x.cards.map((c) => ({ id: c.id, title: c.title, kind: c.kind, has: c.has, got: !!x.got[c.id], text: c.text })),
      report, truth, blanks, ending: { name, line, outcome: out, column: col }, epilogue: this.epilogue(col, out), endT: S.t };
    trailText(`${name}. ${line}`, 'place');
  },
  // 인물 후일담: 각자의 결심과 2부의 결과, 그리고 보고서가 정한다
  epilogue(col, out) {
    const art = p3v('ARTICLE'), streamed = !!p3Did('jungwoo', /방송에 대화방/), bail = p3v('R5') === 'bail';
    const daeun = { shelter: '다은은 대피소에서 그날 밤을 보냈다. 쉼터는 다음 주에 다시 문을 열었다. 계산대 옆 충전기는 여전히 하나다.',
      spared: '다은은 그날 저녁 기차로 산 아래까지 왔다. 쉼터는 다음 주에 다시 문을 열었다.',
      out: '다은은 역 광장에서 그 소리를 들었다. 엄마 말을 듣고 나와 있었다. 요즘도 지하로는 내려가지 않는다.',
      inside: '다은은 그 시각 중앙역 지하에 있었다. 참나무 쉼터의 셔터는 11월에도 내려가 있다.' }[p3v('DAEUN')] || '쉼터는 다음 주에 다시 문을 열었다.';
    const hanul = streamed ? '그 방송의 조회 수는 채널의 다른 영상을 다 합친 것보다 많다. 그 뒤로 단풍 영상은 올리지 않았다.'
      : p3v('J5') === 'post' ? '그날 14시에 "이 와중에 등산"이라는 기사가 났다. 출처는 그의 방송 제목이었다. 구독자는 늘었고, 댓글 창은 닫았다.'
      : p3v('R2') === 'down' ? '그날 영상은 올리지 않았다. 채널은 한 달째 조용하다.' : '그날 방송은 단풍 영상으로 남았다. 화면 구석에 연기가 있다.';
    const yuna = { plot: '기사는 1면에 실렸다. 다음 날부터는 다른 신문들이 그 기사를 받아 썼다.', guard: '기사는 사회면에 실렸다. "폭발 전 새벽 경비 철수". 시는 사실무근이라고 답했다.',
      boss: '기사는 사회면에 실렸다. "그날 본부장은 산에". 시는 개인 일정이라고 답했다.', hint: '기사는 실렸고, 시는 답하지 않았다. 제보자는 다시 연락해 오지 않았다.',
      sketch: '단풍 스케치가 실렸다. 사진 구석에 연기가 보인다.', none: '그날 기사는 나가지 않았다. 수첩은 서랍에 있다.' }[art] || '그날 기사는 나가지 않았다.';
    const han = out === 'exposed' ? '스스로 드러냈다. 그것으로 무엇이 가벼워지는지는 재판이 정한다.'
      : col === 'truth' ? '구속됐다. 첫 공판에서 그는 "나는 산에 있었다"고 말했다.' : col === 'partial' ? '직무에서 물러났다. 기소되지는 않았다.' : '유임됐다. 연말 재난 대응 유공 표창 대상에 이름이 올랐다.';
    const doyun = bail ? '진술의 대가로 형을 줄였다. 지금은 연락이 닿지 않는다.' : col === 'truth' ? '함께 구속됐다. 두 번째 휴대폰은 끝내 나오지 않았다.' : col === 'partial' ? '사표를 냈다. 수리됐다.' : '아직 비서실장이다.';
    return [['오미숙', daeun], ['서하늘', hanul], ['정윤아', yuna], ['한정우', han], ['김도윤', doyun], ['문태오', `보고서는 A4 한 장이다. 그는 내려오는 길에 참나무 쉼터 앞에서 한 번 멈췄다.`]];
  },
  // 마침 화면: 엔딩, 보고서, 그리고 보고서 옆에 펼치는 "실제로 일어난 일"(GDD 7장 마지막 페이지)
  endLead() {
    const p = L.tracks.part3, cls = ['bad', '', 'ok'];
    const rows = p.report.map((r, i) => `<tr><td><b>Q${i + 1}.</b> ${esc(r.title)}<br><span class="${cls[r.level]}">${P3_LEVEL[r.level]}</span></td><td>${esc(r.text)}</td><td>${esc(p.truth[r.id])}${r.level === 2 ? '' : '<br><small class="bad">여기서 갈라진다</small>'}</td></tr>`).join('');
    const blanks = p.blanks.map((b) => `<li><b>${b.q.toUpperCase()}</b> ${esc(b.card)} <small>— ${esc(b.why)}</small></li>`).join('');
    return `<div class="ending"><p class="sub">${{ happened: '13시: 2단계 발생', stopped: '13시: 중단', exposed: '13시: 공개로 무산', evacuated: '13시: 발생, 대피로 피해 감소' }[p.ending.outcome]} × 보고서: ${{ truth: '진상 인정', partial: '부분 인정', cover: '은폐 성공' }[p.ending.column]}</p>
      <h1>${esc(p.ending.name)}</h1><p>${esc(p.ending.line)}</p></div>
      <h3>보고서와 실제로 일어난 일</h3><div class="tblwrap"><table class="rep"><tr><th>문항</th><th>보고서 — 남은 기록</th><th>실제로 일어난 일 — 장부</th></tr>${rows}</table></div>
      <p class="dim">${esc(p.truth.more)}</p>
      <h3>빈칸 — 이 기록이 있었다면</h3>${blanks ? `<ul class="facts">${blanks}</ul>` : '<p class="dim">없음. 보고서는 남을 수 있는 것을 다 담았다.</p>'}
      <h3>그 뒤</h3><ul class="facts">${p.epilogue.map(([who, text]) => `<li><b>${who}</b> ${esc(text)}</li>`).join('')}</ul>
      <div class="check"><h3>3부 확인</h3><ol><li>붙인 카드에 따라 문장이 바뀌는 것으로, 증거로 결론을 내는 과정이 납득됐나?</li>
      <li>빈칸이 1부와 2부의 어느 선택에서 왔는지 떠올랐나? 다른 선택으로 다시 해 보고 싶어졌나?</li>
      <li>보고서와 실제가 갈라지는 이 마지막 장이 이 이야기의 끝으로 맞았나?</li></ol></div>`;
  },

  // 화면을 찍으려고 봇을 세운다: p3stop=<지점>. 거기까지 묻고 올라가서, 정상이면 카드를 붙인 보고서 탭을 연 채 멈춘다.
  botShot(stop) {
    if (P3_PLACE[S.node].ask && !S.x.asked[S.node]) { act('inq'); return; }
    if (S.node !== stop && S.node !== 'summit') { act(`climb:${nextSegs()[0].id}`); return; }
    if (S.node !== 'summit' || S.x.shot) return;
    S.x.shot = true;
    for (const Q of P3_Q) for (const id of this.best(Q.id)) act(`att:${Q.id}:${id}`);
    act('pick:q2');
  },
  // 봇: route=ridge|valley, skip=<지점,…>(묻지 않고 지나감), fill=best|none, q1..q5=<카드.카드>(직접 붙임)
  bot() {
    const q = (k, d) => params.get(k) || d;
    if (params.get('p3stop')) { this.botShot(params.get('p3stop')); return; }
    if (P3_PLACE[S.node].ask && !S.x.asked[S.node] && !q('skip', '').split(',').includes(S.node)) { act('inq'); return; }
    if (S.node !== 'summit') { const n = nextSegs(); act(`climb:${(n.find((s) => s.id === q('route', 'ridge')) || n[0]).id}`); return; }
    for (const Q of P3_Q) {
      const want = params.get(Q.id) != null ? params.get(Q.id).split('.').filter(Boolean) : q('fill', 'best') === 'none' ? [] : this.best(Q.id);
      for (const id of want) if (!S.x.attached[Q.id].includes(id)) act(`att:${Q.id}:${id}`);
    }
    act('submit'); act('submit');
  },
};
