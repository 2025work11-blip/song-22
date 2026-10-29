// 화면 확인 전용 가상 환자 데이터입니다. 실제 환자 정보를 이 파일에 넣지 마세요.
// 향후 인증된 서버가 본인에게 허용된 데이터만 반환하도록 교체합니다.
window.patientMockData = {
  name: '000',
  chartNumber: 'DEMO-0001',
  birthDate: '1960-01-01',
  district: '서울특별시 강남구',
  phoneLastFour: '0000',
  symptom: '백내장',
  latestVisit: { date: '2026-10-10', doctor: '1번 원장' },
  previousVisits: [
    { date: '2026-09-18', doctor: '1번 원장' },
    { date: '2026-08-21', doctor: '2번 원장' },
    { date: '2026-07-24', doctor: '1번 원장' }
  ],
  // 약명과 순서는 형식 예시입니다. 실제 약명·용법·순서는 처방 원문을 확인해 표시해야 합니다.
  medications: [
    { order: 1, name: '처방약 A (샘플)' },
    { order: 2, name: '처방약 B (샘플)' }
  ],
  nextVisit: { date: '2026-11-10' }
};
