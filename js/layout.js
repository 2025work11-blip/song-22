// 모든 페이지의 스티키 헤더, Drawer, 하단 테마 버튼은 이 파일에서 함께 관리합니다.
// common.js, language.js, auth.js보다 먼저 defer로 불러옵니다.
(function () {
  'use strict';
  var sections = {
    "header":  "\u003cheader class=\"site-header\"\u003e\n  \u003cdiv class=\"container header-inner\"\u003e\n    \u003ca class=\"brand\" href=\"index.html\" aria-label=\"연세제일안과 홈\"\u003e\u003cimg class=\"brand-logo\" src=\"assets/logo-jeileye.svg?v=20261102-yonsei1\" width=\"561\" height=\"98\" alt=\"연세제일안과\"\u003e\u003c/a\u003e\n    \u003cdiv class=\"header-actions\"\u003e\u003cnav class=\"language-inline notranslate\" translate=\"no\" aria-label=\"언어 선택\"\u003e\u003ca href=\"?lang=ko\" data-language=\"ko\" lang=\"ko\" aria-label=\"한국어로 보기\"\u003eKR\u003c/a\u003e\u003cspan aria-hidden=\"true\"\u003e|\u003c/span\u003e\u003ca href=\"?lang=en\" data-language=\"en\" lang=\"en\" aria-label=\"영어로 번역\"\u003eEN\u003c/a\u003e\u003cspan aria-hidden=\"true\"\u003e|\u003c/span\u003e\u003ca href=\"?lang=zh-CN\" data-language=\"zh-CN\" lang=\"zh-CN\" aria-label=\"중국어로 번역\"\u003eCN\u003c/a\u003e\u003c/nav\u003e\u003cbutton class=\"menu-trigger\" type=\"button\" data-menu-open aria-label=\"카테고리 메뉴 열기\" aria-controls=\"category-drawer\" aria-expanded=\"false\" aria-haspopup=\"dialog\"\u003e\u003csvg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" aria-hidden=\"true\"\u003e\u003cpath d=\"M4 6h16M4 12h16M4 18h16\"/\u003e\u003c/svg\u003e\u003c/button\u003e\u003c/div\u003e\n  \u003c/div\u003e\n\u003c/header\u003e",
    "drawer":  "\u003cdialog class=\"menu-drawer\" id=\"category-drawer\" data-menu-drawer aria-labelledby=\"drawer-title\"\u003e\n  \u003cdiv class=\"drawer-header\"\u003e\u003ca class=\"brand\" href=\"index.html\" aria-label=\"연세제일안과 홈\"\u003e\u003cimg class=\"brand-logo\" src=\"assets/logo-jeileye.svg?v=20261102-yonsei1\" width=\"561\" height=\"98\" alt=\"연세제일안과\"\u003e\u003c/a\u003e\u003cdiv class=\"drawer-header-actions\"\u003e\u003cnav class=\"language-inline notranslate\" translate=\"no\" aria-label=\"언어 선택\"\u003e\u003ca href=\"?lang=ko\" data-language=\"ko\" lang=\"ko\" aria-label=\"한국어로 보기\"\u003eKR\u003c/a\u003e\u003cspan aria-hidden=\"true\"\u003e|\u003c/span\u003e\u003ca href=\"?lang=en\" data-language=\"en\" lang=\"en\" aria-label=\"영어로 번역\"\u003eEN\u003c/a\u003e\u003cspan aria-hidden=\"true\"\u003e|\u003c/span\u003e\u003ca href=\"?lang=zh-CN\" data-language=\"zh-CN\" lang=\"zh-CN\" aria-label=\"중국어로 번역\"\u003eCN\u003c/a\u003e\u003c/nav\u003e\u003cbutton class=\"drawer-close\" type=\"button\" data-menu-close aria-label=\"메뉴 닫기\" autofocus\u003e×\u003c/button\u003e\u003c/div\u003e\u003ch2 class=\"visually-hidden\" id=\"drawer-title\"\u003e전체 메뉴\u003c/h2\u003e\u003c/div\u003e\n  \u003cnav class=\"drawer-nav\" aria-label=\"전체 카테고리\"\u003e\n    \u003cdiv class=\"drawer-account-row\"\u003e\u003ca href=\"mypage.html\"\u003e\u003cspan class=\"drawer-number\"\u003e01.\u003c/span\u003e\u003cspan\u003e마이페이지\u003c/span\u003e\u003c/a\u003e\u003ca class=\"drawer-account-link\" href=\"login.html\" data-auth-signed-out hidden\u003e로그인\u003c/a\u003e\u003ca class=\"drawer-account-link drawer-admin-button\" href=\"admin.html\" data-admin-only hidden aria-label=\"관리자 페이지로 이동\"\u003e어드민\u003c/a\u003e\u003c/div\u003e\n    \u003ca href=\"vision.html\"\u003e\u003cspan class=\"drawer-number\"\u003e02.\u003c/span\u003e\u003cspan\u003e시력교정\u003c/span\u003e\u003c/a\u003e\n    \u003ca href=\"cataract.html\"\u003e\u003cspan class=\"drawer-number\"\u003e03.\u003c/span\u003e\u003cspan\u003e백내장\u003c/span\u003e\u003c/a\u003e\n    \u003ca href=\"glaucoma.html\"\u003e\u003cspan class=\"drawer-number\"\u003e04.\u003c/span\u003e\u003cspan\u003e녹내장\u003c/span\u003e\u003c/a\u003e\n    \u003ca href=\"retina.html\"\u003e\u003cspan class=\"drawer-number\"\u003e05.\u003c/span\u003e\u003cspan\u003e망막\u003c/span\u003e\u003c/a\u003e\n    \u003ca href=\"myopia.html\"\u003e\u003cspan class=\"drawer-number\"\u003e06.\u003c/span\u003e\u003cspan\u003e소아근시\u003c/span\u003e\u003c/a\u003e\n    \u003ca href=\"about.html\"\u003e\u003cspan class=\"drawer-number\"\u003e07.\u003c/span\u003e\u003cspan\u003e병원소개\u003c/span\u003e\u003c/a\u003e\r\n    \u003ca href=\"blog.html\"\u003e\u003cspan class=\"drawer-number\"\u003e08.\u003c/span\u003e\u003cspan\u003eQnA 블로그\u003c/span\u003e\u003c/a\u003e\n  \u003c/nav\u003e\n  \u003cp class=\"drawer-caption\"\u003e최선의 시력으로 만나는 더 선명한 세상 연세제일안과\u003c/p\u003e\n\u003c/dialog\u003e",
    "footer":  "\u003cfooter class=\"site-footer\"\u003e\n  \u003cdiv class=\"container footer-inner\"\u003e\u003cspan class=\"footer-brand\"\u003e연세제일안과\u003c/span\u003e\u003cp\u003e최선의 시력으로 만나는 더 선명한 세상 · 진료 전후 정보 안내\u003c/p\u003e\u003c/div\u003e\n  \u003cdiv class=\"container theme-settings\"\u003e\u003cbutton class=\"theme-toggle\" type=\"button\" data-theme-toggle aria-pressed=\"false\"\u003e\u003csvg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" aria-hidden=\"true\"\u003e\u003cpath d=\"M20 14a8 8 0 0 1-10-10 8.5 8.5 0 1 0 10 10Z\"/\u003e\u003c/svg\u003e\u003cspan data-theme-label\u003e다크모드로 변경\u003c/span\u003e\u003c/button\u003e\u003cbutton class=\"theme-toggle share-button\" type=\"button\" data-share-home\u003e\u003csvg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" aria-hidden=\"true\"\u003e\u003ccircle cx=\"18\" cy=\"5\" r=\"3\"/\u003e\u003ccircle cx=\"6\" cy=\"12\" r=\"3\"/\u003e\u003ccircle cx=\"18\" cy=\"19\" r=\"3\"/\u003e\u003cpath d=\"m8.6 10.5 6.8-4m-6.8 7 6.8 4\"/\u003e\u003c/svg\u003e\u003cspan\u003e링크 공유\u003c/span\u003e\u003c/button\u003e\u003cp class=\"share-status\" data-share-status role=\"status\" aria-live=\"polite\" hidden\u003e\u003c/p\u003e\u003cinput class=\"share-url\" data-share-url type=\"url\" readonly aria-label=\"공유할 메인 페이지 링크\" hidden\u003e\u003c/div\u003e\n\u003cdiv class=\"container footer-account\"\u003e\u003cbutton class=\"footer-logout\" type=\"button\" data-auth-signed-in data-auth-logout hidden\u003e로그아웃\u003c/button\u003e\u003c/div\u003e\u003c/footer\u003e"
};
  Object.keys(sections).forEach(function (name) {
    var slot = document.querySelector('[data-site-' + name + ']');
    if (!slot) return;
    var template = document.createElement('template');
    template.innerHTML = sections[name];
    if (name === 'drawer') {
      var drawerNav = template.content.querySelector('.drawer-nav');
      var accountRow = drawerNav && drawerNav.querySelector('.drawer-account-row');
      if (accountRow) {
        var aboutLink = drawerNav.querySelector('a[href="about.html"]');
        if (aboutLink) {
          [['dry-eye.html', '안구건조'], ['eye-drops.html', '안약사용']].forEach(function (entry) {
            var link = document.createElement('a');
            var number = document.createElement('span');
            var label = document.createElement('span');
            link.setAttribute('href', entry[0]);
            number.className = 'drawer-number';
            label.textContent = entry[1];
            link.append(number, label);
            drawerNav.insertBefore(link, aboutLink);
          });
        }
        var blogLink = drawerNav.querySelector('a[href="blog.html"]');
        if (blogLink) drawerNav.appendChild(blogLink);
        drawerNav.appendChild(accountRow);
        Array.from(drawerNav.children).forEach(function (item, index) {
          var number = item.querySelector('.drawer-number');
          if (number) number.textContent = String(index + 1).padStart(2, '0') + '.';
        });
      }
    }
    // Normalize shared assets for nested blog URLs, consistently on every page.
    template.content.querySelectorAll('[href],[src]').forEach(function (element) {
      ['href','src'].forEach(function (attribute) {
        var value = element.getAttribute(attribute);
        if (value && !/^(?:[a-z][a-z0-9+.-]*:|\/|#|\?)/i.test(value)) element.setAttribute(attribute, '/' + value);
      });
    });
    slot.replaceWith(template.content);
  });
  // 각 페이지의 상담 메뉴에 동일한 전화 연결을 추가합니다.
  document.querySelectorAll('[data-quick-actions]').forEach(function (actions) {
    if (actions.querySelector('[data-phone-link]')) return;
    var template = document.createElement('template');
    template.innerHTML = '<a class="quick-action" data-phone-link href="tel:0647272700" title="064-727-2700"><svg viewBox="0 0 36 36" width="36" height="36" fill="none" aria-hidden="true"><rect width="36" height="36" rx="10" fill="#e8f1fc"/><path d="M11 9h4l2 6-3 2a17 17 0 0 0 5 5l2-3 6 2v4c0 2-2 3-4 2-8-2-13-7-15-15-1-2 1-3 3-3Z" stroke="#0074ff" stroke-width="1.7" stroke-linejoin="round"/></svg><span>전화 상담</span><span class="visually-hidden"> 064-727-2700</span></a>';
    actions.appendChild(template.content);
  });
}());
