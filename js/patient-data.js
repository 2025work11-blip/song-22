// 화면 확인 전용 가상 환자 데이터입니다. 실제 환자 정보를 이 파일에 넣지 마세요.
// 향후 인증된 서버가 본인에게 허용된 데이터만 반환하도록 교체합니다.
window.patientMockData = {
  name: '000',
  chartNumber: 'DEMO-0001',
  birthDate: '1960-01-01',
  district: '서울특별시 강남구',
  phoneLastFour: '0000',
  symptom: '백내장',
  // 병원이 확인한 언어별 표기를 넣습니다. 환자 이름·식별번호는 자동 번역하지 않습니다.
  localized: {
    en: { district: 'Gangnam-gu, Seoul', symptom: 'Cataract' },
    'zh-CN': { district: '首尔特别市江南区', symptom: '白内障' }
  },
  latestVisit: { date: '2026-10-10', doctor: '1번 원장' },
  previousVisits: [
    { date: '2026-09-18', doctor: '1번 원장' },
    { date: '2026-08-21', doctor: '2번 원장' },
    { date: '2026-07-24', doctor: '1번 원장' }
  ],
  // 약명과 순서는 형식 예시입니다. 실제 약명·용법·순서는 처방 원문을 확인해 표시해야 합니다.
  medications: [
    {
      order: 1, name: '처방약 A (샘플)',
      usage: '병원에서 확인한 복용방법을 안내할 영역입니다. 실제 복용방법은 처방 정보 연동 후 반영합니다.',
      description: '이 약의 용도와 특징을 간단히 설명할 영역입니다. 현재는 화면 확인용 샘플입니다.'
    },
    {
      order: 2, name: '처방약 B (샘플)',
      usage: '병원에서 확인한 복용방법과 주의사항을 안내할 영역입니다. 임의의 용량이나 복용 간격은 안내하지 않습니다.',
      description: '환자가 이해하기 쉬운 짧은 약 설명을 담을 영역입니다. 실제 내용은 병원 검토 후 제공합니다.'
    }
  ],
  // 병원에서 안내할 상대 시점 문구입니다. 날짜로 환산하거나 확정 예약으로 처리하지 않습니다.
  nextVisit: { relativeText: '2주 후' }
};
