(function () {
  'use strict';
  var header = document.querySelector('.site-header');
  var nav = document.querySelector('body[data-category] .section-nav');
  if (!header || !nav) return;
  function updateOffsets() {
    document.documentElement.style.setProperty('--disease-header-height', header.getBoundingClientRect().height + 'px');
    document.documentElement.style.setProperty('--disease-nav-height', nav.getBoundingClientRect().height + 'px');
  }
  updateOffsets();
  if (typeof ResizeObserver !== 'undefined') {
    var observer = new ResizeObserver(updateOffsets);
    observer.observe(header);
    observer.observe(nav);
  } else window.addEventListener('resize', updateOffsets);
}());
