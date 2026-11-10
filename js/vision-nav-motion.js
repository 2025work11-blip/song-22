(function () {
  'use strict';
  var nav = document.querySelector('body[data-category="vision"] .section-nav');
  var intro = document.querySelector('body[data-category="vision"] .detail-intro');
  var header = document.querySelector('.site-header');
  if (!nav || !intro || !header) return;
  var iconPaths = {
    checklist: 'M9 5h10v16H5V5h2 M9 3h6v4H9z M8 11l1 1 2-2 M13 11h3 M8 16l1 1 2-2 M13 16h3',
    lens: 'M3 9c.7 6 3.8 9 9 9s8.3-3 9-9 M3 9c1.4 1.2 4.8 2 9 2s7.6-.8 9-2 M6 6c2-.7 4-.9 6-.9s4 .2 6 .9',
    equipment: 'M4 20h16 M7 20v-3h10v3 M12 17v-5 M8 4h8v7H8z M10 6h4 M10 9h4 M6 6H4v5h4 M16 6h3v5h-3',
    makeup: 'M5 19l8-8 3 3-8 8H5z M12 12l2-5 3-3 3 3-3 3-2 2 M4 4l3 3 M4 9h4',
    travel: 'M4 16h16l-1-7H5z M7 9V6h10v3 M6 16v2 M18 16v2 M7 13h.01 M17 13h.01',
    id: 'M3 6h18v12H3z M7 10a2 2 0 1 0 4 0 2 2 0 0 0-4 0z M6 15c1-2 5-2 6 0 M14 10h4 M14 13h4',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2',
    dna: 'M8 3c0 6 8 6 8 12 0 3-2 5-4 6 M16 3c0 6-8 6-8 12 0 3 2 5 4 6 M9 6h6 M9 18h6 M9 12h6',
    calendar: 'M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16 M8 14h3 M13 14h3 M8 17h3',
    location: 'M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z M12 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
    wind: 'M3 8h12c3 0 3-4 0-4-1 0-2 1-2 2 M3 12h16c3 0 3 4 0 4-1 0-2-1-2-2 M3 16h9',
    water: 'M8 4h8 M12 2v4 M7 8h10a4 4 0 0 1 4 4v2h-4v-2H7v2H3V9h4z M19 17c-1 1-2 2-2 3a2 2 0 0 0 4 0c0-1-1-2-2-3z',
    hair: 'M5 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z M5 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4z M7 7l12 12 M7 17L19 5',
    drink: 'M10 3h4v5l3 3v9a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-9l3-3z M10 5h4 M7 13h10 M7 18h10',
    exercise: 'M3 10v4 M6 8v8 M9 10v4 M9 12h6 M15 10v4 M18 8v8 M21 10v4',
    brush: 'M3 10c2 3 5 5 9 5s7-2 9-5 M6 13l-1 3 M10 15l-.5 3 M14 15l.5 3 M18 13l1 3'
  };
  var headings = [
    ['수술을 계획하기 전에', 'checklist'], ['검사/수술 전 준비사항', 'checklist'], ['렌즈 착용 중단', 'lens'],
    ['눈화장은', 'brush'], ['대중교통 이용', 'travel'], ['신분증 필수', 'id'], ['검사 안내', 'clock'],
    ['기초검사', 'equipment'], ['각막이상증 유전자 검사', 'dna'], ['병원 이용 안내', 'location'], ['일정 변경', 'calendar'],
    ['층 안내', 'location'], ['건조한 환경', 'wind'], ['세안', 'water'], ['펌·염색', 'hair'],
    ['음주', 'drink'], ['운동', 'exercise'], ['화장', 'brush']
  ];
  document.querySelectorAll('#beforeSurgery .vision-guide-content h4, #beforeSurgery .vision-guide-content h5, #afterSurgery .vision-daily-care h3').forEach(function (heading) {
    if (heading.matches('.vision-guide-section > h4')) return;
    var match = headings.find(function (entry) { return heading.textContent.trim().indexOf(entry[0]) === 0 || heading.textContent.indexOf(entry[0]) !== -1; });
    if (!match) return;
    heading.classList.add('vision-heading-with-icon');
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'vision-heading-icon');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', iconPaths[match[1]]);
    svg.appendChild(path);
    heading.prepend(svg);
  });
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.filter(function (entry) { return entry.isIntersecting; })
        .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; })
        .forEach(function (entry, index) {
          var item = entry.target;
          var summary = item.querySelector(':scope > summary');
          if (summary && !item.open) {
            summary.style.setProperty('--vision-reveal-delay', Math.min(index, 4) * 110 + 'ms');
            summary.classList.add('vision-summary-reveal');
            summary.addEventListener('animationend', function () { summary.classList.remove('vision-summary-reveal'); }, { once: true });
          }
          revealObserver.unobserve(item);
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('body[data-category="vision"] .vision-guide, body[data-category="vision"] .vision-aftercare-chapter').forEach(function (item) { revealObserver.observe(item); });
  }
  var frame = null;
  function update() {
    frame = null;
    nav.classList.toggle('is-stuck', intro.getBoundingClientRect().bottom <= header.getBoundingClientRect().bottom + 1);
    var stickyTop = header.getBoundingClientRect().height + nav.getBoundingClientRect().height;
    document.querySelectorAll('body[data-category="vision"] .vision-guide, body[data-category="vision"] .vision-aftercare-chapter').forEach(function (item) {
      var bounds = item.getBoundingClientRect();
      item.classList.toggle('is-summary-stuck', item.open && bounds.top < stickyTop && bounds.bottom > stickyTop + 1);
    });
  }
  function schedule() { if (frame === null) frame = window.requestAnimationFrame(update); }
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
