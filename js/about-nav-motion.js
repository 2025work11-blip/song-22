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
        var cardPhoto = document.createElement('img');
        cardPhoto.className = 'about-card-photo';
        cardPhoto.alt = '';
        cardPhoto.setAttribute('aria-hidden', 'true');
        cardPhoto.addEventListener('error', function () { cardPhoto.src = 'assets/icons/doctor-placeholder.svg'; }, { once: true });
        var cardName = document.createElement('span');
        cardName.className = 'about-card-name';
        cardName.textContent = card.dataset.doctorName + ' 원장';
        thumbnail = document.createElement('img');
        thumbnail.className = 'about-summary-photo';
        thumbnail.alt = '';
        thumbnail.setAttribute('aria-hidden', 'true');
        thumbnail.addEventListener('error', function () { thumbnail.src = 'assets/icons/doctor-placeholder.svg'; }, { once: true });
        summary.replaceChildren(thumbnail, cardPhoto, cardName);
      }
      thumbnail.src = photo.src;
      summary.querySelector('.about-card-photo').src = photo.src;
    });
  }
  addDoctorPhotos();
  if (window.aboutProfilesReady) window.aboutProfilesReady.then(addDoctorPhotos, addDoctorPhotos);
  var doctorsRoot = document.querySelector('[data-about-doctors]');
  if (doctorsRoot) {
    var selectionAnchor = null;
    doctorsRoot.addEventListener('click', function (event) {
      var summary = event.target.closest('summary');
      var item = summary && summary.parentElement;
      if (!item || !item.matches('details[data-doctor-name]') || item.open) return;
      selectionAnchor = { item: item, top: summary.getBoundingClientRect().top };
    }, true);
    doctorsRoot.addEventListener('toggle', function (event) {
      var item = event.target;
      if (!item.matches('details[data-doctor-name]')) return;
      if (item.open) {
        doctorsRoot.querySelectorAll('details[data-doctor-name][open]').forEach(function (other) { if (other !== item) other.open = false; });
      }
      doctorsRoot.classList.toggle('has-open-doctor', !!doctorsRoot.querySelector('details[data-doctor-name][open]'));
      if (item.open && selectionAnchor && selectionAnchor.item === item) {
        var originalTop = selectionAnchor.top;
        selectionAnchor = null;
        requestAnimationFrame(function () {
          if (!item.open) return;
          var currentTop = item.getBoundingClientRect().top;
          window.scrollBy(0, currentTop - originalTop);
        });
      }
    }, true);
  }

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
