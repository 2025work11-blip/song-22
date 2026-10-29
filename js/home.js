// 홈 전용 달력과 공지사항. 데이터 수정은 data.js의 homeData에서 진행하세요.
(function () {
  'use strict';
  var calendar = document.querySelector('[data-calendar]');
  if (!calendar) return;
  var data = window.homeData || {};
  var doctors = data.doctors || [];
  var schedules = data.schedules || [];
  var notices = data.notices || [];
  var holidays = window.holidayData || { years: [], dates: {} };
  var today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  function todayPart(type) { return today.find(function (part) { return part.type === type; }).value; }
  var selected = todayPart('year') + '-' + todayPart('month') + '-' + todayPart('day');
  var year = Number(todayPart('year'));
  var month = Number(todayPart('month')) - 1;
  var todayKey = selected;
  var selectedDoctor = '';
  var doctorFilters = document.querySelector('[data-doctor-legend]');
  var monthTitle = document.querySelector('[data-calendar-month]');
  var body = document.querySelector('[data-calendar-body]');
  var dayTitle = document.querySelector('[data-selected-date]');
  var dayList = document.querySelector('[data-day-schedules]');
  var weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  function make(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function dateKey(day) { return year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0'); }
  function doctorById(id) { return doctors.find(function (doctor) { return doctor.id === id; }); }
  function colorClass(doctor) {
    var color = doctor && ['blue', 'amber', 'teal', 'purple'].includes(doctor.color) ? doctor.color : 'blue';
    return 'doctor-' + color;
  }
  function entries(date) {
    var parts = date.split('-').map(Number);
    var weekday = new Date(parts[0], parts[1] - 1, parts[2]).getDay();
    var specific = schedules.filter(function (entry) { return entry.date === date; });
    var weekly = doctors.filter(function (doctor) {
      return (doctor.weekdays || []).includes(weekday) &&
        !specific.some(function (entry) { return entry.doctorId === doctor.id; });
    }).map(function (doctor) {
      var morning = (doctor.morningOnly || []).includes(weekday);
      return {
        doctorId: doctor.id, date: date, title: '진료 일정 (샘플)',
        time: morning ? '오전 진료만' : '종일 진료', period: morning ? 'morning' : 'full'
      };
    });
    return weekly.concat(specific).filter(function (entry) {
      return !selectedDoctor || entry.doctorId === selectedDoctor;
    });
  }
  var allDoctorsButton = make('button', 'doctor-legend-item doctor-filter-all', '전체원장');
  allDoctorsButton.type = 'button';
  allDoctorsButton.setAttribute('data-doctor-id', '');
  allDoctorsButton.setAttribute('aria-pressed', 'true');
  doctorFilters.appendChild(allDoctorsButton);
  doctors.forEach(function (doctor) {
    var legend = make('button', 'doctor-legend-item ' + colorClass(doctor));
    legend.type = 'button';
    legend.setAttribute('data-doctor-id', doctor.id);
    legend.setAttribute('aria-pressed', 'false');
    var dot = make('span', 'doctor-initial ' + colorClass(doctor), doctor.initial || '');
    dot.setAttribute('aria-hidden', 'true');
    legend.append(dot, make('span', '', doctor.name));
    doctorFilters.appendChild(legend);
  });
  function renderDay() {
    var parts = selected.split('-').map(Number);
    var weekday = weekdays[new Date(parts[0], parts[1] - 1, parts[2]).getDay()];
    dayTitle.textContent = parts[1] + '월 ' + parts[2] + '일 (' + weekday + ')';
    var holidayInfo = document.querySelector('[data-selected-holiday]');
    holidayInfo.textContent = holidays.dates[selected] || '';
    holidayInfo.hidden = !holidayInfo.textContent;
    dayList.replaceChildren();
    var list = entries(selected);
    if (!list.length) {
      dayList.appendChild(make('p', 'schedule-empty', '등록된 일정이 없습니다. 일정 미등록은 휴진을 의미하지 않습니다.'));
      return;
    }
    list.forEach(function (entry) {
      var doctor = doctorById(entry.doctorId);
      var card = make('article', 'schedule-entry');
      card.appendChild(make('h4', 'schedule-doctor-name ' + colorClass(doctor), doctor ? doctor.name : '원장 정보 확인 중'));
      // 동작이 없는 상태 표시이므로 실제 버튼 대신 버튼 모양의 라벨로 표시합니다.
      card.appendChild(make('span', 'work-period ' + (entry.period === 'morning' ? 'work-morning' : 'work-full'),
        entry.period === 'morning' ? '오전' : '종일'));
      dayList.appendChild(card);
    });
  }
  function renderCalendar() {
    monthTitle.textContent = year + '년 ' + (month + 1) + '월';
    document.querySelector('[data-calendar-footnote]').textContent = holidays.years.includes(year)
      ? '※ 공휴일은 2026~2027년 확인 자료 기준입니다. 원장 근무는 예시이며 실제 휴진 여부는 별도 확인이 필요합니다.'
      : '※ 해당 연도의 공휴일 정보는 준비 중입니다. 원장 근무는 예시입니다.';
    body.replaceChildren();
    var firstDay = new Date(year, month, 1).getDay();
    var days = new Date(year, month + 1, 0).getDate();
    var cells = Math.ceil((firstDay + days) / 7) * 7;
    var row;
    for (var index = 0; index < cells; index += 1) {
      if (index % 7 === 0) { row = make('tr'); body.appendChild(row); }
      var cell = make('td');
      row.appendChild(cell);
      var day = index - firstDay + 1;
      if (day < 1 || day > days) {
        var adjacent = make('span', 'calendar-day calendar-outside', String(new Date(year, month, day).getDate()));
        adjacent.setAttribute('aria-hidden', 'true');
        cell.appendChild(adjacent);
        continue;
      }
      var key = dateKey(day);
      var holidayName = holidays.dates[key] || '';
      var count = entries(key).length;
      var button = make('button', 'calendar-day' + (holidayName ? ' has-holiday' : ''));
      button.type = 'button';
      button.dataset.date = key;
      button.setAttribute('aria-pressed', String(key === selected));
      var description = entries(key).map(function (entry) {
        var doctor = doctorById(entry.doctorId);
        return (doctor ? doctor.name : '원장') + ' ' + entry.time;
      }).join(', ');
      button.setAttribute('aria-label', key + ', ' + (holidayName ? holidayName + ', ' : '') + (count ? description : '등록된 일정 없음'));
      if (key === todayKey) {
        button.setAttribute('aria-current', 'date');
        button.setAttribute('aria-label', '오늘, ' + button.getAttribute('aria-label'));
        button.appendChild(make('span', 'calendar-today-label', '오늘'));
      }
      button.appendChild(make('span', 'calendar-number', String(day)));
      var markers = make('span', 'calendar-markers');
      markers.setAttribute('aria-hidden', 'true');
      doctors.forEach(function (doctor) {
        var entry = entries(key).find(function (item) { return item.doctorId === doctor.id; });
        if (entry) {
          var dot = make('span', 'doctor-initial ' + colorClass(doctor) + (entry.period === 'morning' ? ' initial-morning' : ''), doctor.initial || '');
          dot.title = doctor.name + ' · ' + entry.time;
          markers.appendChild(dot);
        }
      });
      button.appendChild(markers);
      if (holidayName) {
        var shortName = holidayName.startsWith('대체공휴일') ? '대체공휴일' :
          holidayName === '전국동시지방선거' ? '지방선거' : holidayName;
        var label = make('span', 'calendar-holiday-label', shortName);
        label.title = holidayName;
        button.appendChild(label);
      }
      cell.appendChild(button);
    }
    renderDay();
  }
  body.addEventListener('click', function (event) {
    var button = event.target.closest('[data-date]');
    if (!button) return;
    selected = button.dataset.date;
    renderCalendar();
    body.querySelector('[data-date="' + selected + '"]').focus({ preventScroll: true });
  });
  document.querySelectorAll('[data-month-step]').forEach(function (button) {
    button.addEventListener('click', function () {
      var next = new Date(year, month + Number(button.getAttribute('data-month-step')), 1);
      year = next.getFullYear();
      month = next.getMonth();
      selected = dateKey(1);
      renderCalendar();
    });
  });
  doctorFilters.addEventListener('click', function (event) {
    var button = event.target.closest('[data-doctor-id]');
    if (!button || !doctorFilters.contains(button)) return;
    selectedDoctor = button.getAttribute('data-doctor-id');
    doctorFilters.querySelectorAll('[data-doctor-id]').forEach(function (item) {
      item.setAttribute('aria-pressed', String(item === button));
    });
    renderCalendar();
  });
  renderCalendar();

  var noticeList = document.querySelector('[data-notice-list]');
  noticeList.replaceChildren();
  if (!notices.length) noticeList.appendChild(make('p', 'schedule-empty', '등록된 공지사항이 없습니다.'));
  notices.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).forEach(function (notice) {
    var item = make('details', 'notice-item');
    var summary = make('summary');
    summary.appendChild(make('span', 'notice-item-title', notice.title));
    var date = make('time', '', notice.date.replaceAll('-', '.'));
    date.dateTime = notice.date;
    summary.appendChild(date);
    summary.appendChild(make('span', 'notice-expand', '+'));
    item.appendChild(summary);
    item.appendChild(make('p', 'notice-content', notice.content));
    noticeList.appendChild(item);
  });
}());
