// 「정상 보고」 세계 데이터 — 모든 장이 공유하는 산, 도시, 그날의 사건.
// 장별 휴대폰 내용(대화방, 전화, 산길 이벤트)은 ch_*.js 에 있다.

const VERSION = '0.6.0';   // scripts/build.sh 가 이 값으로 배포판 이름을 짓는다
const START_MIN = 6 * 60;   // 도시 시뮬레이션은 언제나 06:00부터 돈다

// 지점. signal: 휴대폰 신호 0~4칸
const NODES = {
  gate:   { name: '해령산 매표소', alt: 120, signal: 4,
            text: '단풍철이라 이른 아침부터 사람이 많다. 휴대폰엔 비서실이 지난주 등록해 둔 산행 일정이 떠 있다.' },
  rest1:  { name: '참나무 쉼터', alt: 410, signal: 4, rest: true, charger: true, tv: true,
            text: '매점, 공용 충전기 하나, 와이파이. 벽걸이 TV가 켜져 있다.' },
  fork:   { name: '갈림길', alt: 560, signal: 2,
            text: '이정표: 왼쪽 능선길(전망대 경유), 오른쪽 계곡길(약수터 경유). "계곡 구간 휴대폰 불통" 안내판이 붙어 있다.' },
  view:   { name: '매봉 전망대', alt: 820, signal: 4, overlook: true,
            text: '난간 너머 남쪽으로 해령시 전체가 내려다보인다.' },
  spring: { name: '약수터', alt: 690, signal: 0, spring: true, noisy: true,
            text: '바위틈에서 찬물이 흘러나온다. 물소리가 크다. 화면 구석엔 "서비스 없음".' },
  summit: { name: '해령산 정상', alt: 1052, signal: 4, overlook: true, summit: true,
            text: '정상석 앞에 인증샷 줄이 서 있다. 남쪽으로 도시가 한눈에 들어온다.' },
};

// 구간. minutes: 체력이 충분할 때 걸리는 시간, stamina: 구간 전체 체력 소모
const SEGMENTS = [
  { id: 'forest', from: 'gate', to: 'rest1', name: '참나무 숲길', minutes: 80, signal: 3, stamina: 18 },
  { id: 'stairs', from: 'rest1', to: 'fork', name: '돌계단', minutes: 70, signal: 2, stamina: 24 },
  { id: 'ridge', from: 'fork', to: 'view', name: '능선길', minutes: 70, signal: 4, stamina: 26, exposed: true },
  { id: 'ridge2', from: 'view', to: 'summit', name: '정상 능선', minutes: 60, signal: 3, stamina: 18, exposed: true },
  { id: 'valley', from: 'fork', to: 'spring', name: '계곡길 아래', minutes: 50, signal: 0, stamina: 12, noisy: true },
  { id: 'valley2', from: 'spring', to: 'summit', name: '계곡길 위', minutes: 50, signal: 1, stamina: 20 },
];

// 도시 구역. bearing: 산에서 본 방위각(북=0), km: 거리. 소리 방향·지연과 지도 위치에 같이 쓴다.
const DISTRICTS = [
  { id: 'port',    name: '항만',      bearing: 215, km: 14, pop: 1.0, neighbors: ['newtown', 'station'] },
  { id: 'station', name: '중앙역',    bearing: 182, km: 11, pop: 1.4, neighbors: ['port', 'hall', 'newtown'] },
  { id: 'hall',    name: '시청',      bearing: 158, km: 10, pop: 0.8, neighbors: ['station', 'campus'] },
  { id: 'campus',  name: '대학가',    bearing: 132, km: 9,  pop: 1.0, neighbors: ['hall'] },
  { id: 'newtown', name: '신시가지',  bearing: 200, km: 8,  pop: 1.2, neighbors: ['port', 'station'] },
];

// 보고 출처. 어느 대화방(또는 뉴스 앱)으로 들어갈지는 장마다 routes 로 정한다.
const SOURCES = {
  police: { name: '경찰 상황실' },
  fire:   { name: '소방 본부' },
  ward:   { name: '구청 당직실' },
  field:  { name: '현장 박주임' },
  sns:    { name: 'SNS 제보' },
  press:  { name: '언론' },
  poll:   { name: '여론조사' },
};

// 그날의 고정 사건. 어느 장에서든 같은 시각에 같은 일이 일어난다(GDD 1.3).
// reports[].danger 는 그 출처가 "보고하는" 위험도(실제와 다를 수 있음).
const CITY_EVENTS = [
  { at: '06:35', reports: [{ src: 'ward', lag: 0, danger: 0, text: '[공지] 금일 07시부터 항만 3부두 정비 작업. 일대 차량 통제 예정.' }] },
  { at: '07:05', reports: [{ src: 'sns', lag: 0, danger: 0, text: '해령산 입구 벌써 주차장 꽉 참. 단풍 절정이래' }] },
  { at: '07:40', blast: { d: 'port', size: 3, danger: 45 }, label: '항만 3부두 창고 폭발', d: 'port',
    reports: [
      { src: 'sns',    lag: 2,  danger: 85, text: '항만 쪽에서 엄청 큰 소리!!! 창문이 흔들렸어요' },
      { src: 'field',  lag: 5,  danger: 50, text: '3부두 창고 폭발. 연기 많습니다. 정비 작업자 대피 중.' },
      { src: 'ward',   lag: 9,  danger: 85, text: '항만 대형 폭발!! 사상자 다수 추정. 지시 바랍니다.', urgent: true },
      { src: 'fire',   lag: 12, danger: 55, text: '항만 3부두 창고 화재 출동, 대응 1단계. 인명피해 확인 중.' },
      { src: 'police', lag: 18, danger: 50, text: '항만 진입로 통제 시작. 원인 미상, 폭발물 가능성 배제 못 함.' },
      { src: 'press',  lag: 35, danger: 50, text: '[속보] 해령항 창고서 폭발… 검은 연기 치솟아' },
    ] },
  { at: '08:30', truth: { d: 'station', danger: 8 }, label: '중앙역 분실 가방 소동', d: 'station',
    reports: [
      { src: 'sns',    lag: 1,  danger: 90, text: '중앙역에 폭탄 있대요 다들 피하세요!!!' },
      { src: 'ward',   lag: 6,  danger: 70, text: '중앙역 폭발물 의심 신고. 시민 동요 심함. 대피 필요해 보입니다.', urgent: true },
      { src: 'police', lag: 22, danger: 10, text: '중앙역 의심 가방 확인 결과 분실물. 특이사항 없음.' },
    ] },
  { at: '09:10', blast: { d: 'port', size: 2, danger: 25 }, label: '항만 2차 폭발', d: 'port',
    reports: [
      { src: 'sns',    lag: 1,  danger: 85, text: '항만 또 터짐… 시는 뭐 하는 거냐' },
      { src: 'field',  lag: 4,  danger: 75, text: '2차 폭발입니다. 불이 4부두 쪽으로 번져요. 작업자 몇 명 연락이 안 됩니다.', urgent: true },
      { src: 'fire',   lag: 10, danger: 70, text: '대응 2단계 상향. 신시가지 방향으로 번질 우려.' },
      { src: 'police', lag: 16, danger: 65, text: '항만 일대 봉쇄 건의드립니다. 지시 바랍니다.' },
      { src: 'press',  lag: 28, danger: 70, text: '[속보] 해령항 2차 폭발… 불길 4부두로 번져' },
    ] },
  { at: '09:40', truth: { d: 'campus', danger: 20 }, label: '대학가 집회', d: 'campus',
    reports: [
      { src: 'sns',    lag: 2,  danger: 30, text: '대학가에서 "항만 진실 밝혀라" 집회 시작. 사람 계속 늘어남' },
      { src: 'ward',   lag: 8,  danger: 65, text: '대학가 불법 집회. 해산 조치 필요합니다.' },
      { src: 'police', lag: 15, danger: 25, text: '대학가 집회 약 800명. 현재까지 평화적.' },
    ] },
  { at: '10:00', fog: true },
  { at: '10:20', truth: { d: 'newtown', danger: 18 }, blackout: true, label: '신시가지 정전', d: 'newtown',
    reports: [
      { src: 'sns',    lag: 3,  danger: 40, text: '신시가지 정전ㅠㅠ 엘리베이터에 사람 갇혔대' },
      { src: 'fire',   lag: 9,  danger: 45, text: '신시가지 변전소 화재로 정전. 승강기 갇힘 신고 다수.', urgent: true },
      { src: 'press',  lag: 30, danger: 40, text: '신시가지 일대 대규모 정전… 원인 조사 중' },
    ] },
  { at: '10:50', heli: true },
  { at: '11:10', fog: false },
];

// 08시 이후 22~40분마다 하나씩. 회차 시드로 뽑으므로 같은 회차의 모든 장에서 같은 사건이 난다.
// {d}는 구역 이름. add: 실제 위험도에 얹는 과장 폭
const RANDOM_EVENTS = [
  { danger: 7, reports: [{ src: 'fire', lag: 8, add: 15, text: '{d} 상가 화재 신고. 진화 중.' },
                         { src: 'sns', lag: 2, add: 45, text: '{d} 불났어요 연기 엄청 남' }] },
  { danger: 0, reports: [{ src: 'sns', lag: 1, add: 60, text: '{d}에서 총소리 들렸다는데 진짜임?' }] },
  { danger: 4, reports: [{ src: 'police', lag: 10, add: 8, text: '{d} 교차로 다중 추돌. 통제 중.' }] },
  { danger: 6, minDanger: 35, reports: [{ src: 'ward', lag: 6, add: 40, text: '{d} 주민 항의 전화 폭주. 대책 요구합니다.', urgent: true },
                                        { src: 'field', lag: 5, add: 10, text: '{d} 마트에 사람 몰립니다. 사재기 조짐.' }] },
];
