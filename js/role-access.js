// 역할은 이메일/로컬 저장 값이 아니라, 검증된 계정의 profiles.role로 확인합니다.
(function () {
  'use strict';
  var state = { status: 'checking', role: null, userId: null };
  var listeners = [];
  var revision = 0, timer = null, lastSession = null;
  var adminPage = document.body.hasAttribute('data-admin-page');

  function navigate(file) {
    var url = new URL(file, window.location.href);
    var language = window.aaUILanguage || new URLSearchParams(window.location.search).get('lang');
    if (['ko', 'en', 'zh-CN'].includes(language)) url.searchParams.set('lang', language);
    window.location.replace(url.href);
  }
  function publish(next) {
    state = next;
    var admin = next.status === 'ready' && next.role === 'admin';
    document.querySelectorAll('[data-admin-only]').forEach(function (node) { node.hidden = !admin; });
    if (adminPage) {
      document.querySelectorAll('[data-admin-protected]').forEach(function (node) {
        if (node.tagName === 'DIALOG' && admin) {
          var restoredForm = node.querySelector('[data-admin-form]');
          var restoredAccess = node.querySelector('[data-admin-editor-access]');
          if (restoredForm) restoredForm.hidden = false;
          if (restoredAccess) restoredAccess.hidden = true;
        }
        if (node.tagName === 'DIALOG' && node.open) {
          var editorAccess = node.querySelector('[data-admin-editor-access]');
          var editorForm = node.querySelector('[data-admin-form]');
          if (editorAccess && editorForm && (admin || next.status === 'checking' || next.status === 'error')) {
            // 권한을 확인하는 동안에는 폼을 숨기되 창과 작성 중인 내용을 보존합니다.
            node.hidden = false;
            editorForm.hidden = !admin;
            editorAccess.hidden = admin;
            var editorText = node.querySelector('[data-admin-editor-access-text]');
            var editorRetry = node.querySelector('[data-admin-editor-retry]');
            if (editorText) editorText.textContent = next.status === 'error'
              ? '관리자 권한을 확인하지 못했습니다. 작성 중인 내용은 유지됩니다.'
              : '관리자 권한을 확인하고 있습니다. 작성 중인 내용은 유지됩니다.';
            if (editorRetry) editorRetry.hidden = next.status !== 'error';
            return;
          }
          if (!admin) node.close();
        }
        node.hidden = !admin;
      });
      var message = document.querySelector('[data-admin-access-status]');
      if (message) {
        message.hidden = admin;
        message.textContent = next.status === 'error'
          ? '관리자 권한을 확인하지 못했습니다. 잠시 후 다시 확인해 주세요.' : '관리자 권한을 확인하고 있습니다.';
      }
      var retry = document.querySelector('[data-admin-access-retry]');
      if (retry) retry.hidden = next.status !== 'error';
      if (next.status === 'signed-out') navigate('login.html');
      else if (next.status === 'ready' && next.role === 'user') navigate('index.html');
    }
    listeners.slice().forEach(function (listener) { listener(Object.assign({}, next)); });
  }
  function check(session) {
    if (session !== undefined) lastSession = session;
    var current = ++revision;
    if (timer !== null) window.clearTimeout(timer);
    if (!lastSession || !lastSession.user) {
      publish({ status: 'signed-out', role: null, userId: null });
      return;
    }
    var expectedId = lastSession.user.id;
    publish({ status: 'checking', role: null, userId: null });
    // 인증 콜백 밖에서 SDK를 호출하여 인증 잠금으로 인한 대기를 피합니다.
    timer = window.setTimeout(async function () {
      timer = null;
      try {
        var client = window.supabaseClient;
        if (!client) throw new Error('인증 연결 없음');
        var userResult = await client.auth.getUser();
        if (current !== revision) return;
        if (userResult.error || !userResult.data || !userResult.data.user) {
          publish({ status: 'signed-out', role: null, userId: null });
          return;
        }
        var user = userResult.data.user;
        if (user.id !== expectedId) throw new Error('로그인 사용자가 변경되었습니다.');
        var result = await client.from('profiles').select('id,role').eq('id', user.id).maybeSingle();
        if (current !== revision) return;
        if (result.error || !result.data || result.data.id !== user.id || !['user', 'admin'].includes(result.data.role)) {
          throw new Error('역할을 확인할 수 없습니다.');
        }
        publish({ status: 'ready', role: result.data.role, userId: user.id });
      } catch (error) {
        if (current === revision) publish({ status: 'error', role: null, userId: null });
      }
    }, 0);
  }
  window.roleAccess = {
    check: check,
    isAdmin: function () { return state.status === 'ready' && state.role === 'admin'; },
    subscribe: function (listener) {
      listeners.push(listener);
      listener(Object.assign({}, state));
      return function () { listeners = listeners.filter(function (item) { return item !== listener; }); };
    },
    requireAdmin: function () {
      return new Promise(function (resolve) {
        if (state.status === 'ready' || state.status === 'signed-out') { resolve(state.status === 'ready' && state.role === 'admin'); return; }
        function listener(next) {
          if (next.status !== 'ready' && next.status !== 'signed-out') return;
          listeners = listeners.filter(function (item) { return item !== listener; });
          resolve(next.status === 'ready' && next.role === 'admin');
        }
        listeners.push(listener);
      });
    }
  };
  var retry = document.querySelector('[data-admin-access-retry]');
  if (retry) retry.addEventListener('click', function () { check(); });
  var editorRetry = document.querySelector('[data-admin-editor-retry]');
  if (editorRetry) editorRetry.addEventListener('click', function () { check(); });
  // 뒤로가기로 복원하거나 다른 탭에서 돌아온 화면에서도 재확인합니다.
  window.addEventListener('pageshow', function (event) { if (event.persisted) check(); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && lastSession) {
      revision++;
      publish({ status: 'checking', role: null, userId: null });
    } else if (document.visibilityState === 'visible') check();
  });
}());
