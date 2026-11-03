(function () {
  'use strict';
  var form = document.querySelector('[data-blog-search]');
  if (!form) return;
  var query = form.querySelector('input');
  var articles = Array.from(document.querySelectorAll('[data-blog-post]'));
  var empty = document.querySelector('[data-blog-empty]');

  function search() {
    var term = query.value.trim().toLocaleLowerCase();
    var count = 0;
    articles.forEach(function (article) {
      var matches = !term || article.textContent.toLocaleLowerCase().includes(term);
      article.hidden = !matches;
      if (matches) count += 1;
    });
    empty.hidden = count !== 0;
  }

  form.addEventListener('submit', function (event) { event.preventDefault(); search(); });
  query.addEventListener('input', search);
  window.addEventListener('storage', function (event) {
    if (event.key === 'aa-ui-language') search();
  });
  document.querySelectorAll('[data-language]').forEach(function (link) {
    link.addEventListener('click', function () { queueMicrotask(search); });
  });
}());
