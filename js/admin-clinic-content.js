(async function () {
  'use strict';
  if (!window.roleAccess || !await window.roleAccess.requireAdmin()) return;
  var hoursRoot = document.querySelector('[data-admin-clinic-hours]');
  var profileRoot = document.querySelector('[data-admin-doctor-profiles]');
  if (!hoursRoot || !profileRoot) return;
  function make(tag, text) { var node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node; }
  function message(node, value) { node.textContent = value; }
  var labels = { weekday: '월 ~ 금요일', saturday: '토요일', holiday: '공휴일', substitute: '대체공휴일', lunch: '점심시간' };
  function renderHours(rows) {
    hoursRoot.replaceChildren();
    var form = make('form'); form.className = 'admin-clinic-hours-form';
    Object.keys(labels).forEach(function (key) {
      var entry = rows.find(function (row) { return row.id === key; });
      if (!entry) throw new Error('진료시간 누락');
      var row = make('div'); row.className = 'admin-clinic-hours-row';
      var title = make('strong', labels[key]); row.appendChild(title);
      ['start_time', 'end_time'].forEach(function (field) {
        var label = make('label', field === 'start_time' ? '시작' : '종료');
        var input = make('input'); input.type = 'time'; input.required = true; input.name = key + '_' + field; input.value = entry[field].slice(0, 5);
        label.appendChild(input); row.appendChild(label);
      }); form.appendChild(row);
    });
    var save = make('button', '진료시간 저장'); save.type = 'submit'; save.className = 'admin-button admin-primary'; form.appendChild(save);
    var status = make('p'); status.setAttribute('role', 'status'); form.appendChild(status); hoursRoot.appendChild(form);
    form.addEventListener('submit', async function (event) {
      event.preventDefault(); if (!form.reportValidity() || !window.roleAccess.isAdmin()) return;
      var values = Object.keys(labels).map(function (key) { return { id: key, start_time: form.elements[key + '_start_time'].value, end_time: form.elements[key + '_end_time'].value }; });
      if (values.some(function (row) { return row.end_time <= row.start_time; })) { message(status, '종료 시간은 시작 시간보다 늦어야 합니다.'); return; }
      save.disabled = true; message(status, '저장 중입니다.');
      try { var client = await window.adminStore.verifyDoctorWrite(); var result = await client.from('clinic_hours').upsert(values).select('id'); if (result.error || !result.data || result.data.length !== values.length) throw result.error || new Error('저장 결과 없음'); message(status, '저장했습니다. 메인과 병원소개를 새로고침하면 반영됩니다.'); }
      catch (error) { message(status, '저장하지 못했습니다. 연결 상태와 관리자 권한을 확인해 주세요.'); }
      finally { save.disabled = false; }
    });
  }
  function renderProfiles(doctors, saved) {
    profileRoot.replaceChildren();
    var listStatus = make('p'); listStatus.setAttribute('role', 'status'); profileRoot.appendChild(listStatus);
    var order = ['정진호', '이택관', '심종우', '최한솔', '이정진'];
    var shown = new Set();
    function drawProfile(doctor) {
      var name = doctor.name.replace(/\s*원장\s*$/, '').trim();
      var data = saved.find(function (row) { return String(row.doctor_id) === String(doctor.id); }) || window.aboutProfileDefaults[name] || { greeting: '', career: [], activities: [], specialties: [] };
      shown.add(String(doctor.id));
      var details = make('details'); details.className = 'admin-weekly-group'; details.appendChild(make('summary', doctor.name));
      var form = make('form'); form.className = 'admin-about-schedule-editor admin-profile-form';
      [['greeting', '인사말'], ['career', '주요 약력 (한 줄에 한 항목)'], ['activities', '학회활동 (한 줄에 한 항목)']].forEach(function (field) {
        var fieldLabel = make('label', field[1]), input = make('textarea'); input.name = field[0]; input.rows = field[0] === 'greeting' ? 3 : 5;
        input.value = Array.isArray(data[field[0]]) ? data[field[0]].join('\n') : String(data[field[0]] || '');
        fieldLabel.appendChild(input); form.appendChild(fieldLabel);
      });
      var specialties = make('fieldset'); specialties.className = 'admin-specialties';
      specialties.appendChild(make('legend', '주력 진료분야'));
      var specialtyList = make('div'); specialtyList.className = 'admin-specialties-list'; specialties.appendChild(specialtyList);
      function addSpecialty(value, focus) {
        var row = make('div'); row.className = 'admin-specialty-row';
        var input = make('input'); input.type = 'text'; input.value = value || ''; input.placeholder = '예: 백내장'; input.setAttribute('data-specialty-input', ''); input.setAttribute('aria-label', '주력 진료분야');
        var removeField = make('button', '삭제'); removeField.type = 'button'; removeField.className = 'admin-button admin-danger'; removeField.setAttribute('aria-label', '이 진료분야 삭제');
        removeField.addEventListener('click', function () { row.remove(); });
        row.append(input, removeField); specialtyList.appendChild(row); if (focus) input.focus();
      }
      (Array.isArray(data.specialties) && data.specialties.length ? data.specialties : ['']).forEach(function (value) { addSpecialty(value, false); });
      var addField = make('button', '진료분야 추가'); addField.type = 'button'; addField.className = 'admin-button'; addField.addEventListener('click', function () { addSpecialty('', true); });
      specialties.appendChild(addField); form.appendChild(specialties);
      var save = make('button', '의료진 소개 저장'); save.type = 'submit'; save.className = 'admin-button admin-primary'; form.appendChild(save);
      var remove = make('button', '항목 삭제'); remove.type = 'button'; remove.className = 'admin-button admin-danger'; form.appendChild(remove);
      var status = make('p'); status.setAttribute('role', 'status'); form.appendChild(status); details.appendChild(form); profileRoot.appendChild(details);
      form.addEventListener('submit', async function (event) {
        event.preventDefault(); if (!window.roleAccess.isAdmin()) return;
        function lines(key) { return form.elements[key].value.split(/\r?\n/).map(function (text) { return text.trim(); }).filter(Boolean); }
        var payload = { doctor_id: Number(doctor.id), greeting: form.elements.greeting.value.trim(), career: lines('career'), activities: lines('activities'), specialties: Array.from(specialtyList.querySelectorAll('[data-specialty-input]')).map(function (input) { return input.value.trim(); }).filter(Boolean), is_visible: true };
        save.disabled = true; message(status, '저장 중입니다.');
        try { var client = await window.adminStore.verifyDoctorWrite(); var result = await client.from('doctor_about_profiles').upsert(payload).select('doctor_id').single(); if (result.error || !result.data) throw result.error || new Error('저장 결과 없음'); saved = saved.filter(function (row) { return String(row.doctor_id) !== String(doctor.id); }); saved.push(payload); message(status, '저장했습니다. 병원소개 페이지를 새로고침하면 반영됩니다.'); }
        catch (error) { message(status, '저장하지 못했습니다. 연결 상태와 관리자 권한을 확인해 주세요.'); }
        finally { save.disabled = false; }
      });
      remove.addEventListener('click', async function () {
        if (!window.roleAccess.isAdmin() || !window.confirm('이 원장소개 항목을 삭제할까요? 병원소개에서 표시되지 않습니다. 메인 달력의 원장과 일정은 유지됩니다.')) return;
        var previous = saved.find(function (row) { return String(row.doctor_id) === String(doctor.id); }) || data;
        var payload = { doctor_id: Number(doctor.id), greeting: previous.greeting || '', career: previous.career || [], activities: previous.activities || [], specialties: previous.specialties || [], is_visible: false };
        save.disabled = remove.disabled = true;
        try { var client = await window.adminStore.verifyDoctorWrite(); var result = await client.from('doctor_about_profiles').upsert(payload).select('doctor_id').single(); if (result.error || !result.data) throw result.error || new Error('삭제 결과 없음'); saved = saved.filter(function (row) { return String(row.doctor_id) !== String(doctor.id); }); saved.push(payload); shown.delete(String(doctor.id)); details.remove(); listStatus.textContent = doctor.name + ' 소개를 삭제했습니다. 새 항목에서 다시 추가할 수 있습니다.'; }
        catch (error) { message(status, '삭제하지 못했습니다. 연결 상태와 관리자 권한을 확인해 주세요.'); save.disabled = remove.disabled = false; }
      });
      return details;
    }
    doctors.slice().sort(function (a, b) { var ai = order.indexOf(a.name.replace(/\s*원장\s*$/, '').trim()), bi = order.indexOf(b.name.replace(/\s*원장\s*$/, '').trim()); return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi); }).forEach(function (doctor) {
      var item = saved.find(function (row) { return String(row.doctor_id) === String(doctor.id); });
      if (item ? item.is_visible : order.includes(doctor.name.replace(/\s*원장\s*$/, '').trim())) drawProfile(doctor);
    });
    window.createAdminDoctorPicker(profileRoot, document.querySelector('[data-admin-add-profile]'), function (id) { return shown.has(String(id)); }, function (doctor) { var details = drawProfile(doctor); details.open = true; listStatus.textContent = '내용을 입력한 뒤 의료진 소개 저장을 눌러 주세요.'; });
  }
  var results = await Promise.allSettled([window.supabaseClient.from('clinic_hours').select('id,start_time,end_time'), window.supabaseClient.from('doctors').select('id,name'), window.supabaseClient.from('doctor_about_profiles').select('doctor_id,greeting,career,activities,specialties,is_visible')]);
  try { if (results[0].status !== 'fulfilled' || results[0].value.error) throw new Error(); renderHours(results[0].value.data); } catch (error) { message(hoursRoot, '진료시간을 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요.'); }
  try { if (results[1].status !== 'fulfilled' || results[1].value.error || results[2].status !== 'fulfilled' || results[2].value.error) throw new Error(); renderProfiles(results[1].value.data, results[2].value.data); } catch (error) { message(profileRoot, '의료진 소개를 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요.'); }
}());
