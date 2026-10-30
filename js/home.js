// 원장 일정은 Supabase에서 읽습니다. 공지사항 조회는 notices.js에서 처리합니다.
(function () {
  'use strict';
  var calendar = document.querySelector('[data-calendar]');
  if (!calendar) return;
  var doctors = [];
  var schedules = [];
  var scheduleState = 'loading';
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
  var closureOnly = false;
  var closures = [];
  var doctorFilters = document.querySelector('[data-doctor-legend]');
  var monthTitle = document.querySelector('[data-calendar-month]');
  var body = document.querySelector('[data-calendar-body]');
  var dayTitle = document.querySelector('[data-selected-date]');
  var dayList = document.querySelector('[data-day-schedules]');
  var weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  var labelFrame = null;
  function fitClosureLabels() {
    if (!window.requestAnimationFrame || labelFrame !== null) return;
    labelFrame = window.requestAnimationFrame(function () {
      labelFrame = null;
      // 같은 주의 날짜 박스 높이를 맞춘 뒤 실제 날짜 너비와 간격을 포함해 띠를 늘립니다.
      Array.from(body.children).forEach(function (row) {
        var buttons = Array.from(row.querySelectorAll('[data-date]'));
        if (!row.querySelector('[data-closure-band]')) return;
        buttons.forEach(function (button) { button.style.height = ''; });
        var height = Math.max.apply(null, buttons.map(function (button) { return button.getBoundingClientRect().height; }));
        buttons.forEach(function (button) { button.style.height = height + 'px'; });
      });
      body.querySelectorAll('[data-closure-band]').forEach(function (band) {
        var startButton = band.parentElement;
        var endButton = body.querySelector('[data-date="' + band.getAttribute('data-closure-end') + '"]');
        if (!endButton) return;
        var width = endButton.getBoundingClientRect().right - startButton.getBoundingClientRect().left
          - 6 - startButton.clientLeft - endButton.clientLeft;
        if (width > 0) band.style.width = width + 'px';
      });
      body.querySelectorAll('.closure-label').forEach(function (label) {
        label.style.fontSize = '11px';
        if (label.clientWidth > 0 && label.scrollWidth > label.clientWidth) {
          label.style.fontSize = (11 * label.clientWidth / label.scrollWidth * .96) + 'px';
        }
      });
    });
  }
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fitClosureLabels).observe(body);
  if (typeof MutationObserver !== 'undefined') new MutationObserver(fitClosureLabels)
    .observe(body, { childList: true, characterData: true, subtree: true });

  function make(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function dateKey(day) { return year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0'); }
  function closureLabel(closure, doctor) {
    var start = closure.startDate.split('-').map(Number);
    var end = closure.endDate.split('-').map(Number);
    var duration = Math.round((Date.UTC(end[0], end[1] - 1, end[2]) - Date.UTC(start[0], start[1] - 1, start[2])) / 86400000) + 1;
    if (duration === 1) return '(휴)' + doctor.name.replace(/원장$/, '');
    if (duration === 2) return '(휴)' + doctor.name;
    var from = (start[0] !== end[0] ? start[0] + '.' : '') + start[1] + '.' + start[2];
    var to = start[0] !== end[0] ? end[0] + '.' + end[1] + '.' + end[2]
      : start[1] !== end[1] ? end[1] + '.' + end[2] : String(end[2]);
    return '(휴)' + doctor.name + ' ' + from + '~' + to;
  }
  function doctorById(id) { return doctors.find(function (doctor) { return doctor.id === id; }); }
  function colorClass(doctor) {
    var color = doctor && ['blue', 'amber', 'teal', 'purple'].includes(doctor.color) ? doctor.color : 'blue';
    return 'doctor-' + color;
  }
  function monthClosures() {
    return closures.filter(function (closure) {
      return closure.startDate <= dateKey(new Date(year, month + 1, 0).getDate()) &&
        closure.endDate >= dateKey(1) && Boolean(doctorById(closure.doctorId));
    });
  }
  function closuresOn(date) {
    return closures.filter(function (closure) {
      var doctor = doctorById(closure.doctorId);
      return doctor && (!selectedDoctor || doctor.id === selectedDoctor) && closure.startDate <= date && closure.endDate >= date;
    });
  }
  function entries(date) {
    if (closureOnly) return [];
    var parts = date.split('-').map(Number);
    var weekday = new Date(parts[0], parts[1] - 1, parts[2]).getDay();
    var specific = schedules.filter(function (entry) { return entry.date === date; });
    var weekly = doctors.filter(function (doctor) {
      return (doctor.weekdays || []).includes(weekday) &&
        !specific.some(function (entry) { return entry.doctorId === doctor.id; });
    }).map(function (doctor) {
      var morning = (doctor.morningOnly || []).includes(weekday);
      return {
        doctorId: doctor.id, date: date,
        time: morning ? '오전 진료만' : '종일 진료', period: morning ? 'morning' : 'full'
      };
    });
    return weekly.concat(specific).filter(function (entry) {
      var doctor = doctorById(entry.doctorId);
      var closed = doctor && closures.some(function (closure) {
        return closure.doctorId === doctor.id && closure.startDate <= date && closure.endDate >= date;
      });
      return !closed && (!selectedDoctor || entry.doctorId === selectedDoctor);
    });
  }
  function renderDoctorFilters() {
    doctorFilters.replaceChildren();
    var allDoctorsButton = make('button', 'doctor-legend-item doctor-filter-all', '전체');
    allDoctorsButton.type = 'button';
    allDoctorsButton.setAttribute('data-doctor-id', '');
    allDoctorsButton.setAttribute('aria-pressed', String(!selectedDoctor && !closureOnly));
    doctorFilters.appendChild(allDoctorsButton);
    doctors.forEach(function (doctor) {
      var legend = make('button', 'doctor-legend-item ' + colorClass(doctor));
      legend.type = 'button';
      legend.setAttribute('data-doctor-id', doctor.id);
      legend.setAttribute('aria-pressed', String(selectedDoctor === doctor.id && !closureOnly));
      var dot = make('span', 'doctor-initial ' + colorClass(doctor), doctor.initial || '');
      dot.setAttribute('aria-hidden', 'true');
      legend.append(dot, make('span', '', doctor.name));
      doctorFilters.appendChild(legend);
    });
    if (monthClosures().length) {
      var closureButton = make('button', 'doctor-legend-item doctor-filter-closed', '휴진');
      closureButton.type = 'button';
      closureButton.setAttribute('data-closure-filter', '');
      closureButton.setAttribute('aria-pressed', String(closureOnly));
      doctorFilters.appendChild(closureButton);
    }
  }
  function renderDay() {
    var parts = selected.split('-').map(Number);
    var weekday = weekdays[new Date(parts[0], parts[1] - 1, parts[2]).getDay()];
    dayTitle.textContent = parts[1] + '월 ' + parts[2] + '일 (' + weekday + ')';
    var holidayInfo = document.querySelector('[data-selected-holiday]');
    var holidayName = holidays.dates[selected] || '';
    holidayInfo.replaceChildren();
    holidayInfo.hidden = !holidayName;
    if (holidayName) {
      holidayInfo.appendChild(make('span', '', holidayName));
      if (holidayName.includes('대체공휴일')) {
        var holidayHours = make('span', 'holiday-hours');
        holidayHours.append(make('span', '', '오전진료'), make('span', '', '오전 8:30 ~ 오후 1:00'));
        holidayInfo.appendChild(holidayHours);
      }
    }
    dayList.replaceChildren();
    if (scheduleState === 'loading') {
      dayList.appendChild(make('p', 'schedule-empty', '원장 일정을 불러오는 중입니다.'));
      return;
    }
    if (scheduleState === 'error') {
      dayList.appendChild(make('p', 'schedule-empty', '원장 일정을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.'));
      return;
    }
    if (!doctors.length) {
      dayList.appendChild(make('p', 'schedule-empty', '등록된 원장 정보가 없습니다.'));
      return;
    }
    var list = entries(selected);
    var closed = closuresOn(selected);
    closed.forEach(function (closure) {
      var card = make('article', 'schedule-entry');
      card.append(make('h4', 'schedule-doctor-name', closure.doctorName), make('span', 'work-period work-closed', '휴진'),
        make('p', 'closure-period-text', closure.startDate + ' ~ ' + closure.endDate));
      dayList.appendChild(card);
    });
    if (!list.length && !closed.length) {
      dayList.appendChild(make('p', 'schedule-empty', closureOnly ? '선택한 날짜에는 휴진 일정이 없습니다.' : '등록된 일정이 없습니다. 일정 미등록은 휴진을 의미하지 않습니다.'));
      return;
    }
    list.forEach(function (entry) {
      var doctor = doctorById(entry.doctorId);
      var card = make('article', 'schedule-entry');
      card.appendChild(make('h4', 'schedule-doctor-name ' + colorClass(doctor), doctor ? doctor.name : '원장 정보 확인 중'));
      // 동작이 없는 상태 표시이므로 실제 버튼 대신 버튼 모양의 라벨로 표시합니다.
      var morning = entry.period === 'morning' || Boolean(holidayName);
      var hours = morning ? '오전 8:30 ~ 오후 1:00'
        : parts.length && new Date(parts[0], parts[1] - 1, parts[2]).getDay() === 6
          ? '오전 8:30 ~ 오후 5:00' : '오전 8:30 ~ 오후 7:00';
      var period = make('div', 'schedule-period-row');
      period.append(make('span', 'work-period ' + (morning ? 'work-morning' : 'work-full'), morning ? '오전' : '종일'),
        make('span', 'schedule-work-hours', hours));
      card.appendChild(period);
      dayList.appendChild(card);
    });
  }
  function renderCalendar() {
    if (!monthClosures().length) closureOnly = false;
    renderDoctorFilters();
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
      var closedNames = closuresOn(key).map(function (closure) { return closure.doctorName + ' 휴진'; }).join(', ');
      if (closedNames) button.setAttribute('aria-label', button.getAttribute('aria-label') + ', ' + closedNames);
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
    // 휴진 띠 조각을 각 날짜 박스 하단 안쪽에 배치합니다.
    var dateRows = Array.from(body.children);
    dateRows.forEach(function (dateRow, week) {
      var weekStart = week * 7 - firstDay + 1;
      var lanes = [];
      monthClosures().forEach(function (closure) {
        var doctor = doctorById(closure.doctorId);
        if (selectedDoctor && doctor.id !== selectedDoctor) return;
        var closureStart = Math.round((new Date(closure.startDate + 'T00:00:00Z') - new Date(Date.UTC(year, month, 1))) / 86400000) + 1;
        var closureEnd = Math.round((new Date(closure.endDate + 'T00:00:00Z') - new Date(Date.UTC(year, month, 1))) / 86400000) + 1;
        var start = Math.max(weekStart, 1, closureStart);
        var end = Math.min(weekStart + 6, days, closureEnd);
        if (start > end) return;
        // 가장 긴 주간 구간 한 곳에만 이름을 표시합니다. 같은 길이는 앞 구간을 사용합니다.
        var labelWeek = 0, longest = 0;
        dateRows.forEach(function (_, candidateWeek) {
          var candidateStart = candidateWeek * 7 - firstDay + 1;
          var length = Math.min(candidateStart + 6, days, closureEnd) - Math.max(candidateStart, 1, closureStart) + 1;
          if (length > longest) { longest = length; labelWeek = candidateWeek; }
        });
        var slot = lanes.findIndex(function (lane) {
          return lane.every(function (segment) { return segment.end < start || segment.start > end; });
        });
        if (slot < 0) { slot = lanes.length; lanes.push([]); }
        lanes[slot].push({ start: start, end: end });
        for (var bandDay = start; bandDay <= end; bandDay++) {
          var dateButton = body.querySelector('[data-date="' + dateKey(bandDay) + '"]');
          var count = Math.max(Number(dateButton.getAttribute('data-closure-lanes') || 0), slot + 1);
          dateButton.setAttribute('data-closure-lanes', String(count));
          if (!dateButton.className.includes('has-closure')) dateButton.className += ' has-closure';
          dateButton.setAttribute('style', 'padding-bottom:' + (30 + (count - 1) * 24) + 'px');
        }
        var band = make('span', 'closure-range closure-start closure-end');
        band.setAttribute('data-closure-band', '');
        band.setAttribute('data-closure-end', dateKey(end));
        band.setAttribute('aria-hidden', 'true');
        band.setAttribute('style', 'bottom:' + (4 + slot * 24) + 'px;--closure-span:' + (end - start + 1));
        if (week === labelWeek) band.appendChild(make('span', 'closure-label', closureLabel(closure, doctor)));
        band.title = doctor.name + ' 휴진 · ' + closure.startDate + ' ~ ' + closure.endDate;
        body.querySelector('[data-date="' + dateKey(start) + '"]').appendChild(band);
      });
    });
    fitClosureLabels();
    renderDay();
  }
  body.addEventListener('click', function (event) {
    var button = event.target.closest('[data-date]');
    if (!button) return;
    var band = event.target.closest('[data-closure-band]');
    if (band && event.clientX) {
      var end = band.getAttribute('data-closure-end');
      var start = button.dataset.date;
      var hit = Array.from(body.querySelectorAll('[data-date]')).find(function (dateButton) {
        if (dateButton.dataset.date < start || dateButton.dataset.date > end) return false;
        var bounds = dateButton.getBoundingClientRect();
        return event.clientX >= bounds.left && event.clientX <= bounds.right;
      });
      if (hit) button = hit;
    }
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
    var button = event.target.closest('[data-doctor-id], [data-closure-filter]');
    if (!button || !doctorFilters.contains(button)) return;
    closureOnly = button.hasAttribute('data-closure-filter');
    selectedDoctor = closureOnly ? '' : button.getAttribute('data-doctor-id');
    renderCalendar();
    var filter = closureOnly ? '[data-closure-filter]' : '[data-doctor-id="' + selectedDoctor + '"]';
    doctorFilters.querySelector(filter).focus({ preventScroll: true });
  });
  renderDoctorFilters();
  renderCalendar();

  async function loadSchedules() {
    try {
      var result = await window.loadDoctorScheduleData();
      doctors = result.doctors;
      schedules = result.schedules;
      closures = result.closures || [];
      scheduleState = 'ready';
    } catch (error) {
      // 연결 실패를 예시 진료 일정으로 대체하지 않습니다.
      scheduleState = 'error';
    }
    selectedDoctor = '';
    renderDoctorFilters();
    renderCalendar();
  }
  loadSchedules();

}());
