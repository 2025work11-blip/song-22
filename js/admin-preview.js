(function () {
  'use strict';
  var main = document.querySelector('.admin-main'), dialog = document.querySelector('[data-admin-editor]');
  if (!main || !dialog) return;
  var diseases = ['vision', 'cataract', 'glaucoma', 'retina', 'myopia'];
  var selectedEdit = null;
  function diseaseUrl(section) {
    var field = document.querySelector('[data-admin-disease-filter]');
    var form = dialog.querySelector('form');
    var category = dialog.open && form && form.elements.namedItem('category');
    var name = category && diseases.includes(category.value) ? category.value : field && diseases.includes(field.value) ? field.value : 'vision';
    var part = dialog.open && form && form.elements.namedItem('section');
    var anchor = part && ['overview', 'outpatient', 'beforeSurgery', 'afterSurgery'].includes(part.value) ? part.value : section || 'overview';
    return name + '.html#' + anchor;
  }
  function urlFor(key, rowId, stopped) {
    if (['doctors', 'weekly', 'dates', 'closures'].includes(key)) return 'index.html#schedule-title';
    if (key === 'notices') return 'index.html#notice-title';
    if (key === 'blog') return rowId && !stopped && /^\d+$/.test(rowId) && location.protocol !== 'file:' ? '/blog/id/' + encodeURIComponent(rowId) : 'blog.html';
    if (key === 'equipment') return 'about.html#equipment';
    if (['equipment-exam', 'equipment-surgery', 'equipment-treatment'].includes(key)) return 'about.html#' + key;
    if (key === 'hours') return 'index.html#schedule-hours-title';
    if (key === 'bios') return 'about.html#director';
    if (key === 'topicSummaries' || key === 'articles') return diseaseUrl('overview');
    return 'index.html';
  }
  function link(href, label) {
    var node = document.createElement('a'); node.className = 'admin-button admin-preview-link'; node.textContent = label || '미리보기';
    node.href = href; node.target = '_blank'; node.rel = 'noopener noreferrer';
    node.title = '저장되거나 게시된 내용을 새 탭에서 확인합니다.'; return node;
  }
  var names = { '원장 정보': 'doctors', '정기 진료 일정': 'weekly', '날짜별 변경 일정': 'dates', '휴진 기간': 'closures', '공지 목록': 'notices', '블로그 글': 'blog', '자동 생성 글 가져오기': 'blog', '병원 진료시간': 'hours', '원장소개': 'bios', '장비소개': 'equipment', '장비 안내': 'equipment', '보유장비': 'equipment', '검진 장비': 'equipment-exam', '수술 장비': 'equipment-surgery', '치료 장비': 'equipment-treatment', '분야별 소개': 'topicSummaries', '상세 안내': 'articles', '기본 정보와 연결 주소': 'settings' };
  function setupCards() {
    main.querySelectorAll('.admin-card').forEach(function (card) {
      if (card.dataset.previewAdded) return;
      var title = card.querySelector('h3'), key = title && names[title.textContent.trim()];
      if (!key) return;
      var area = card.querySelector('.admin-card-heading');
      if (!area) { area = document.createElement('div'); area.className = 'admin-card-heading'; title.parentNode.insertBefore(area, title); area.appendChild(title); }
      var anchor = link(urlFor(key));
      if (key === 'topicSummaries' || key === 'articles') anchor.addEventListener('click', function () { anchor.href = urlFor(key); });
      var addButton = area.querySelector(':scope > [data-admin-edit], :scope > [data-admin-add-profile], :scope > [data-admin-add-schedule]');
      if (addButton) {
        var tools = document.createElement('div'); tools.className = 'admin-card-tools';
        area.insertBefore(tools, addButton); tools.append(addButton, anchor);
      } else area.appendChild(anchor);
      card.dataset.previewAdded = 'true';
    });
    main.querySelectorAll('.admin-profile-form').forEach(function (form) {
      if (form.dataset.previewAdded) return;
      var profile = form.closest('details'), name = profile && profile.querySelector('summary');
      var value = name ? name.textContent.replace(/\s*원장\s*$/, '').trim() : '';
      var href = 'about.html' + (value ? '?previewDoctor=' + encodeURIComponent(value) : '') + '#director';
      var save = form.querySelector('button[type="submit"]');
      if (save) { form.insertBefore(link(href), save); form.dataset.previewAdded = 'true'; }
    });
    main.querySelectorAll('.admin-about-schedule-actions').forEach(function (area) {
      if (area.dataset.previewAdded) return;
      var profile = area.closest('details'), name = profile && profile.querySelector('summary');
      var value = name ? name.textContent.replace(/\s*원장\s*$/, '').trim() : '';
      area.prepend(link('about.html' + (value ? '?previewDoctor=' + encodeURIComponent(value) : '') + '#director'));
      area.dataset.previewAdded = 'true';
    });
  }
  main.addEventListener('click', function (event) {
    var button = event.target.closest('[data-admin-edit]'); if (!button) return;
    var row = button.closest('tr');
    selectedEdit = { key: button.dataset.adminEdit, id: button.dataset.rowId || '', stopped: Boolean(row && row.classList.contains('admin-blog-stopped')) };
    queueMicrotask(updateEditorLink);
  }, true);
  var editorLink = dialog.querySelector('[data-admin-preview-editor]');
  function updateEditorLink() { if (selectedEdit) editorLink.href = urlFor(selectedEdit.key, selectedEdit.id, selectedEdit.stopped); }
  editorLink.addEventListener('click', updateEditorLink);
  dialog.addEventListener('change', updateEditorLink);
  setupCards();
  new MutationObserver(setupCards).observe(main, { childList: true, subtree: true });
}());
