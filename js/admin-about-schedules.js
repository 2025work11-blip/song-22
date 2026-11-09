(async function () {
  'use strict';
  var root = document.querySelector('[data-admin-about-schedules]');
  if (!root || !window.roleAccess || !await window.roleAccess.requireAdmin()) return;
  var shown = new Set(), savedRows = [], listStatus;
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
  function draw(doctor, data) {
    var details = make('details'); details.className = 'admin-weekly-group';
    var summary = make('summary', doctor.name); details.appendChild(summary);
    var section = make('div'); section.className = 'admin-about-schedule-editor';
    var hint = make('p', '표에 표시할 내용을 직접 입력하세요. 예: ○, X, 오전, 수술, ~5시, ○ (1·3주)'); section.appendChild(hint);
    var addRow = make('button', '행 추가'); addRow.type = 'button'; addRow.className = 'admin-button'; section.appendChild(addRow);
    var fields = make('div'); fields.className = 'admin-about-schedule-fields'; section.appendChild(fields);
    var result = make('p'); result.setAttribute('role', 'status'); section.appendChild(result);
    var save = make('button', '표 저장'); save.type = 'button'; save.className = 'admin-button admin-primary'; section.appendChild(save);
    var deleteItem = make('button', '항목 삭제'); deleteItem.type = 'button'; deleteItem.className = 'admin-button admin-danger'; section.appendChild(deleteItem);
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
      try { var client = await window.adminStore.verifyDoctorWrite(); var response = await client.from('doctor_about_schedules').upsert(stored).select('doctor_id').single(); if (response.error || !response.data) throw response.error || new Error('삭제 결과 없음'); savedRows = savedRows.filter(function (item) { return String(item.doctor_id) !== String(doctor.id); }); savedRows.push(stored); shown.delete(String(doctor.id)); details.remove(); listStatus.textContent = doctor.name + ' 진료표를 삭제했습니다. 새 항목에서 다시 추가할 수 있습니다.'; }
      catch (error) { result.textContent = '삭제하지 못했습니다. 연결 상태와 관리자 권한을 확인해 주세요.'; save.disabled = deleteItem.disabled = false; }
    });
    details.appendChild(section); root.appendChild(details);
  }
  try {
    var result = await Promise.all([window.loadDoctorScheduleData(), window.supabaseClient.from('doctor_about_schedules').select('doctor_id,schedule,is_visible')]);
    if (result[1].error) throw result[1].error;
    root.replaceChildren();
    listStatus = make('p'); listStatus.setAttribute('role', 'status'); root.appendChild(listStatus);
    savedRows = result[1].data;
    var order = ['정진호', '이택관', '심종우', '최한솔', '이정진'];
    var doctors = result[0].doctors.slice().sort(function (a, b) { var ai = order.indexOf(a.name.replace(/\s*원장\s*$/, '').trim()), bi = order.indexOf(b.name.replace(/\s*원장\s*$/, '').trim()); return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi); });
    doctors.filter(function (doctor) { var item = savedRows.find(function (row) { return String(row.doctor_id) === doctor.id; }); return item ? item.is_visible : order.includes(doctor.name.replace(/\s*원장\s*$/, '').trim()); }).forEach(function (doctor) {
      var saved = savedRows.find(function (item) { return String(item.doctor_id) === doctor.id; });
      var value = saved && saved.schedule;
      if (!value || !Array.isArray(value.rows) || !value.rows.length || value.rows.length > 4 || value.rows.some(function (row) { return !row || typeof row.label !== 'string' || !Array.isArray(row.cells) || row.cells.length !== 6 || row.cells.some(function (cell) { return typeof cell !== 'string'; }); })) value = defaults(doctor);
      shown.add(String(doctor.id)); draw(doctor, value);
    });
    window.createAdminDoctorPicker(root, document.querySelector('[data-admin-add-schedule]'), function (id) { return shown.has(String(id)); }, function (doctor) {
      var saved = savedRows.find(function (item) { return String(item.doctor_id) === String(doctor.id); });
      shown.add(String(doctor.id)); draw(doctor, saved && saved.schedule || defaults(doctor)); root.lastElementChild.open = true;
      listStatus.textContent = '새 진료표를 입력한 뒤 표 저장을 눌러 주세요.';
    });
  } catch (error) { root.textContent = '진료표를 불러오지 못했습니다. 연결 상태를 확인한 뒤 새로고침해 주세요.'; }
}());
