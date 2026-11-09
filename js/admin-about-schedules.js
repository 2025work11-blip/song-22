(async function () {
  'use strict';
  var root = document.querySelector('[data-admin-doctor-profiles]');
  if (!root || !window.roleAccess || !await window.roleAccess.requireAdmin()) return;
  var savedRows = [], doctors = [], ready = false, failed = false;
  function make(tag, text) { var node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node; }
  function defaults(doctor) {
    var name = doctor.name.replace(/\s*원장\s*$/, '').trim();
    var table = window.makeDefaultAboutScheduleTable(doctor.weeklySchedules || [], name);
    return { rows: Array.from(table.querySelectorAll('tbody tr')).map(function (tr) {
      var cells = [];
      Array.from(tr.querySelectorAll('td')).forEach(function (td) { for (var i = 0; i < td.colSpan; i++) cells.push(td.textContent.trim()); });
      return { label: tr.querySelector('th').textContent.trim(), cells: cells };
    }) };
  }
  function draw(doctor, data, container) {
    var section = make('div'); section.className = 'admin-about-schedule-editor';
    section.appendChild(make('h4', '진료일정표'));
    var hint = make('p', '표에 표시할 내용을 직접 입력하세요. 예: ○, X, 오전, 수술, ~5시, ○ (1·3주)'); section.appendChild(hint);
    var addRow = make('button', '행 추가'); addRow.type = 'button'; addRow.className = 'admin-button'; section.appendChild(addRow);
    var fields = make('div'); fields.className = 'admin-about-schedule-fields'; section.appendChild(fields);
    var result = make('p'); result.setAttribute('role', 'status'); section.appendChild(result);
    var actions = make('div'); actions.className = 'admin-about-schedule-actions';
    var deleteItem = make('button', '진료표 삭제'); deleteItem.type = 'button'; deleteItem.className = 'admin-button admin-danger';
    var save = make('button', '표 저장'); save.type = 'button'; save.className = 'admin-button admin-primary';
    actions.append(deleteItem, save); section.appendChild(actions);
    var rows = data.rows.map(function (row) { return { label: row.label, cells: row.cells.slice() }; });
    function renderRows() {
      fields.replaceChildren();
      rows.forEach(function (row, index) {
        var wrapper = make('div'); wrapper.className = 'admin-about-schedule-row-wrap';
        var block = make('div'); block.className = 'admin-about-schedule-row';
        ['구분', '월', '화', '수', '목', '금', '토'].forEach(function (day, i) {
          var item = make('label', day), input = make('input'); input.type = 'text'; input.maxLength = 40;
          input.value = i ? row.cells[i - 1] || '' : row.label;
          input.addEventListener('input', function () { if (i) rows[index].cells[i - 1] = input.value; else rows[index].label = input.value; });
          item.appendChild(input); block.appendChild(item);
        }); wrapper.appendChild(block);
        var remove = make('button', '이 행 삭제'); remove.type = 'button'; remove.className = 'admin-button admin-danger'; remove.disabled = rows.length === 1;
        remove.addEventListener('click', function () { rows.splice(index, 1); renderRows(); }); wrapper.appendChild(remove); fields.appendChild(wrapper);
      });
      addRow.disabled = rows.length >= 4;
    }
    section.addEventListener('keydown', function (event) { if (event.key === 'Enter' && event.target.tagName === 'INPUT') event.preventDefault(); });
    addRow.addEventListener('click', function () { if (rows.length < 4) { rows.push({ label: '', cells: ['', '', '', '', '', ''] }); renderRows(); } }); renderRows();
    save.addEventListener('click', async function () {
      if (!window.roleAccess.isAdmin()) { result.textContent = '관리자 권한을 확인해 주세요.'; return; }
      var payload = { rows: rows.map(function (row) { return { label: row.label.trim(), cells: row.cells.map(function (cell) { return cell.trim(); }) }; }) };
      save.disabled = true; result.textContent = '저장 중입니다.';
      try {
        var client = await window.adminStore.verifyDoctorWrite();
        var stored = { doctor_id: Number(doctor.id), schedule: payload, is_visible: true };
        var response = await client.from('doctor_about_schedules').upsert(stored).select('doctor_id').single();
        if (response.error || !response.data) throw response.error || new Error('저장 결과 없음');
        savedRows = savedRows.filter(function (item) { return String(item.doctor_id) !== String(doctor.id); }); savedRows.push(stored);
        result.textContent = '저장했습니다. 병원소개 페이지를 새로고침하면 반영됩니다.';
      } catch (error) { result.textContent = '저장하지 못했습니다. 관리자 권한과 연결 상태를 확인해 주세요.'; }
      finally { save.disabled = false; }
    });
    deleteItem.addEventListener('click', async function () {
      if (!window.roleAccess.isAdmin() || !window.confirm('이 원장의 병원소개 진료표를 삭제할까요? 메인 달력의 일정은 유지됩니다.')) return;
      var previous = savedRows.find(function (item) { return String(item.doctor_id) === String(doctor.id); });
      var stored = { doctor_id: Number(doctor.id), schedule: previous && previous.schedule || data, is_visible: false };
      save.disabled = deleteItem.disabled = true;
      try { var client = await window.adminStore.verifyDoctorWrite(); var response = await client.from('doctor_about_schedules').upsert(stored).select('doctor_id').single(); if (response.error || !response.data) throw response.error || new Error('삭제 결과 없음'); savedRows = savedRows.filter(function (item) { return String(item.doctor_id) !== String(doctor.id); }); savedRows.push(stored); showRestore(doctor, stored.schedule, container); }
      catch (error) { result.textContent = '삭제하지 못했습니다. 연결 상태와 관리자 권한을 확인해 주세요.'; save.disabled = deleteItem.disabled = false; }
    });
    container.replaceChildren(section);
  }
  function showRestore(doctor, data, container) {
    container.replaceChildren();
    var text = make('p', '이 원장의 병원소개 진료표가 삭제되었습니다.'), button = make('button', '진료표 다시 추가');
    button.type = 'button'; button.className = 'admin-button';
    button.addEventListener('click', function () { draw(doctor, data, container); });
    container.append(text, button);
  }
  function valid(value) { return value && Array.isArray(value.rows) && value.rows.length > 0 && value.rows.length <= 4 && !value.rows.some(function (row) { return !row || typeof row.label !== 'string' || !Array.isArray(row.cells) || row.cells.length !== 6 || row.cells.some(function (cell) { return typeof cell !== 'string'; }); }); }
  function mount(doctor, container) {
    if (!ready || !container || !container.isConnected) return;
    var current = doctors.find(function (item) { return String(item.id) === String(doctor.id); }) || doctor;
    var saved = savedRows.find(function (item) { return String(item.doctor_id) === String(current.id); });
    var value = saved && valid(saved.schedule) ? saved.schedule : defaults(current);
    if (saved && !saved.is_visible) showRestore(current, value, container); else draw(current, value, container);
  }
  document.addEventListener('admin-profile-added', function (event) { if (!event.detail) return; if (failed) event.detail.container.textContent = '진료표를 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요.'; else mount(event.detail.doctor, event.detail.container); });
  try {
    var result = await Promise.all([window.loadDoctorScheduleData(), window.supabaseClient.from('doctor_about_schedules').select('doctor_id,schedule,is_visible')]);
    if (result[1].error) throw result[1].error;
    savedRows = result[1].data;
    doctors = result[0].doctors; ready = true;
    root.querySelectorAll('[data-profile-schedule]').forEach(function (container) {
      var doctor = doctors.find(function (item) { return String(item.id) === container.dataset.profileSchedule; }) || container.profileDoctor;
      if (doctor) mount(doctor, container); else container.textContent = '원장 정보를 확인할 수 없습니다.';
    });
  } catch (error) { failed = true; root.querySelectorAll('[data-profile-schedule]').forEach(function (container) { container.textContent = '진료표를 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요.'; }); }
}());
