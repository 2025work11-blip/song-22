(function () {
  'use strict';
  function make(tag, text) { var node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node; }
  function normalize(name) { return String(name || '').replace(/\s*원장\s*$/, '').trim(); }
  window.createAdminDoctorPicker = function (root, button, isShown, onChoose) {
    var panel = make('div'); panel.className = 'admin-doctor-picker'; panel.hidden = true;
    var label = make('label', '등록된 원장 '), select = make('select'); label.appendChild(select); panel.appendChild(label);
    var choose = make('button', '선택'); choose.type = 'button'; choose.className = 'admin-button'; panel.appendChild(choose);
    var newLabel = make('label', '새 원장 이름 '), name = make('input'); name.type = 'text'; name.maxLength = 50; name.placeholder = '이름 입력'; newLabel.appendChild(name); panel.appendChild(newLabel);
    var create = make('button', '새 원장 등록'); create.type = 'button'; create.className = 'admin-button'; panel.appendChild(create);
    var status = make('p'); status.setAttribute('role', 'status'); panel.appendChild(status); root.prepend(panel);
    var doctors = [];
    async function refresh() {
      status.textContent = '원장 목록을 불러오는 중입니다.'; choose.disabled = create.disabled = true;
      try {
        var data = await window.loadDoctorScheduleData(); doctors = data.doctors;
        select.replaceChildren(); doctors.filter(function (doctor) { return !isShown(doctor.id); }).forEach(function (doctor) { var option = make('option', doctor.name); option.value = doctor.id; select.appendChild(option); });
        choose.disabled = !select.options.length; select.disabled = choose.disabled; create.disabled = false;
        status.textContent = choose.disabled ? '선택할 기존 원장이 없습니다. 새 원장 이름을 입력해 등록할 수 있습니다.' : '기존 원장을 선택하거나 새 원장을 등록해 주세요.';
      } catch (error) { status.textContent = '목록을 불러오지 못했습니다. 다시 열어 주세요.'; }
    }
    button.disabled = false;
    button.addEventListener('click', function () { panel.hidden = !panel.hidden; if (!panel.hidden) refresh(); });
    choose.addEventListener('click', function () { var doctor = doctors.find(function (item) { return item.id === select.value && !isShown(item.id); }); if (!doctor) return; onChoose(doctor); panel.hidden = true; });
    create.addEventListener('click', async function () {
      var value = normalize(name.value); if (!value) { status.textContent = '새 원장 이름을 입력해 주세요.'; name.focus(); return; }
      if (doctors.some(function (doctor) { return normalize(doctor.name) === value; })) { status.textContent = '이미 등록된 이름입니다. 기존 원장 목록에서 선택해 주세요.'; return; }
      create.disabled = true; choose.disabled = true; status.textContent = '새 원장 정보를 등록하고 있습니다.';
      try {
        var result = await window.adminStore.save('doctors', { name: value + ' 원장', color: '#3e7bc6', photo_url: null }, null);
        onChoose({ id: String(result.id), name: result.name, weeklySchedules: [] }); name.value = ''; panel.hidden = true;
      } catch (error) { status.textContent = '원장 정보를 등록하지 못했습니다. 관리자 권한과 연결 상태를 확인해 주세요.'; create.disabled = false; }
    });
  };
}());
