(async function () {
  'use strict';
  var sections = Array.from(document.querySelectorAll('[data-equipment-category]'));
  if (!sections.length || !window.supabaseClient) return;
  var names = { exam: '검진', surgery: '수술', treatment: '치료' };
  function make(tag, className, text) { var node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
  function imageUrl(value) {
    if (typeof value !== 'string') return '';
    if (/^assets\/equipment\/[a-z0-9._-]+$/i.test(value)) return value;
    try { var url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; } catch (error) { return ''; }
  }
  function renderCard(row, category) {
    var card = make('article', 'equipment-card'), picture = make('div', 'equipment-image');
    var url = imageUrl(row.image_url);
    if (url) {
      var img = make('img'); img.src = url; img.alt = row.title + ' 장비'; img.loading = 'lazy'; img.decoding = 'async';
      img.addEventListener('error', function () { picture.replaceChildren(make('span', 'equipment-image-pending', '사진 준비 중')); }, { once: true }); picture.appendChild(img);
    } else picture.appendChild(make('span', 'equipment-image-pending', '사진 준비 중'));
    card.append(picture, make('p', 'equipment-label', names[category] + '장비'), make('h4', '', row.title), make('p', 'equipment-description', row.description || ''));
    return card;
  }
  sections.forEach(function (section) { section.querySelector('.equipment-grid').replaceChildren(make('p', 'equipment-empty', '장비 정보를 불러오는 중입니다.')); });
  try {
    var rows = [];
    while (true) {
      var result = await window.supabaseClient.from('equipment').select('id,category,title,description,image_url').order('id').range(rows.length, rows.length + 999);
      if (result.error || !Array.isArray(result.data)) throw result.error || new Error('장비 목록 조회 실패');
      rows = rows.concat(result.data); if (result.data.length < 1000) break;
    }
    sections.forEach(function (section) {
      var category = section.dataset.equipmentCategory, grid = section.querySelector('.equipment-grid');
      var items = rows.filter(function (row) { return row.category === category; });
      grid.replaceChildren();
      if (!items.length) grid.appendChild(make('p', 'equipment-empty', '등록된 장비가 없습니다.'));
      items.forEach(function (row) { grid.appendChild(renderCard(row, category)); });
    });
  } catch (error) {
    sections.forEach(function (section) { section.querySelector('.equipment-grid').replaceChildren(make('p', 'equipment-empty', '장비 정보를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.')); });
  }
}());
