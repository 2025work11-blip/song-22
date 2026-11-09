window.aboutProfilesReady = (async function () {
  'use strict';
  var cards = Array.from(document.querySelectorAll('[data-about-doctors] [data-doctor-name]'));
  if (!cards.length || !window.supabaseClient) return;
  try {
    var results = await Promise.all([window.supabaseClient.from('doctors').select('id,name'), window.supabaseClient.from('doctor_about_profiles').select('doctor_id,greeting,career,activities,specialties,is_visible,profile_photo_url'), window.supabaseClient.from('doctor_about_schedules').select('doctor_id,is_visible')]);
    if (results[0].error || results[1].error || !Array.isArray(results[0].data) || !Array.isArray(results[1].data)) return;
    var scheduleIds = results[2].error || !Array.isArray(results[2].data) ? [] : results[2].data.filter(function (row) { return row.is_visible; }).map(function (row) { return String(row.doctor_id); });
    var root = document.querySelector('[data-about-doctors]');
    results[0].data.forEach(function (doctor) {
      var name = String(doctor.name).replace(/\s*원장\s*$/, '').trim();
      var profile = results[1].data.find(function (row) { return String(row.doctor_id) === String(doctor.id); });
      if (!name || cards.some(function (card) { return card.dataset.doctorName === name; }) || (profile && !profile.is_visible) || (!profile && !scheduleIds.includes(String(doctor.id)))) return;
      var card = document.createElement('details'); card.dataset.doctorName = name;
      card.innerHTML = '<summary></summary><div class="about-doctor-body"><div class="about-doctor-intro"><div class="about-doctor-profile"><img src="assets/icons/doctor-placeholder.svg" alt=""><p>안과전문의 <strong></strong></p><div class="about-specialties"></div></div><div><h3>인사말</h3><p>인사말은 준비 중입니다.</p></div></div><section><h3>약력</h3><p>약력은 준비 중입니다.</p></section><section><h3>진료일정</h3><div data-doctor-schedule>정기 일정을 불러오는 중입니다.</div></section></div>';
      card.querySelector('summary').textContent = name + ' 원장'; card.querySelector('strong').textContent = name;
      root.appendChild(card); cards.push(card);
    });
    cards.forEach(function (card) {
      var doctors = results[0].data.filter(function (doctor) { return String(doctor.name).replace(/\s*원장\s*$/, '').trim() === card.dataset.doctorName; });
      if (doctors.length !== 1) return;
      var data = results[1].data.find(function (row) { return String(row.doctor_id) === String(doctors[0].id); });
      if (data && !data.is_visible) { card.remove(); return; }
      if (!data || !Array.isArray(data.career) || !Array.isArray(data.activities) || !Array.isArray(data.specialties)) return;
      var photo = card.querySelector('.about-doctor-profile img');
      if (photo && typeof data.profile_photo_url === 'string' && /^https:\/\//i.test(data.profile_photo_url)) { photo.src = data.profile_photo_url; photo.alt = card.dataset.doctorName + ' 원장 사진'; photo.addEventListener('error', function () { photo.src = 'assets/icons/doctor-placeholder.svg'; photo.alt = ''; }, { once: true }); }
      var greeting = card.querySelector('.about-doctor-intro > div:nth-child(2) p');
      if (greeting) { greeting.textContent = data.greeting || '인사말은 준비 중입니다.'; greeting.style.whiteSpace = 'pre-line'; }
      var tags = card.querySelector('.about-specialties');
      if (tags) { tags.replaceChildren(); data.specialties.forEach(function (value) { if (typeof value === 'string' && value.trim()) { var span = document.createElement('span'); span.textContent = value; tags.appendChild(span); } }); }
      var section = card.querySelector('.about-doctor-body > section');
      if (!section) return;
      section.replaceChildren();
      function heading(label, className) { var node = document.createElement('h3'); node.textContent = label; if (className) node.className = className; section.appendChild(node); }
      function list(values) { var ul = document.createElement('ul'); ul.className = 'about-career-list'; values.forEach(function (value) { if (typeof value === 'string' && value.trim()) { var li = document.createElement('li'); li.textContent = value; ul.appendChild(li); } }); section.appendChild(ul); }
      heading('약력');
      if (data.career.length) list(data.career); else { var empty = document.createElement('p'); empty.textContent = '약력은 준비 중입니다.'; section.appendChild(empty); }
      if (data.activities.length) { heading('학회활동', 'about-career-heading'); list(data.activities); }
    });
  } catch (error) { /* 연결 실패 시 기존 소개를 유지합니다. */ }
}());
