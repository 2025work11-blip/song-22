// 화면 확인용 샘플입니다. 병원이 확인한 안내문으로 교체한 뒤 isMock을 false로 변경하세요.
// 각 목록에 { title: '소제목', text: '설명' }을 추가하면 카드가 늘어납니다.
// 수술 안내가 미확정인 분야는 빈 배열을 유지하세요.
window.diseaseData = {
  vision: {
    title: '시력교정',
    summary: '시력교정을 알아보는 순간부터 수술 전후까지, 필요한 안내를 한곳에서 확인하세요.',
    isMock: true,
    overview: [
      { title: '시력교정 알아보기', text: '시력교정 분야와 검사 과정에 대한 소개가 들어갈 자리입니다. AA안과 확인 후 안내를 반영합니다.' },
      { title: '관련 증상과 불편', text: '시력과 관련한 불편을 이해할 수 있도록 설명하는 영역입니다. 구체적인 증상 안내는 AA안과 검토 후 제공합니다.' }
    ],
    outpatient: [
      { title: '진료 전 안내', text: '시력교정 외래 방문 전 확인할 준비 사항과 검사 관련 안내를 AA안과 검토 후 반영합니다.' },
      { title: '진료 후 안내', text: '검사와 진료 이후 다시 확인할 안내를 정리하는 영역입니다. 병원에서 확인한 내용으로 교체할 예정입니다.' }
    ],
    beforeSurgery: [
      { title: '수술 전 준비', text: '시력교정 수술 전 준비와 확인 사항을 안내할 영역입니다. 실제 준비 방법과 일정은 AA안과 확인 후 반영합니다.' }
    ],
    afterSurgery: [
      { title: '수술 후 관리', text: '시력교정 수술 후 관리와 경과 확인에 대한 안내를 담을 영역입니다. 구체적인 관리 내용은 AA안과 검토 후 제공합니다.' }
    ]
  },
  cataract: {
    title: '백내장',
    summary: '백내장에 대한 이해부터 외래 진료, 수술 전후의 안내까지 차근차근 확인하세요.',
    isMock: true,
    overview: [
      { title: '백내장 알아보기', text: '백내장에 대한 기본 설명과 검사 소개를 담을 영역입니다. AA안과가 확인한 내용으로 교체할 예정입니다.' },
      { title: '관련 증상 이해하기', text: '환자와 보호자가 백내장 관련 불편을 이해할 수 있도록 안내할 영역입니다. 증상 설명은 병원 검토 후 반영합니다.' }
    ],
    outpatient: [
      { title: '방문 전 확인', text: '백내장 진료를 앞둔 환자와 보호자가 확인할 외래 준비 사항을 AA안과 검토 후 제공합니다.' },
      { title: '진료 후 확인', text: '백내장 진료 이후 다시 확인할 병원의 안내를 정리하는 영역입니다. 현재는 화면 확인용 샘플입니다.' }
    ],
    beforeSurgery: [
      { title: '수술 전 확인 사항', text: '백내장 수술을 앞두고 필요한 병원 안내를 담을 영역입니다. 실제 수술 준비 내용은 AA안과 검토 후 반영합니다.' }
    ],
    afterSurgery: [
      { title: '수술 후 관리 안내', text: '백내장 수술 후 관리와 경과 확인 안내를 담을 영역입니다. 실제 환자 안내는 AA안과 확인 후 제공합니다.' }
    ]
  },
  glaucoma: {
    title: '녹내장',
    summary: '녹내장 관련 정보와 진료 전후에 확인할 안내를 살펴보세요.',
    isMock: true,
    overview: [
      { title: '녹내장 알아보기', text: '녹내장 분야를 이해하기 위한 기본 정보를 담을 영역입니다. 구체적인 설명은 AA안과 검토 후 반영합니다.' },
      { title: '관련 증상 안내', text: '녹내장과 관련해 궁금한 증상을 설명할 영역입니다. 현재는 의학적 내용이 확정되지 않은 화면 확인용 샘플입니다.' }
    ],
    outpatient: [
      { title: '외래 진료 준비', text: '녹내장 외래 방문 전 확인할 안내를 AA안과 검토 후 이곳에 정리합니다.' },
      { title: '진료 이후 안내', text: '녹내장 진료 이후 다시 확인할 병원 안내를 담을 영역입니다. 처방이나 개인별 치료 정보는 제공하지 않습니다.' }
    ],
    beforeSurgery: [],
    afterSurgery: []
  },
  retina: {
    title: '망막',
    summary: '망막 분야의 기본 정보와 외래 진료 안내를 한곳에서 확인하세요.',
    isMock: true,
    overview: [
      { title: '망막 분야 알아보기', text: '망막과 관련된 진료 분야를 소개할 영역입니다. 세부 질환 설명은 AA안과 확인 후 반영합니다.' },
      { title: '관련 증상 안내', text: '망막 분야의 증상과 불편에 대한 설명을 담을 영역입니다. 병원에서 검토한 내용으로 교체할 예정입니다.' }
    ],
    outpatient: [
      { title: '진료 전 확인', text: '망막 외래 진료와 검사를 앞두고 확인할 안내를 담을 영역입니다. 실제 준비 사항은 AA안과 검토 후 제공합니다.' },
      { title: '진료 후 확인', text: '망막 진료 이후 확인할 병원의 안내를 정리할 영역입니다. 현재 내용은 화면 구성 확인을 위한 샘플입니다.' }
    ],
    beforeSurgery: [],
    afterSurgery: []
  },
  myopia: {
    title: '소아근시',
    summary: '아이의 눈 건강이 궁금한 보호자를 위한 소아근시 정보와 외래 안내입니다.',
    isMock: true,
    overview: [
      { title: '소아근시 알아보기', text: '보호자가 소아근시를 이해할 수 있도록 기본 정보를 안내할 영역입니다. 설명은 AA안과 검토 후 반영합니다.' },
      { title: '아이의 불편 이해하기', text: '아이의 시력과 관련해 보호자가 궁금한 내용을 설명할 영역입니다. 구체적인 증상 정보는 병원 확인 후 제공합니다.' }
    ],
    outpatient: [
      { title: '아이와 함께 방문하기 전', text: '아이와 보호자가 진료 전 확인할 안내를 담을 영역입니다. AA안과 검토 후 실제 방문 안내로 교체합니다.' },
      { title: '진료 후 보호자 안내', text: '소아근시 진료 이후 보호자가 다시 확인할 내용을 정리할 영역입니다. 개인별 처방이나 치료 결정은 포함하지 않습니다.' }
    ],
    beforeSurgery: [],
    afterSurgery: []
  }
};

// 원장·일정·공지 예시는 초기 데이터 참고용으로 보존합니다.
// 실제 달력과 공지사항은 Supabase에서 조회하며 실패 시 아래 예시로 대체하지 않습니다.
// 관리자 화면은 아직 미구현입니다.
window.homeData = {
  // 요청받은 휴진 기간 예시입니다. 기존 DB에는 휴진 기간 컬럼이 없어 별도로 보관합니다.
  closures: [
    { doctorName: 'AAA원장', startDate: '2026-11-10', endDate: '2026-11-20' },
    { doctorName: 'BBB원장', startDate: '2026-11-25', endDate: '2026-11-30' }
  ],
  doctors: [
    // weekdays: 일요일 0 ~ 토요일 6 / morningOnly: 해당 요일은 오전만 진료
    { id: 'doctor-1', name: 'AAA원장', initial: 'A', color: 'blue', weekdays: [1, 2, 3, 4, 5], morningOnly: [3] },
    { id: 'doctor-2', name: 'BBB원장', initial: 'B', color: 'amber', weekdays: [1, 2, 4, 5], morningOnly: [4] },
    { id: 'doctor-3', name: 'CCC원장', initial: 'C', color: 'teal', weekdays: [1, 2, 3, 5], morningOnly: [] },
    { id: 'doctor-4', name: 'DDD원장', initial: 'D', color: 'purple', weekdays: [6], morningOnly: [] }
  ],
  schedules: [
    // 특정 날짜 일정이 필요하면 아래 형식으로 추가합니다. 같은 원장의 해당 날짜 주간 예시를 대체합니다.
    // { id: 'schedule-1', doctorId: 'doctor-1', date: '2026-10-29', title: '진료 일정 (샘플)', time: '오전 진료', period: 'morning' }
  ],
  notices: [
    { id: 'notice-1', date: '2026-10-29', title: 'AA안과 홈페이지 안내 준비 중 (샘플)', content: '홈페이지의 공지사항 영역을 확인하기 위한 샘플 게시글입니다. 실제 병원 공지는 확인 후 이곳에 게시됩니다.' },
    { id: 'notice-2', date: '2026-10-27', title: '원장별 일정표 이용 안내 (샘플)', content: '달력에서 날짜를 선택하면 원장별 일정을 확인할 수 있습니다. 현재 표시된 원장명과 일정은 모두 화면 확인용 샘플입니다.' },
    { id: 'notice-3', date: '2026-10-23', title: '진료 전후 정보 안내 (샘플)', content: '각 카테고리에서 안내 화면을 확인할 수 있습니다. 실제 환자 안내 내용은 AA안과 검토 후 반영됩니다.' }
  ]
};
