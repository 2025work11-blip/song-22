// 첫 화면이 그려지기 전에 저장된 테마를 적용합니다. 기본값은 기존 라이트 모드입니다.
(function () {
  'use strict';
  var root = document.documentElement;
  function applyTheme(theme, save) {
    var dark = theme === 'dark';
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    if (save) {
      try { localStorage.setItem('aa-ui-theme', dark ? 'dark' : 'light'); } catch (error) { /* 저장 차단 시 현재 화면만 적용 */ }
    }
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.querySelector('[data-theme-label]').textContent = dark ? '라이트모드로 변경' : '다크모드로 변경';
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0e151f' : '#f2f3f5');
  }
  var saved = 'light';
  try { saved = localStorage.getItem('aa-ui-theme') || 'light'; } catch (error) { /* 저장소 미지원 */ }
  applyTheme(saved, false);
  document.addEventListener('click', function (event) {
    if (event.target.closest('[data-theme-toggle]')) {
      applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    }
  });
  document.addEventListener('DOMContentLoaded', function () { applyTheme(root.getAttribute('data-theme'), false); });
  window.addEventListener('storage', function (event) {
    if (event.key === 'aa-ui-theme') applyTheme(event.newValue, false);
  });
}());
