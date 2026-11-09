(function () {
  'use strict';
  var cards = Array.from(document.querySelectorAll('[data-about-doctors] [data-doctor-name]'));
  var weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  function normalizedName(name) { return String(name || '').replace(/\s*원장\s*$/, '').trim(); }
  function make(tag, text) { var node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node; }
  function mergeAdjacentCells(table) {
    table.querySelectorAll('tbody tr').forEach(function (tr) {
      var previous = null;
      Array.from(tr.children).filter(function (node) { return node.tagName === 'TD'; }).forEach(function (cell) {
        var text = cell.textContent.trim();
        if (previous && text && text !== '—' && previous.textContent.trim() === text) {
          if (previous.getAttribute('aria-label') !== cell.getAttribute('aria-label')) previous.removeAttribute('aria-label');
          previous.colSpan += cell.colSpan; cell.remove();
        } else previous = cell;
      });
    });
    return table;
  }
  function makeTable(rows, name) {
    var table = make('table'); table.className = 'about-schedule-table';
    var caption = make('caption', name + ' 원장 정기 진료일정'); caption.className = 'visually-hidden'; table.appendChild(caption);
    var head = make('thead'), header = make('tr'); header.appendChild(make('th', '구분'));
    [1, 2, 3, 4, 5, 6].forEach(function (day) { var cell = make('th', weekdays[day]); cell.scope = 'col'; header.appendChild(cell); });
    head.appendChild(header); table.appendChild(head);
    var body = make('tbody');
    var periods = name === '심종우' ? ['오전', '오후'] : name === '이정진' ? ['오전'] : ['종일'];
    periods.forEach(function (period, index) {
      var tr = make('tr'), heading = make('th', period); heading.scope = 'row'; tr.appendChild(heading);
      [1, 2, 3, 4, 5, 6].forEach(function (day) {
        if (name === '정진호' && day <= 5) {
          if (day === 1) { var external = make('td', '제주대병원 외래/수술'); external.colSpan = 5; external.className = 'about-external-schedule'; tr.appendChild(external); }
          return;
        }
        var row = rows.find(function (item) { return Number(item.weekday) === day; });
        var cell = make('td');
        if (name === '최한솔' && day === 6) { cell.textContent = 'X'; cell.setAttribute('aria-label', '토요일 진료 없음'); }
        else if ((name === '이택관' && [1, 2].includes(day)) || (name === '최한솔' && day <= 5) || (name === '심종우' && period === '오후' && [4, 5, 6].includes(day))) { cell.textContent = '○'; }
        else if (name === '심종우' && day === 3) { cell.textContent = index === 0 ? '수술' : 'X'; }
        else if (!row || (period === '오후' && row.period === 'morning')) { cell.textContent = '—'; cell.setAttribute('aria-label', row ? '오후 정기 진료 없음' : '정기 일정 미등록'); }
        else {
          var end = (row.end_time || (day === 6 ? '17:00' : '19:00')).slice(0, 5);
          cell.textContent = period === '오전' ? '○' : day === 6 && end === '17:00' && row.period === 'full' ? '○' : period === '오후' ? (end === '17:00' ? '~5시' : '~7시') : row.period === 'morning' ? '오전' : end === '17:00' ? '~5시' : '종일';
          if (day === 6 && ['first_third', 'second_fourth'].includes(row.saturday_weeks)) {
            var small = make('small', row.saturday_weeks === 'first_third' ? '1·3주' : '2·4주'); cell.appendChild(small);
          }
        }
        tr.appendChild(cell);
      });
      body.appendChild(tr);
    });
    table.appendChild(body); return mergeAdjacentCells(table);
  }
  window.makeDefaultAboutScheduleTable = makeTable;
  if (!cards.length) return;
  function savedTable(schedule, name) {
    if (!schedule || !Array.isArray(schedule.rows) || !schedule.rows.length || schedule.rows.length > 4 || schedule.rows.some(function (row) { return !row || typeof row.label !== 'string' || !Array.isArray(row.cells) || row.cells.length !== 6 || row.cells.some(function (cell) { return typeof cell !== 'string'; }); })) return null;
    var table = makeTable([], name), body = table.querySelector('tbody');
    body.replaceChildren();
    schedule.rows.forEach(function (row) {
      var tr = make('tr'), th = make('th', row.label); th.scope = 'row'; tr.appendChild(th);
      var merges = [];
      if (Array.isArray(row.merges)) {
        row.merges.forEach(function (pair) {
          if (Array.isArray(pair) && pair.length === 2 && Number.isInteger(pair[0]) && Number.isInteger(pair[1]) && pair[0] >= 0 && pair[1] < 6 && pair[1] > pair[0] && !merges.some(function (item) { return item[0] <= pair[1] && item[1] >= pair[0]; })) merges.push(pair);
        });
      } else {
        for (var start = 0; start < 6;) {
          var end = start;
          while (end + 1 < 6 && row.cells[start].trim() && row.cells[start].trim() !== '—' && row.cells[end + 1].trim() === row.cells[start].trim()) end++;
          if (end > start) merges.push([start, end]);
          start = end + 1;
        }
      }
      for (var i = 0; i < 6; i++) {
        var cell = make('td', row.cells[i] || '—');
        var merged = merges.find(function (pair) { return pair[0] === i; });
        if (merged) { cell.colSpan = merged[1] - merged[0] + 1; i = merged[1]; }
        tr.appendChild(cell);
      }
      body.appendChild(tr);
    });
    return table;
  }
  async function load() {
    try {
      if (window.aboutProfilesReady) await window.aboutProfilesReady;
      cards = Array.from(document.querySelectorAll('[data-about-doctors] [data-doctor-name]'));
      var results = await Promise.all([window.loadDoctorScheduleData(), window.supabaseClient.from('doctor_about_schedules').select('doctor_id,schedule,is_visible')]);
      var data = results[0], custom = results[1];
      if (custom.error) throw custom.error;
      cards.forEach(function (card) {
        var root = card.querySelector('[data-doctor-schedule]');
        var matches = data.doctors.filter(function (doctor) { return normalizedName(doctor.name) === card.dataset.doctorName; });
        root.replaceChildren();
        if (matches.length !== 1) { root.textContent = '원장 정기 일정을 확인해 주세요.'; return; }
        var rows = (matches[0].weeklySchedules || []).slice().sort(function (a, b) { return Number(a.weekday) - Number(b.weekday); });
        var saved = custom.data.find(function (item) { return String(item.doctor_id) === matches[0].id; });
        var scheduleSection = root.closest('section');
        if (saved && !saved.is_visible) { if (scheduleSection) scheduleSection.hidden = true; return; }
        if (scheduleSection) scheduleSection.hidden = false;
        if (!rows.length && !saved && card.dataset.doctorName !== '정진호') { root.textContent = '등록된 정기 일정이 없습니다.'; return; }
        var start = document.createElement('p');
        start.className = 'about-schedule-start';
        start.textContent = '진료 시작 오전 8:30';
        root.appendChild(start);
        root.appendChild(saved ? savedTable(saved.schedule, card.dataset.doctorName) || makeTable(rows, card.dataset.doctorName) : makeTable(rows, card.dataset.doctorName));
        var legend = make('p', '○ (병원 운영시간 진료함)　 X (진료 없음)'); legend.className = 'about-table-legend'; root.appendChild(legend);
      });
    } catch (error) {
      cards.forEach(function (card) { card.querySelector('[data-doctor-schedule]').textContent = '정기 일정을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.'; });
    }
  }
  load();
}());
