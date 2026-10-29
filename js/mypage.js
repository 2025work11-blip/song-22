// 환자 기록은 외부 번역 서비스로 보내지 않고 표시 형식과 확인된 언어별 문구만 바꿉니다.
(function () {
  'use strict';
  var page = document.querySelector('[data-mypage]');
  var homeSummary = document.querySelector('[data-home-patient-summary]');
  if (!page && !homeSummary) return;
  var lastLanguage = null;
  var lastPatient = null;
  var words = {
    ko: { pending: '확인 예정', recent: '최근 진료일 : ', symptom: '증상 : ', suffix: '님', doctor: '담당의', noVisits: '이전 진료 내역이 없습니다.', noMedicine: '최근 처방된 약 정보가 없습니다.', usage: '복용방법', about: '약 설명', usagePending: '복용방법 안내를 준비 중입니다.', aboutPending: '약 설명을 준비 중입니다.' },
    en: { pending: 'To be confirmed', recent: 'Most recent visit: ', symptom: 'Condition: ', suffix: '', doctor: 'Doctor', noVisits: 'No previous visits.', noMedicine: 'No recent prescription information.', usage: 'How to use', about: 'About this medication', usagePending: 'Instructions are not yet available.', aboutPending: 'Medication information is coming soon.' },
    'zh-CN': { pending: '待确认', recent: '最近就诊日期：', symptom: '症状：', suffix: ' 您好', doctor: '主治医生', noVisits: '暂无既往就诊记录。', noMedicine: '暂无最近处方药信息。', usage: '用法', about: '药物简介', usagePending: '用法说明准备中。', aboutPending: '药物简介准备中。' }
  };
  function make(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function dateText(value, language, fallback) {
    if (!value) return fallback;
    var parts = value.split('-').map(Number);
    if (parts.length !== 3 || parts.some(function (n) { return !Number.isFinite(n); })) return fallback;
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : language === 'zh-CN' ? 'zh-CN' : 'ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    }).format(new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])));
  }
  function doctorText(value, language) {
    if (!value || language === 'ko') return value;
    return value.replace(/([A-Z]{3})원장/g, language === 'en' ? 'Doctor $1' : '$1医生')
      .replace(/(\d+)번 원장/g, language === 'en' ? 'Doctor $1' : '$1号医生');
  }
  function relativeText(value, language) {
    if (!value || language === 'ko') return value;
    var text = value.replace(/\s+/g, '');
    var fixed = { '오늘': ['Today', '今天'], '내일': ['Tomorrow', '明天'], '모레': ['In 2 days', '后天'], '일주일후': ['In 1 week', '一周后'], '한주후': ['In 1 week', '一周后'], '한달후': ['In 1 month', '一个月后'] };
    if (fixed[text]) return fixed[text][language === 'en' ? 0 : 1];
    var match = text.match(/^(\d+)(일|주|개월|달)후$/);
    if (!match) return value;
    if (language === 'zh-CN') return match[1] + ({ '일': '天', '주': '周', '개월': '个月', '달': '个月' })[match[2]] + '后';
    var unit = { '일': 'day', '주': 'week', '개월': 'month', '달': 'month' }[match[2]];
    return 'In ' + match[1] + ' ' + unit + (Number(match[1]) === 1 ? '' : 's');
  }
  window.renderPatientLanguage = function (language) {
    language = words[language] ? language : 'ko';
    var patient = window.patientMockData;
    if (lastLanguage === language && lastPatient === patient) return;
    lastLanguage = language;
    lastPatient = patient;
    if (!patient) {
      if (page) {
        document.querySelector('[data-patient-content]').hidden = true;
        document.querySelector('[data-patient-error]').hidden = false;
      }
      return;
    }
    var labels = words[language];
    var localized = (patient.localized || {})[language] || {};
    var latest = patient.latestVisit || {};
    var fields = {
      name: patient.name, chartNumber: patient.chartNumber,
      birthDate: dateText(patient.birthDate, language, labels.pending),
      district: localized.district || patient.district,
      phoneLastFour: patient.phoneLastFour,
      symptom: localized.symptom || patient.symptom,
      latestVisitDate: dateText(latest.date, language, labels.pending),
      doctor: localized.doctor || doctorText(latest.doctor, language),
      nextVisitTiming: (localized.nextVisitTiming || relativeText((patient.nextVisit || {}).relativeText, language))
    };
    document.querySelectorAll('[data-patient-field]').forEach(function (element) {
      element.textContent = fields[element.getAttribute('data-patient-field')] || labels.pending;
    });
    document.querySelectorAll('[data-patient-label]').forEach(function (element) {
      element.textContent = labels[element.getAttribute('data-patient-label')] || '';
    });
    if (!page) return;
    var history = document.querySelector('[data-visit-history]');
    history.replaceChildren();
    var visits = (patient.previousVisits || []).slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
    if (!visits.length) history.appendChild(make('p', 'patient-empty', labels.noVisits));
    visits.forEach(function (visit) {
      var card = make('article', 'visit-card');
      var date = make('time', '', dateText(visit.date, language, labels.pending));
      date.dateTime = visit.date;
      var doctor = ((visit.localized || {})[language] || {}).doctor || doctorText(visit.doctor, language) || labels.pending;
      card.append(date, make('p', '', labels.doctor + ' · ' + doctor));
      history.appendChild(card);
    });
    var list = document.querySelector('[data-medications]');
    list.replaceChildren();
    var medications = (patient.medications || []).slice().sort(function (a, b) { return a.order - b.order; });
    if (!medications.length) list.appendChild(make('li', 'patient-empty', labels.noMedicine));
    medications.forEach(function (medication) {
      var row = make('li', 'medication-item');
      var details = make('details', 'medication-accordion');
      var summary = make('summary', 'medication-trigger');
      var indicator = make('span', 'medication-expand', '+');
      indicator.setAttribute('aria-hidden', 'true');
      summary.append(make('span', 'medication-order', String(medication.order)), make('span', 'medication-name', medication.name), indicator);
      var content = make('div', 'medication-content');
      content.append(make('h3', '', labels.usage), make('p', '', medication.usage || labels.usagePending),
        make('h3', '', labels.about), make('p', '', medication.description || labels.aboutPending));
      details.append(summary, content);
      row.appendChild(details);
      list.appendChild(row);
    });
  };
  window.renderPatientLanguage(window.aaUILanguage || 'ko');
}());
