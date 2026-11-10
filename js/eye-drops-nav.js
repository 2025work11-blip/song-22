(function () {
  'use strict';
  var header = document.querySelector('.site-header');
  var intro = document.querySelector('[data-eye-guide] .detail-intro');
  var nav = document.querySelector('[data-eye-guide] .eye-guide-nav');
  if (!header || !intro || !nav) return;
  var links = Array.from(nav.querySelectorAll('a[href^="#"]'));
  var sections = links.map(function (link) { return { link: link, section: document.getElementById(link.getAttribute('href').slice(1)) }; }).filter(function (item) { return item.section; });
  var frame = null;
  function update() {
    frame = null;
    var headerHeight = header.getBoundingClientRect().height;
    var navHeight = nav.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--eye-header-height', headerHeight + 'px');
    document.documentElement.style.setProperty('--eye-nav-height', navHeight + 'px');
    nav.classList.toggle('is-stuck', intro.getBoundingClientRect().bottom <= header.getBoundingClientRect().bottom + 1);
    if (!sections.length) return;
    var current = sections[0];
    sections.forEach(function (item) { if (item.section.getBoundingClientRect().top <= headerHeight + navHeight + 20) current = item; });
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2 && sections[sections.length - 1].section.getBoundingClientRect().top < window.innerHeight) current = sections[sections.length - 1];
    sections.forEach(function (item) { if (item === current) item.link.setAttribute('aria-current', 'location'); else item.link.removeAttribute('aria-current'); });
  }
  function schedule() { if (frame === null) frame = window.requestAnimationFrame(update); }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('hashchange', schedule);
  window.addEventListener('load', schedule);
  if (typeof ResizeObserver !== 'undefined') { var observer = new ResizeObserver(schedule); observer.observe(header); observer.observe(nav); observer.observe(intro); }
  schedule();
}());
