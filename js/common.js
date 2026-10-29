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
        ? 'AA안과 카카오톡 채널 · 새 탭으로 연결'
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

    function setOpen(open, restoreFocus) {
      actions.hidden = !open;
      trigger.setAttribute('aria-expanded', String(open));
      trigger.setAttribute('aria-label', open ? '상담 및 예약 메뉴 닫기' : '상담 및 예약 메뉴 열기');
      if (restoreFocus) trigger.focus();
    }
    trigger.addEventListener('click', function () { setOpen(actions.hidden, false); });
    document.addEventListener('click', function (event) {
      if (!widget.contains(event.target)) setOpen(false, false);
    });
    widget.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !actions.hidden) {
        event.preventDefault();
        setOpen(false, true);
      }
    });
  }

  // Google의 웹사이트 번역 화면으로 연결합니다. API 키나 비공식 번역 위젯은 사용하지 않습니다.
  function initializeLanguages() {
    var picker = document.querySelector('[data-language-picker]');
    if (!picker) return;
    var trigger = picker.querySelector('[data-language-toggle]');
    var panel = picker.querySelector('[data-language-panel]');
    var notice = picker.querySelector('[data-language-notice]');
    var links = picker.querySelectorAll('[data-language]');

    function isPublicUrl(url) {
      var host = url.hostname;
      return /^https?:$/.test(url.protocol) && host.includes('.') &&
        !/^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) &&
        !/\.(local|localhost|test|invalid)$/.test(host);
    }
    var pageUrl = null;
    try {
      var configured = (window.siteConfig || {}).publicSiteUrl;
      if (configured) {
        var base = new URL(configured);
        base.pathname = base.pathname.replace(/\/index\.html$/, '/').replace(/\/?$/, '/');
        pageUrl = new URL(window.location.pathname.split('/').pop() || 'index.html', base);
      } else {
        pageUrl = new URL(window.location.href);
        // Google의 번역 프록시 안에서 언어를 다시 선택할 때 원래 주소를 복원합니다.
        if (pageUrl.hostname.endsWith('.translate.goog')) {
          pageUrl.hostname = pageUrl.hostname.replace(/\.translate\.goog$/, '')
            .replace(/--/g, '\u0000').replace(/-/g, '.').replace(/\u0000/g, '-');
          pageUrl.protocol = 'https:';
          Array.from(pageUrl.searchParams.keys()).forEach(function (key) {
            if (key.startsWith('_x_tr_')) pageUrl.searchParams.delete(key);
          });
        }
      }
      if (!isPublicUrl(pageUrl)) pageUrl = null;
    } catch (error) { pageUrl = null; }

    // 개인 진료기록과 로컬 파일은 내장 화면 번역으로 처리합니다.
    var privatePage = document.body.hasAttribute('data-private-page');
    if (privatePage) pageUrl = null;

    links.forEach(function (link) {
      var language = link.getAttribute('data-language');
      if (language === 'ko' && window.location.hostname.endsWith('.translate.goog') && pageUrl) {
        var originalPage = new URL(pageUrl.href);
        originalPage.searchParams.set('lang', 'ko');
        link.href = originalPage.href;
        return;
      }
      if (!pageUrl || language === 'ko') {
        link.removeAttribute('aria-disabled');
        link.href = '?lang=' + link.getAttribute('data-language');
        link.addEventListener('click', function (event) {
          event.preventDefault();
          if (window.applyUILanguage) window.applyUILanguage(link.getAttribute('data-language'));
          setOpen(false, true);
        });
        return;
      }
      var translated = new URL('https://translate.google.com/translate');
      translated.searchParams.set('sl', 'ko');
      translated.searchParams.set('tl', link.getAttribute('data-language'));
      translated.searchParams.set('u', pageUrl.href);
      link.href = translated.href;
    });
    var selectedLanguage = new URLSearchParams(window.location.search).get('_x_tr_tl') ||
      new URLSearchParams(window.location.search).get('lang') || 'ko';
    links.forEach(function (link) {
      if (link.getAttribute('data-language') === selectedLanguage) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    notice.textContent = privatePage
      ? '환자 정보는 외부로 보내지 않고 화면 문구를 번역합니다.'
      : pageUrl
      ? 'Google Translate로 전체 페이지를 번역합니다.'
      : '영어·중국어로 화면을 전환할 수 있습니다.';

    function setOpen(open, restoreFocus) {
      panel.hidden = !open;
      trigger.setAttribute('aria-expanded', String(open));
      if (restoreFocus) trigger.focus();
    }
    trigger.addEventListener('click', function () { setOpen(panel.hidden, false); });
    document.addEventListener('click', function (event) {
      if (!picker.contains(event.target)) setOpen(false, false);
    });
    picker.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.hidden) {
        event.preventDefault();
        setOpen(false, true);
      }
    });
  }

  function renderItems(container, items, emptyText) {
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
      document.title = '안내 정보를 불러올 수 없습니다 | AA안과';
      return;
    }
    document.title = disease.title + ' 안내 | AA안과';
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
      if (outside || event.target.closest('[data-menu-close], a[href]')) drawer.close();
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
