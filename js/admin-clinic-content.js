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
    var label = make('label', '의료진 찾기 '), search = make('input'); search.type = 'search'; search.placeholder = '이름 또는 소개 내용 검색'; label.appendChild(search); profileRoot.appendChild(label);
    var order = ['정진호', '이택관', '심종우', '최한솔', '이정진'];
    doctors.slice().sort(function (a, b) { var ai = order.indexOf(a.name.replace(/\s*원장\s*$/, '').trim()), bi = order.indexOf(b.name.replace(/\s*원장\s*$/, '').trim()); return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi); }).forEach(function (doctor) {
      var name = doctor.name.replace(/\s*원장\s*$/, '').trim();
      var data = saved.find(function (row) { return String(row.doctor_id) === String(doctor.id); }) || window.aboutProfileDefaults[name] || { greeting: '', career: [], activities: [], specialties: [] };
      var details = make('details'); details.className = 'admin-weekly-group'; details.appendChild(make('summary', doctor.name));
      var form = make('form'); form.className = 'admin-about-schedule-editor admin-profile-form';
      [['greeting', '인사말'], ['career', '주요 약력 (한 줄에 한 항목)'], ['activities', '학회활동 (한 줄에 한 항목)'], ['specialties', '주력 진료분야 (한 줄에 한 항목)']].forEach(function (field) {
        var fieldLabel = make('label', field[1]), input = make('textarea'); input.name = field[0]; input.rows = field[0] === 'greeting' ? 3 : 5;
        input.value = Array.isArray(data[field[0]]) ? data[field[0]].join('\n') : String(data[field[0]] || '');
        fieldLabel.appendChild(input); form.appendChild(fieldLabel);
      });
      var save = make('button', '의료진 소개 저장'); save.type = 'submit'; save.className = 'admin-button admin-primary'; form.appendChild(save);
      var status = make('p'); status.setAttribute('role', 'status'); form.appendChild(status); details.appendChild(form); profileRoot.appendChild(details);
      form.addEventListener('submit', async function (event) {
        event.preventDefault(); if (!window.roleAccess.isAdmin()) return;
        function lines(key) { return form.elements[key].value.split(/\r?\n/).map(function (text) { return text.trim(); }).filter(Boolean); }
        var payload = { doctor_id: Number(doctor.id), greeting: form.elements.greeting.value.trim(), career: lines('career'), activities: lines('activities'), specialties: lines('specialties') };
        save.disabled = true; message(status, '저장 중입니다.');
        try { var client = await window.adminStore.verifyDoctorWrite(); var result = await client.from('doctor_about_profiles').upsert(payload).select('doctor_id').single(); if (result.error || !result.data) throw result.error || new Error('저장 결과 없음'); message(status, '저장했습니다. 병원소개 페이지를 새로고침하면 반영됩니다.'); }
        catch (error) { message(status, '저장하지 못했습니다. 연결 상태와 관리자 권한을 확인해 주세요.'); }
        finally { save.disabled = false; }
      });
    });
    search.addEventListener('input', function () { var term = search.value.trim().toLocaleLowerCase(); profileRoot.querySelectorAll('details').forEach(function (detail) { var text = detail.querySelector('summary').textContent + ' ' + Array.from(detail.querySelectorAll('textarea')).map(function (input) { return input.value; }).join(' '); detail.hidden = !text.toLocaleLowerCase().includes(term); }); });
  }
  var results = await Promise.allSettled([window.supabaseClient.from('clinic_hours').select('id,start_time,end_time'), window.supabaseClient.from('doctors').select('id,name'), window.supabaseClient.from('doctor_about_profiles').select('doctor_id,greeting,career,activities,specialties')]);
  try { if (results[0].status !== 'fulfilled' || results[0].value.error) throw new Error(); renderHours(results[0].value.data); } catch (error) { message(hoursRoot, '진료시간을 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요.'); }
  try { if (results[1].status !== 'fulfilled' || results[1].value.error || results[2].status !== 'fulfilled' || results[2].value.error) throw new Error(); renderProfiles(results[1].value.data, results[2].value.data); } catch (error) { message(profileRoot, '의료진 소개를 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요.'); }
}());
