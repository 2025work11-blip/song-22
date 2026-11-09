// 공통 화면 동작. 파일을 직접 열어도 실행되도록 일반 스크립트를 사용합니다.
(function () {
  'use strict';

  function configureContact() {
    var link = document.querySelector('[data-kakao-link]');
    var status = document.querySelector('[data-kakao-status]');
    if (!link || !status) return;

    var rawUrl = (window.siteConfig || {}).kakaoChannelUrl;
    var url = null;
    try {
      var parsed = new URL(typeof rawUrl === 'string' ? rawUrl.trim() : '');
      // 일반 HTTPS 링크만 허용합니다. API나 SDK는 사용하지 않습니다.
      if (parsed.protocol === 'https:') url = parsed.href;
    } catch (error) {
      // 미설정 또는 잘못된 주소는 준비 중 상태로 유지합니다.
    }

    if (url) {
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.removeAttribute('aria-disabled');
      status.textContent = parsed.hostname === 'pf.kakao.com'
        ? '연세제일안과 카카오톡 채널 · 새 탭으로 연결'
        : '새 탭으로 연결';
    } else {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      status.textContent = '카카오톡 채널 연결 준비 중';
    }
  }

  function initializeQuickActions() {
    var widget = document.querySelector('[data-quick-widget]');
    if (!widget) return;
    var trigger = widget.querySelector('[data-quick-toggle]');
    var actions = widget.querySelector('[data-quick-actions]');
    var booking = widget.querySelector('[data-booking-link]');
    var bookingStatus = widget.querySelector('[data-booking-status]');
    try {
      var url = new URL((window.siteConfig || {}).naverBookingUrl);
      if (url.protocol === 'https:') {
        booking.href = url.href;
        booking.target = '_blank';
        booking.rel = 'noopener noreferrer';
        booking.removeAttribute('aria-disabled');
        bookingStatus.textContent = '새 탭으로 연결';
      }
    } catch (error) { /* 주소가 없으면 준비 중 상태를 유지합니다. */ }

    // 처음에는 펼치고, 사용자가 변경한 상태는 모든 페이지에서 공유합니다.
    // 이전 버전의 바깥 클릭으로 저장된 닫힘 상태는 가져오지 않습니다.
    var storageKey = 'aa-quick-actions-explicit-open';
    function setOpen(open, restoreFocus, save) {
      actions.hidden = !open;
      trigger.setAttribute('aria-expanded', String(open));
      trigger.setAttribute('aria-label', open ? '상담 및 예약 메뉴 닫기' : '상담 및 예약 메뉴 열기');
      if (save) {
        try { localStorage.setItem(storageKey, String(open)); } catch (error) { /* 저장이 차단되어도 현재 화면에서는 동작합니다. */ }
      }
      if (restoreFocus) trigger.focus();
    }
    var initiallyOpen = true;
    try { initiallyOpen = localStorage.getItem(storageKey) !== 'false'; } catch (error) { /* 기본 펼침 상태를 사용합니다. */ }
    setOpen(initiallyOpen, false, false);
    trigger.addEventListener('click', function () { setOpen(actions.hidden, false, true); });
    widget.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !actions.hidden) {
        event.preventDefault();
        setOpen(false, true, true);
      }
    });
    window.addEventListener('storage', function (event) {
      if (event.key === storageKey || event.key === null) {
        setOpen(event.key === null || event.newValue !== 'false', false, false);
      }
    });
  }

  // 지구본은 모든 화면에서 동일한 내장 언어 전환을 사용합니다.
  // Google 번역 프록시로 이동하면 로그인 세션의 출처가 바뀌므로 자동 이동하지 않습니다.
  function initializeLanguages() {
    var sourceUrl = new URL(window.location.href);
    sourceUrl.hash = '';
    document.querySelectorAll('[data-language]').forEach(function (link) {
      var language = link.getAttribute('data-language');
      var target = new URL(sourceUrl.href);
      target.searchParams.set('lang', language);
      link.href = target.href;
      link.addEventListener('click', function (event) {
        if (typeof window.applyUILanguage !== 'function') return;
        event.preventDefault();
        window.applyUILanguage(language);
      });
    });
  }
  function renderItems(container, items, emptyText) {
    if (!container || container.hasAttribute('data-static-content')) return;
    container.replaceChildren();
    if (!Array.isArray(items) || items.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = emptyText;
      container.appendChild(empty);
      return;
    }
    items.forEach(function (item) {
      var card = document.createElement('article');
      card.className = 'info-card';
      var heading = document.createElement('h3');
      heading.textContent = item.title;
      var description = document.createElement('p');
      description.textContent = item.text;
      card.append(heading, description);
      container.appendChild(card);
    });
  }

  function renderDetail() {
    var category = document.body.getAttribute('data-category');
    if (category === null) return;
    var data = window.diseaseData || {};
    var disease = Object.prototype.hasOwnProperty.call(data, category) ? data[category] : null;
    if (!disease) {
      document.querySelector('[data-detail]').hidden = true;
      document.querySelector('[data-error]').hidden = false;
      document.title = '안내 정보를 불러올 수 없습니다 | 연세제일안과';
      return;
    }
    document.title = disease.title + ' 안내 | 연세제일안과';
    document.querySelector('[data-title]').textContent = disease.title;
    document.querySelector('[data-breadcrumb]').textContent = disease.title;
    document.querySelector('[data-summary]').textContent = disease.summary;
    document.querySelector('[data-mock-notice]').hidden = disease.isMock !== true;

    ['overview', 'outpatient', 'beforeSurgery', 'afterSurgery'].forEach(function (key) {
      var isSurgery = key === 'beforeSurgery' || key === 'afterSurgery';
      renderItems(document.querySelector('[data-section="' + key + '"]'), disease[key],
        isSurgery ? '해당 분야의 수술 안내는 준비 중입니다.' : '해당 안내는 준비 중입니다.');
    });

  }

  function initializeSectionNavigation() {
    var firstLink = document.querySelector('.section-nav a');
    if (!firstLink) return;
    // 질환 안내와 병원소개에서 공통으로 현재 섹션을 표시합니다.
    function updateSection() {
      var currentHash = window.location.hash || firstLink.getAttribute('href');
      document.querySelectorAll('.section-nav a').forEach(function (link) {
        if (link.getAttribute('href') === currentHash) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    updateSection();
    window.addEventListener('hashchange', updateSection);
  }

  function initializeDrawer() {
    var trigger = document.querySelector('[data-menu-open]');
    var drawer = document.querySelector('[data-menu-drawer]');
    if (!trigger || !drawer) return;

    trigger.addEventListener('click', function () {
      drawer.showModal();
      trigger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('drawer-open');
    });
    drawer.addEventListener('click', function (event) {
      var bounds = drawer.getBoundingClientRect();
      var outside = event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom;
      if (outside || event.target.closest('[data-menu-close], a[href]:not([data-language])')) drawer.close();
    });
    // 기본 dialog가 Escape 처리와 모달 내부의 키보드 포커스 이동을 담당합니다.
    drawer.addEventListener('close', function () {
      trigger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('drawer-open');
      trigger.focus();
    });
  }

  configureContact();
  initializeQuickActions();
  initializeLanguages();
  renderDetail();
  initializeSectionNavigation();
  initializeDrawer();
}());
