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
      var cardPhoto = summary.querySelector('.about-card-photo');
      if (!cardPhoto) {
        cardPhoto = document.createElement('img');
        cardPhoto.className = 'about-card-photo';
        cardPhoto.alt = '';
        cardPhoto.setAttribute('aria-hidden', 'true');
        cardPhoto.addEventListener('error', function () { cardPhoto.src = 'assets/icons/doctor-placeholder.svg'; }, { once: true });
        var cardName = document.createElement('span');
        cardName.className = 'about-card-name';
        cardName.textContent = card.dataset.doctorName + ' 원장';
        summary.replaceChildren(cardPhoto, cardName);
      }
      cardPhoto.src = photo.src;
    });
  }
  addDoctorPhotos();
  var doctorsRoot = document.querySelector('[data-about-doctors]');
  if (doctorsRoot) {
    var selectionAnchor = null;
    function stickDoctor(item) {
      requestAnimationFrame(function () {
        if (!item.open) return;
        var stickyTop = header.getBoundingClientRect().height + nav.getBoundingClientRect().height;
        var target = window.scrollY + item.getBoundingClientRect().top - stickyTop + 2;
        window.scrollTo({ top: Math.max(0, target), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      });
    }
    var picker = document.createElement('div');
    picker.className = 'about-doctor-picker';
    picker.setAttribute('role', 'group');
    picker.setAttribute('aria-label', '의료진 선택');
    picker.hidden = true;
    doctorsRoot.appendChild(picker);
    function renderDoctorPicker() {
      var cards = Array.from(doctorsRoot.querySelectorAll(':scope > details[data-doctor-name]'));
      var selected = cards.find(function (card) { return card.open; });
      picker.hidden = !selected;
      picker.replaceChildren();
      if (!selected) return;
      cards.forEach(function (card, index) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'about-picker-card' + (card === selected ? ' is-selected' : '');
        button.dataset.doctorIndex = String(index);
        button.setAttribute('aria-pressed', String(card === selected));
        var photo = document.createElement('img');
        photo.className = 'about-picker-photo';
        photo.alt = '';
        photo.src = card.querySelector('.about-doctor-profile img').src;
        photo.addEventListener('error', function () { photo.src = 'assets/icons/doctor-placeholder.svg'; }, { once: true });
        var name = document.createElement('span');
        name.className = 'about-picker-name';
        name.textContent = card.dataset.doctorName + ' 원장';
        button.append(photo, name);
        picker.appendChild(button);
      });
    }
    picker.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-doctor-index]');
      if (!button || !picker.contains(button)) return;
      var cards = doctorsRoot.querySelectorAll(':scope > details[data-doctor-name]');
      var selected = cards[Number(button.dataset.doctorIndex)];
      if (!selected) return;
      if (selected.open) { stickDoctor(selected); return; }
      selectionAnchor = { item: selected };
      selected.open = true;
    });
    if (window.aboutProfilesReady) window.aboutProfilesReady.then(function () { addDoctorPhotos(); renderDoctorPicker(); }, function () { addDoctorPhotos(); renderDoctorPicker(); });
    doctorsRoot.addEventListener('click', function (event) {
      var summary = event.target.closest('summary');
      var item = summary && summary.parentElement;
      if (!item || !item.matches('details[data-doctor-name]') || item.open) return;
      selectionAnchor = { item: item };
    }, true);
    doctorsRoot.addEventListener('toggle', function (event) {
      var item = event.target;
      if (!item.matches('details[data-doctor-name]')) return;
      if (item.open) {
        doctorsRoot.querySelectorAll('details[data-doctor-name][open]').forEach(function (other) { if (other !== item) other.open = false; });
      }
      doctorsRoot.classList.toggle('has-open-doctor', !!doctorsRoot.querySelector('details[data-doctor-name][open]'));
      renderDoctorPicker();
      if (item.open && selectionAnchor && selectionAnchor.item === item) {
        selectionAnchor = null;
        stickDoctor(item);
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
