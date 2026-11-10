(function () {
  'use strict';
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var observed = new WeakSet();
  var observer = new IntersectionObserver(function (entries) {
    entries.filter(function (entry) { return entry.isIntersecting; })
      .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; })
      .forEach(function (entry, index) {
        var item = entry.target;
        var summary = item.querySelector(':scope > summary');
        if (summary && !item.open) {
          summary.style.setProperty('--summary-reveal-delay', Math.min(index, 4) * 110 + 'ms');
          summary.classList.add('unified-summary-reveal');
          summary.addEventListener('animationend', function () { summary.classList.remove('unified-summary-reveal'); }, { once: true });
        }
        observer.unobserve(item);
      });
  }, { threshold: 0.1 });
  function observeItems(root) {
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    var items = root.matches && root.matches('details:not(.blog-post):not(.notice-item)') ? [root] : [];
    root.querySelectorAll('details:not(.blog-post):not(.notice-item)').forEach(function (item) { items.push(item); });
    items.forEach(function (item) { if (!observed.has(item)) { observed.add(item); observer.observe(item); } });
  }
  observeItems(document);
  new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) { mutation.addedNodes.forEach(observeItems); });
  }).observe(document.body, { childList: true, subtree: true });
}());
