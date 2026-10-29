// 마이페이지는 현재 Mock Data만 표시합니다. 로그인 상태를 흉내 내거나 저장하지 않습니다.
(function () {
  'use strict';
  var page = document.querySelector('[data-mypage]');
  var homeSummary = document.querySelector('[data-home-patient-summary]');
  if (!page && !homeSummary) return;
  var patient = window.patientMockData;
  if (!patient) {
    if (homeSummary) homeSummary.hidden = true;
    if (page) {
      document.querySelector('[data-patient-content]').hidden = true;
      document.querySelector('[data-patient-error]').hidden = false;
    }
    return;
  }
  function dateText(value) {
    if (!value) return '확인 예정';
    var parts = value.split('-').map(Number);
    return parts[0] + '년 ' + parts[1] + '월 ' + parts[2] + '일';
  }
  function make(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  var latest = patient.latestVisit || {};
  var fields = {
    name: patient.name,
    chartNumber: patient.chartNumber,
    birthDate: dateText(patient.birthDate),
    district: patient.district,
    phoneLastFour: patient.phoneLastFour,
    symptom: patient.symptom,
    latestVisitDate: dateText(latest.date),
    doctor: latest.doctor,
    nextVisitDate: dateText((patient.nextVisit || {}).date)
  };
  document.querySelectorAll('[data-patient-field]').forEach(function (element) {
    var key = element.getAttribute('data-patient-field');
    element.textContent = fields[key] || '확인 예정';
  });

  // 홈에는 요약 정보만 표시하고 상세 진료·처방 목록은 마이페이지에서 표시합니다.
  if (!page) return;

  var history = document.querySelector('[data-visit-history]');
  history.replaceChildren();
  var visits = (patient.previousVisits || []).slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
  if (!visits.length) history.appendChild(make('p', 'patient-empty', '이전 진료 내역이 없습니다.'));
  visits.forEach(function (visit) {
    var card = make('article', 'visit-card');
    var date = make('time', '', dateText(visit.date));
    date.dateTime = visit.date;
    card.append(date, make('p', '', '담당의 · ' + (visit.doctor || '확인 예정')));
    history.appendChild(card);
  });

  var list = document.querySelector('[data-medications]');
  list.replaceChildren();
  var medications = (patient.medications || []).slice().sort(function (a, b) { return a.order - b.order; });
  if (!medications.length) list.appendChild(make('li', 'patient-empty', '최근 처방된 약 정보가 없습니다.'));
  medications.forEach(function (medication) {
    var row = make('li', 'medication-item');
    row.append(make('span', 'medication-order', String(medication.order)),
      make('span', 'medication-name', medication.name));
    list.appendChild(row);
  });
}());
