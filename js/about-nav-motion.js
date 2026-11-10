(function () {
  'use strict';
  var nav = document.querySelector('body[data-about-page] .section-nav');
  var intro = document.querySelector('body[data-about-page] .detail-intro');
  var header = document.querySelector('.site-header');
  if (!nav || !intro || !header) return;

  function addDoctorPhotos() {
    document.querySelectorAll('.about-doctors [data-doctor-name]').forEach(function (card) {
      var summary = card.querySelector('summary');
      var photo = card.querySelector('.about-doctor-profile img');
      if (!summary || !photo) return;
      var thumbnail = summary.querySelector('.about-summary-photo');
      if (!thumbnail) {
        thumbnail = document.createElement('img');
        thumbnail.className = 'about-summary-photo';
        thumbnail.alt = '';
        thumbnail.setAttribute('aria-hidden', 'true');
        thumbnail.addEventListener('error', function () { thumbnail.src = 'assets/icons/doctor-placeholder.svg'; }, { once: true });
        summary.insertBefore(thumbnail, summary.firstChild);
      }
      thumbnail.src = photo.src;
    });
  }
  addDoctorPhotos();
  if (window.aboutProfilesReady) window.aboutProfilesReady.then(addDoctorPhotos, addDoctorPhotos);

  var frame = null;
  function update() {
    frame = null;
    // The intro's bottom is the nav's original position, even while the nav is stuck.
    nav.classList.toggle('is-stuck', intro.getBoundingClientRect().bottom <= header.getBoundingClientRect().bottom + 1);
    var stickyTop = header.getBoundingClientRect().height + nav.getBoundingClientRect().height;
    document.querySelectorAll('body[data-about-page] .about-doctors details, body[data-about-page] .equipment-category').forEach(function (item) {
      var bounds = item.getBoundingClientRect();
      item.classList.toggle('is-summary-stuck', item.open && bounds.top < stickyTop && bounds.bottom > stickyTop + 1);
    });
  }
  function schedule() {
    if (frame === null) frame = window.requestAnimationFrame(update);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  document.addEventListener('toggle', schedule, true);
  if (typeof ResizeObserver !== 'undefined') {
    var observer = new ResizeObserver(schedule);
    observer.observe(header);
    observer.observe(intro);
  }
  schedule();
}());
