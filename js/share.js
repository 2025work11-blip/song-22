// 어떤 화면에서도 환자 정보나 현재 페이지 주소 대신 메인 페이지 링크만 공유합니다.
(function () {
  'use strict';
  var button = document.querySelector('[data-share-home]');
  if (!button) return;
  var status = document.querySelector('[data-share-status]');
  var field = document.querySelector('[data-share-url]');
  var busy = false;

  button.addEventListener('click', async function () {
    if (busy) return;
    busy = true;
    button.disabled = true;
    status.hidden = true;
    field.hidden = true;
    try {
      var url = new URL('index.html', (window.siteConfig || {}).publicSiteUrl).href;
      if (!url.startsWith('https://')) throw new Error('Invalid public URL');
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({ title: 'AA안과', url: url });
          return;
        } catch (error) {
          if (error.name === 'AbortError') return;
          // 공유 창을 사용할 수 없으면 링크 복사로 이어집니다.
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        status.textContent = '메인 페이지 링크를 복사했습니다.';
      } catch (error) {
        field.value = url;
        field.hidden = false;
        field.focus();
        field.select();
        status.textContent = '아래 링크를 길게 누르거나 선택하여 복사해 주세요.';
      }
      status.hidden = false;
    } catch (error) {
      status.textContent = '공유 링크를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
      status.hidden = false;
    } finally {
      busy = false;
      button.disabled = false;
    }
  });
}());
