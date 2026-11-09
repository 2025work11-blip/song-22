(function () {
  'use strict';
  var header = document.querySelector('.site-header');
  var nav = document.querySelector('body[data-category] .section-nav');
  if (!header || !nav) return;
  var links = Array.from(nav.querySelectorAll('a[href^="#"]'));
  var sections = links.map(function (link) {
    var id = link.getAttribute('href').slice(1);
    return { link: link, section: document.getElementById(id) };
  }).filter(function (item) { return item.section; });
  var frame = null;
  function updateCurrentSection() {
    frame = null;
    if (!sections.length) return;
    var threshold = header.getBoundingClientRect().height + nav.getBoundingClientRect().height + 20;
    var current = sections[0];
    sections.forEach(function (item) {
      if (item.section.getBoundingClientRect().top <= threshold) current = item;
    });
    var root = document.documentElement;
    if (window.scrollY + window.innerHeight >= root.scrollHeight - 2 &&
        sections[sections.length - 1].section.getBoundingClientRect().top < window.innerHeight) current = sections[sections.length - 1];
    sections.forEach(function (item) {
      if (item === current) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    });
  }
  function scheduleCurrentSection() {
    if (frame === null) frame = window.requestAnimationFrame(updateCurrentSection);
  }
  function updateOffsets() {
    document.documentElement.style.setProperty('--disease-header-height', header.getBoundingClientRect().height + 'px');
    document.documentElement.style.setProperty('--disease-nav-height', nav.getBoundingClientRect().height + 'px');
    scheduleCurrentSection();
  }
  updateOffsets();
  if (typeof ResizeObserver !== 'undefined') {
    var observer = new ResizeObserver(updateOffsets);
    observer.observe(header);
    observer.observe(nav);
  } else window.addEventListener('resize', updateOffsets);
  window.addEventListener('scroll', scheduleCurrentSection, { passive: true });
  window.addEventListener('hashchange', scheduleCurrentSection);
  window.addEventListener('load', scheduleCurrentSection);
}());
