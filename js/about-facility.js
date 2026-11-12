(function () {
  'use strict';
  document.querySelectorAll('[data-facility-carousel]').forEach(function (carousel) {
    var slides = carousel.querySelector('[data-facility-slides]');
    var previous = carousel.querySelector('[data-facility-prev]');
    var next = carousel.querySelector('[data-facility-next]');
    var total = slides.children.length;
    if (total < 2) { previous.hidden = true; next.hidden = true; return; }
    var firstClone = slides.firstElementChild.cloneNode(true);
    var lastClone = slides.lastElementChild.cloneNode(true);
    [firstClone, lastClone].forEach(function (clone) { clone.setAttribute('aria-hidden', 'true'); clone.classList.remove('is-active'); });
    slides.insertBefore(lastClone, slides.firstElementChild);
    slides.appendChild(firstClone);
    var frame = null;
    var settleTimer = null;
    var activeIndex = 1;
    function currentIndex() {
      var bounds = slides.getBoundingClientRect();
      var center = bounds.left + bounds.width / 2;
      var closest = 0;
      var distance = Infinity;
      Array.from(slides.children).forEach(function (slide, index) {
        var rect = slide.getBoundingClientRect();
        var nextDistance = Math.abs(rect.left + rect.width / 2 - center);
        if (nextDistance < distance) { distance = nextDistance; closest = index; }
      });
      return closest;
    }
    function scrollToIndex(index, behavior) {
      var trackBounds = slides.getBoundingClientRect();
      var slideBounds = slides.children[index].getBoundingClientRect();
      var target = slides.scrollLeft + slideBounds.left + slideBounds.width / 2 - (trackBounds.left + trackBounds.width / 2);
      slides.scrollTo({ left: target, behavior: behavior });
    }
    function update() {
      frame = null;
      var index = currentIndex();
      activeIndex = index;
      Array.from(slides.children).forEach(function (slide, slideIndex) { slide.classList.toggle('is-active', slideIndex === index); });
      slides.classList.toggle('is-portrait', slides.children[index].hasAttribute('data-portrait'));
    }
    function move(step) {
      var target = Math.max(0, Math.min(total + 1, currentIndex() + step));
      scrollToIndex(target, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
    }
    function settleLoop() {
      var index = currentIndex();
      if (index !== 0 && index !== total + 1) return;
      var trackBounds = slides.getBoundingClientRect();
      var slideBounds = slides.children[index].getBoundingClientRect();
      if (Math.abs(slideBounds.left + slideBounds.width / 2 - (trackBounds.left + trackBounds.width / 2)) > 4) return;
      scrollToIndex(index === 0 ? total : 1, 'auto');
      update();
    }
    previous.addEventListener('click', function () { move(-1); });
    next.addEventListener('click', function () { move(1); });
    slides.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
    });
    slides.addEventListener('scroll', function () {
      if (frame === null) frame = requestAnimationFrame(update);
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settleLoop, 150);
    }, { passive: true });
    slides.addEventListener('scrollend', settleLoop);
    window.addEventListener('resize', function () { scrollToIndex(activeIndex, 'auto'); update(); });
    scrollToIndex(1, 'auto');
    update();
  });
}());
