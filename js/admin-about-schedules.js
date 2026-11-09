(async function () {
  'use strict';
  var root = document.querySelector('[data-admin-about-schedules]');
  if (!root || !window.roleAccess || !await window.roleAccess.requireAdmin()) return;
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
        var response = await client.from('doctor_about_schedules').upsert({ doctor_id: Number(doctor.id), schedule: payload }).select('doctor_id').single();
        if (response.error || !response.data) throw response.error || new Error('저장 결과 없음');
        result.textContent = '저장했습니다. 병원소개 페이지를 새로고침하면 반영됩니다.';
      } catch (error) { result.textContent = '저장하지 못했습니다. 관리자 권한과 연결 상태를 확인해 주세요.'; }
      finally { save.disabled = false; }
    });
    details.appendChild(section); root.appendChild(details);
  }
  try {
    var result = await Promise.all([window.loadDoctorScheduleData(), window.supabaseClient.from('doctor_about_schedules').select('doctor_id,schedule')]);
    if (result[1].error) throw result[1].error;
    root.replaceChildren();
    var searchLabel = make('label', '원장 찾기 '), search = make('input'); search.type = 'search'; search.placeholder = '원장 이름 검색'; searchLabel.appendChild(search); root.appendChild(searchLabel);
    var order = ['정진호', '이택관', '심종우', '최한솔', '이정진'];
    var doctors = result[0].doctors.slice().sort(function (a, b) { var ai = order.indexOf(a.name.replace(/\s*원장\s*$/, '').trim()), bi = order.indexOf(b.name.replace(/\s*원장\s*$/, '').trim()); return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi); });
    doctors.forEach(function (doctor) {
      var saved = result[1].data.find(function (item) { return String(item.doctor_id) === doctor.id; });
      var value = saved && saved.schedule;
      if (!value || !Array.isArray(value.rows) || !value.rows.length || value.rows.length > 4 || value.rows.some(function (row) { return !row || typeof row.label !== 'string' || !Array.isArray(row.cells) || row.cells.length !== 6 || row.cells.some(function (cell) { return typeof cell !== 'string'; }); })) value = defaults(doctor);
      draw(doctor, value);
    });
    search.addEventListener('input', function () { root.querySelectorAll('details').forEach(function (detail) { detail.hidden = !detail.querySelector('summary').textContent.toLowerCase().includes(search.value.trim().toLowerCase()); }); });
  } catch (error) { root.textContent = '진료표를 불러오지 못했습니다. 연결 상태를 확인한 뒤 새로고침해 주세요.'; }
}());
