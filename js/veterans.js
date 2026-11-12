(function () {
  'use strict';
  var close = document.querySelector('[data-close-veterans]');
  if (!close) return;
  close.addEventListener('click', function () {
    window.close();
    window.setTimeout(function () { window.location.href = 'index.html#parking-title'; }, 200);
  });
}());
