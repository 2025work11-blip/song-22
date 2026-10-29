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
      status.textContent = 'AA안과 카카오톡 채널 · 새 탭으로 연결';
    } else {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      status.textContent = '카카오톡 채널 연결 준비 중';
    }
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

  configureContact();
  renderDetail();
  initializeSectionNavigation();
}());
