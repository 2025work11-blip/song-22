// 관리 화면 미리보기 전용입니다. DB 쓰기·인증 권한·RLS는 변경하지 않습니다.
// 새로고침하면 편집 내용은 사라지며 사용자 화면에는 반영되지 않습니다.
(function () {
  'use strict';
  var main = document.querySelector('.admin-main');
  if (!main) return;
  var state = {}, sources = {}, activeEditor = null, draftNumber = 0;
  var dialog = document.querySelector('[data-admin-editor]');
  var form = document.querySelector('[data-admin-form]');
  var fieldsRoot = document.querySelector('[data-admin-fields]');
  var status = document.querySelector('[data-admin-status]');
  var topicFilter = document.querySelector('[data-admin-disease-filter]');
  var home = window.homeData || {};
  var topics = window.diseaseData || {};
  var config = window.siteConfig || {};
  var weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  var sectionOptions = { overview: '기본 정보', outpatient: '외래 안내', beforeSurgery: '수술 전 안내', afterSurgery: '수술 후 안내' };
  function field(key, label, type, options, optional) { return { key: key, label: label, type: type || 'text', options: options, optional: optional }; }
  function doctorOptions() { return Object.fromEntries((state.doctors || []).map(function (d) { return [d.id, d.name]; })); }
  var definitions = {
    doctors: { group: 'schedule', title: '원장 정보', table: 'doctors', fields: [field('name', '원장 이름'), field('initial', '표시 문자'), field('color', '구분 색상', 'select', { blue: '파랑', amber: '주황', teal: '청록', purple: '보라' })] },
    weekly: { group: 'schedule', title: '정기 진료 일정', table: 'doctor_weekly_schedules', fields: [field('doctor_id', '원장', 'select', doctorOptions), field('weekday', '진료 요일', 'select', Object.fromEntries(weekdays.map(function (d, i) { return [i, d + '요일']; }))), field('period', '근무 구분', 'select', { morning: '오전', full: '종일' })] },
    dates: { group: 'schedule', title: '날짜별 변경 일정', table: 'doctor_date_schedules', fields: [field('doctor_id', '원장', 'select', doctorOptions), field('schedule_date', '적용 날짜', 'date'), field('period', '근무 구분', 'select', { morning: '오전', full: '종일' })] },
    closures: { group: 'schedule', title: '휴진 기간', table: 'doctor_closures', fields: [field('doctor_id', '원장', 'select', doctorOptions), field('start_date', '시작일', 'date'), field('end_date', '종료일', 'date')] },
    notices: { group: 'notices', title: '공지 목록', table: 'notices', fields: [field('notice_date', '날짜', 'date'), field('title', '제목'), field('content', '내용', 'textarea'), field('image_url', '이미지 주소', 'url', null, true)] },
    hours: { group: 'hospital', title: '병원 진료시간', fixed: true, fields: [field('label', '요일 / 구분'), field('start', '시작 시간', 'time'), field('end', '종료 시간', 'time')] },
    bios: { group: 'hospital', title: '원장소개', fields: [field('title', '제목'), field('text', '소개 내용', 'textarea')] },
    equipment: { group: 'hospital', title: '장비소개', fields: [field('title', '장비명 / 제목'), field('text', '설명', 'textarea')] },
    topicSummaries: { group: 'diseases', title: '분야별 소개', fixed: true, fields: [field('category', '분야', 'select', function () { return Object.fromEntries(Object.keys(topics).map(function (k) { return [k, topics[k].title]; })); }), field('summary', '소개 문구', 'textarea')] },
    articles: { group: 'diseases', title: '상세 안내', fields: [field('category', '분야', 'select', function () { return Object.fromEntries(Object.keys(topics).map(function (k) { return [k, topics[k].title]; })); }), field('section', '안내 구분', 'select', sectionOptions), field('title', '소제목'), field('text', '안내 내용', 'textarea')] },
    settings: { group: 'settings', title: '기본 정보와 연결 주소', fixed: true, fields: [field('name', '병원명'), field('logo', '로고 주소'), field('kakao', '카카오상담 주소', 'url'), field('booking', '네이버예약 주소', 'url'), field('shareImage', '공유 이미지 주소')] }
  };
  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function options(f) { return typeof f.options === 'function' ? f.options() : f.options || {}; }
  function valueLabel(f, row) { return f.type === 'select' ? options(f)[row[f.key]] || '원장 정보 확인 필요' : row[f.key] || '—'; }
  function initialData() {
    state.doctors = (home.doctors || []).map(function (d) { return { id: d.id, name: d.name, initial: d.initial, color: d.color }; });
    state.weekly = (home.doctors || []).flatMap(function (d) { return d.weekdays.map(function (day) { return { id: 'sample-' + d.id + day, doctor_id: d.id, weekday: day, period: d.morningOnly.includes(day) ? 'morning' : 'full' }; }); });
    state.dates = [];
    state.closures = (home.closures || []).map(function (c, i) { var d = state.doctors.find(function (item) { return item.name === c.doctorName; }); return { id: 'sample-' + i, doctor_id: d ? d.id : '', start_date: c.startDate, end_date: c.endDate }; });
    state.notices = (home.notices || []).map(function (n) { return { id: n.id, title: n.title, content: n.content, notice_date: n.date, image_url: '' }; });
    state.hours = [
      { id: 'weekday', label: '월 ~ 금요일', start: '08:30', end: '19:00' }, { id: 'saturday', label: '토요일', start: '08:30', end: '17:00' },
      { id: 'holiday', label: '공휴일 · 오전진료', start: '08:30', end: '13:00' }, { id: 'lunch', label: '점심시간', start: '12:30', end: '14:00' }
    ];
    state.bios = [{ id: 'greeting', title: '원장 인사말', text: '원장 이름과 인사말을 소개할 영역입니다. AA안과에서 확인한 내용을 반영할 예정입니다.' }, { id: 'career', title: '주요 약력 및 진료 분야', text: '원장의 주요 약력과 진료 분야를 안내할 영역입니다. 실제 경력과 자격 정보는 확인 후 등록합니다.' }];
    state.equipment = [{ id: 'equipment', title: '진료 장비 안내 준비 중', text: '장비명과 용도를 소개할 영역입니다. AA안과의 실제 보유 장비를 확인한 뒤 설명을 반영합니다.' }];
    state.topicSummaries = []; state.articles = [];
    Object.keys(topics).forEach(function (key) {
      state.topicSummaries.push({ id: key, category: key, summary: topics[key].summary });
      Object.keys(sectionOptions).forEach(function (section) { (topics[key][section] || []).forEach(function (item, i) { state.articles.push({ id: key + section + i, category: key, section: section, title: item.title, text: item.text }); }); });
      var option = make('option', '', topics[key].title); option.value = key; topicFilter.appendChild(option);
    });
    state.settings = [{ id: 'site', name: 'AA안과', logo: 'assets/logo.svg', kakao: config.kakaoChannelUrl, booking: config.naverBookingUrl, shareImage: 'assets/share-preview.png' }];
    Object.keys(definitions).forEach(function (key) { sources[key] = definitions[key].table ? '기존 예시 · DB 확인 중' : '현재 홈페이지 자료 · 저장 연결 전'; });
  }
  function render() {
    document.querySelectorAll('[data-admin-group]').forEach(function (root) { root.replaceChildren(); });
    Object.keys(definitions).forEach(function (key) {
      var def = definitions[key];
      var root = document.querySelector('[data-admin-group="' + def.group + '"]');
      var card = make('article', 'admin-card');
      var heading = make('div', 'admin-card-heading');
      var title = make('div'); title.append(make('h3', '', def.title), make('p', 'admin-source', sources[key])); heading.appendChild(title);
      if (!def.fixed) { var add = make('button', 'admin-button', '새 항목'); add.type = 'button'; add.dataset.adminEdit = key; heading.appendChild(add); }
      card.appendChild(heading);
      var rows = state[key].filter(function (row) { return def.group !== 'diseases' || row.category === topicFilter.value; });
      if (!rows.length) card.appendChild(make('p', 'admin-empty', '등록된 항목이 없습니다.'));
      else {
        var scroll = make('div', 'admin-table-scroll'); var table = make('table', 'admin-table');
        var caption = make('caption', 'visually-hidden', def.title); table.appendChild(caption);
        var head = make('thead'), headRow = make('tr');
        def.fields.forEach(function (f) { var th = make('th', '', f.label); th.scope = 'col'; headRow.appendChild(th); });
        var actions = make('th', '', '작업'); actions.scope = 'col'; headRow.appendChild(actions); head.appendChild(headRow); table.appendChild(head);
        var body = make('tbody');
        rows.forEach(function (row) {
          var tr = make('tr');
          def.fields.forEach(function (f) { var td = make('td'); td.appendChild(make('span', 'admin-cell-text', valueLabel(f, row))); tr.appendChild(td); });
          var td = make('td'), edit = make('button', 'admin-button', '편집'); edit.type = 'button'; edit.dataset.adminEdit = key; edit.dataset.rowId = String(row.id); edit.setAttribute('aria-label', def.title + ' ' + (row.name || row.title || row.notice_date || row.id) + ' 편집'); td.appendChild(edit); tr.appendChild(td); body.appendChild(tr);
        });
        table.appendChild(body); scroll.appendChild(table); card.appendChild(scroll);
      }
      root.appendChild(card);
    });
  }
  async function readTable(table) {
    if (!window.supabaseClient) throw new Error('DB 연결 없음');
    var rows = [];
    while (true) {
      var result = await window.supabaseClient.from(table).select('*').order('id').range(rows.length, rows.length + 999);
      if (result.error) throw result.error;
      if (!Array.isArray(result.data)) throw new Error('조회 결과 없음');
      rows = rows.concat(result.data);
      if (result.data.length < 1000) return rows;
    }
  }
  async function loadPublicData() {
    var keys = Object.keys(definitions).filter(function (key) { return definitions[key].table; });
    var results = await Promise.allSettled(keys.map(function (key) { return readTable(definitions[key].table); }));
    var failed = 0;
    keys.forEach(function (key, i) {
      if (results[i].status === 'fulfilled') {
        state[key] = results[i].value.map(function (row) { return Object.assign({}, row, { id: String(row.id), doctor_id: row.doctor_id === undefined ? undefined : String(row.doctor_id) }); });
        sources[key] = 'DB 조회 자료 · 편집은 현재 화면에만 적용';
      } else { failed++; sources[key] = '기존 예시 · DB 조회 불가 · 저장 연결 전'; }
    });
    // DB 원장 번호가 예시와 다를 때 조회 실패한 일정 예시도 이름을 기준으로 맞춥니다.
    ['weekly', 'dates', 'closures'].forEach(function (key) {
      if (!sources[key].startsWith('기존 예시')) return;
      state[key].forEach(function (row) { var original = (home.doctors || []).find(function (d) { return d.id === row.doctor_id; }); var current = original && state.doctors.find(function (d) { return d.name === original.name; }); if (current) row.doctor_id = current.id; });
    });
    status.textContent = failed ? '일부 공용 데이터는 조회되지 않아 기존 예시로 표시했습니다. 각 목록의 출처를 확인하세요.' : '공용 데이터 조회를 완료했습니다. 편집 내용은 DB에 저장되지 않습니다.';
    render();
  }
  function showMenu() {
    var menu = window.location.hash.slice(1);
    if (!['schedule', 'notices', 'hospital', 'diseases', 'settings'].includes(menu)) menu = 'schedule';
    document.querySelectorAll('[data-admin-panel]').forEach(function (panel) { panel.hidden = panel.dataset.adminPanel !== menu; });
    document.querySelectorAll('[data-admin-menu]').forEach(function (link) { if (link.dataset.adminMenu === menu) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
  }
  function openEditor(key, id) {
    var def = definitions[key], row = state[key].find(function (item) { return String(item.id) === id; });
    activeEditor = { key: key, id: row ? String(row.id) : null };
    document.querySelector('#admin-editor-title').textContent = def.title + (row ? ' 편집' : ' 추가');
    document.querySelector('[data-admin-error]').hidden = true;
    document.querySelector('[data-admin-delete]').hidden = !row || def.fixed;
    fieldsRoot.replaceChildren();
    def.fields.forEach(function (f) {
      var label = make('label', '', f.label + (f.optional ? ' (선택)' : ''));
      var input = make(f.type === 'textarea' ? 'textarea' : f.type === 'select' ? 'select' : 'input');
      input.name = f.key; input.required = !f.optional;
      if (f.type === 'select') Object.keys(options(f)).forEach(function (value) { var option = make('option', '', options(f)[value]); option.value = value; input.appendChild(option); });
      else if (f.type !== 'textarea') input.type = f.type;
      if (row) input.value = row[f.key] === undefined ? '' : row[f.key];
      else if (f.key === 'category') input.value = topicFilter.value;
      label.appendChild(input); fieldsRoot.appendChild(label);
    });
    dialog.showModal();
  }
  main.addEventListener('click', function (event) { var button = event.target.closest('[data-admin-edit]'); if (button) openEditor(button.dataset.adminEdit, button.dataset.rowId); });
  document.querySelectorAll('[data-admin-close]').forEach(function (button) { button.addEventListener('click', function () { dialog.close(); }); });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!activeEditor || !form.reportValidity()) return;
    var key = activeEditor.key, def = definitions[key], values = {};
    var error = document.querySelector('[data-admin-error]');
    def.fields.forEach(function (f) { values[f.key] = form.elements.namedItem(f.key).value.trim(); });
    if ((key === 'closures' && values.end_date < values.start_date) || (key === 'hours' && values.end <= values.start)) { error.textContent = '종료일 또는 종료 시간은 시작보다 빠를 수 없습니다.'; error.hidden = false; return; }
    if (key === 'notices' && values.image_url && !values.image_url.startsWith('https://')) { error.textContent = '이미지 주소는 https://로 시작해야 합니다.'; error.hidden = false; return; }
    var uniqueFields = key === 'weekly' ? ['doctor_id', 'weekday'] : key === 'dates' ? ['doctor_id', 'schedule_date'] : key === 'closures' ? ['doctor_id', 'start_date', 'end_date'] : [];
    if (uniqueFields.length && state[key].some(function (row) { return String(row.id) !== activeEditor.id && uniqueFields.every(function (f) { return String(row[f]) === values[f]; }); })) { error.textContent = '동일한 원장과 일정이 이미 있습니다.'; error.hidden = false; return; }
    var index = state[key].findIndex(function (row) { return String(row.id) === activeEditor.id; });
    values.id = activeEditor.id || 'draft-' + (++draftNumber);
    if (index >= 0) state[key][index] = values; else state[key].push(values);
    sources[key] = '화면에서 변경됨 · DB에 저장되지 않음';
    dialog.close(); render(); status.textContent = '변경 내용을 미리보기에 적용했습니다. 사용자 홈페이지와 DB는 변경되지 않았습니다.';
  });
  document.querySelector('[data-admin-delete]').addEventListener('click', function () {
    if (!activeEditor || definitions[activeEditor.key].fixed) return;
    if (!window.confirm('현재 미리보기 목록에서만 제거할까요? DB와 사용자 화면은 변경되지 않습니다.')) return;
    var key = activeEditor.key;
    if (key === 'doctors' && ['weekly', 'dates', 'closures'].some(function (kind) { return state[kind].some(function (row) { return String(row.doctor_id) === activeEditor.id; }); })) { var error = document.querySelector('[data-admin-error]'); error.textContent = '이 원장의 일정이 있습니다. 연결된 일정을 먼저 제거해 주세요.'; error.hidden = false; return; }
    state[key] = state[key].filter(function (row) { return String(row.id) !== activeEditor.id; });
    sources[key] = '화면에서 변경됨 · DB에 저장되지 않음'; dialog.close(); render(); status.textContent = '미리보기에서만 제거했습니다. DB에서는 삭제되지 않았습니다.';
  });
  topicFilter.addEventListener('change', render);
  window.addEventListener('hashchange', showMenu);
  initialData(); render(); showMenu();
  // DB 조회가 끝나기 전 편집으로 인한 덮어쓰기를 방지합니다.
  main.inert = true;
  loadPublicData().finally(function () { main.inert = false; });
}());
