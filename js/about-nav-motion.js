(function () {
  'use strict';
  var nav = document.querySelector('body[data-about-page] .section-nav');
  var intro = document.querySelector('body[data-about-page] .detail-intro');
  var header = document.querySelector('.site-header');
  if (!nav || !intro || !header) return;

  var frame = null;
  function update() {
    frame = null;
    // The intro's bottom is the nav's original position, even while the nav is stuck.
    nav.classList.toggle('is-stuck', intro.getBoundingClientRect().bottom <= header.getBoundingClientRect().bottom + 1);
  }
  function schedule() {
    if (frame === null) frame = window.requestAnimationFrame(update);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  if (typeof ResizeObserver !== 'undefined') {
    var observer = new ResizeObserver(schedule);
    observer.observe(header);
    observer.observe(intro);
  }
  schedule();
}());
