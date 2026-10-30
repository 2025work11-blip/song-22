// 공통 인증 UI와 이메일/비밀번호 인증. SDK의 세션 관리를 사용합니다.
// 이메일 계정과 EMR 환자는 아직 연결되어 있지 않습니다.
(function () {
  'use strict';
  var client = window.supabaseClient;
  var form = document.querySelector('[data-auth-form]');
  var mode = form ? form.getAttribute('data-auth-form') : '';
  var globalMessage = document.querySelector('[data-auth-global-message]');
  var formMessage = document.querySelector('[data-auth-message]');
  var sessionRevision = 0;
  var logoutInProgress = false;
  var formBusy = false;
  var navigating = false;

  function navigate(file) {
    if (navigating) return;
    navigating = true;
    var target = new URL(file, window.location.href);
    // 주소 갱신이 제한되는 로컬 파일에서도 실제 화면의 선택 언어를 우선합니다.
    var language = window.aaUILanguage || (document.documentElement || {}).lang ||
      new URLSearchParams(window.location.search).get('lang');
    if (language && ['ko', 'en', 'zh-CN'].includes(language)) target.searchParams.set('lang', language);
    window.location.replace(target.href);
  }
  function message(text, success, global) {
    var element = global ? globalMessage : formMessage || globalMessage;
    if (!element) return;
    element.textContent = text;
    element.hidden = !text;
    element.classList.toggle('auth-message-success', Boolean(success));
  }
  function readableError(error) {
    var code = error && error.code;
    var messages = {
      invalid_credentials: '이메일 또는 비밀번호를 확인해 주세요.',
      email_not_confirmed: '이메일 인증이 필요합니다. 가입할 때 받은 인증메일을 확인한 후 로그인해 주세요.',
      user_already_exists: '이미 가입된 이메일입니다. 로그인 화면을 이용해 주세요.',
      email_exists: '이미 가입된 이메일입니다. 로그인 화면을 이용해 주세요.',
      weak_password: '비밀번호가 보안 기준을 충족하지 않습니다. 더 길고 안전한 비밀번호를 입력해 주세요.',
      email_address_invalid: '올바른 이메일 주소를 입력해 주세요.',
      email_address_not_authorized: '현재 서비스에서 이 이메일로 가입할 수 없습니다. 다른 이메일을 사용해 주세요.',
      signup_disabled: '현재 회원가입이 일시 중단되어 있습니다. 잠시 후 다시 이용해 주세요.',
      over_email_send_rate_limit: '인증메일 요청이 많습니다. 잠시 기다린 후 다시 시도해 주세요.',
      over_request_rate_limit: '요청이 많습니다. 잠시 기다린 후 다시 시도해 주세요.',
      user_banned: '현재 이용이 제한된 계정입니다. 병원에 문의해 주세요.',
      session_not_found: '로그인 정보가 만료되었습니다. 다시 로그인해 주세요.',
      refresh_token_not_found: '로그인 정보가 만료되었습니다. 다시 로그인해 주세요.'
    };
    if (messages[code]) return messages[code];
    if (error && error.status === 429) return '요청이 많습니다. 잠시 기다린 후 다시 시도해 주세요.';
    if (error && (error.name === 'AuthRetryableFetchError' || error.name === 'TypeError')) {
      return '로그인 서버에 연결하지 못했습니다. 인터넷 연결을 확인한 후 다시 시도해 주세요.';
    }
    return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }
  function renderSession(session) {
    if (window.roleAccess) window.roleAccess.check(session);
    var signedIn = Boolean(session && session.user);
    document.body.setAttribute('data-auth-state', signedIn ? 'signed-in' : 'signed-out');
    document.querySelectorAll('[data-auth-signed-in]').forEach(function (node) { node.hidden = !signedIn; });
    document.querySelectorAll('[data-auth-signed-out]').forEach(function (node) { node.hidden = signedIn; });
    // 샘플 환자 정보는 로그인 후에만 표시합니다. 실제 EMR 본인 매칭은 후속 작업입니다.
    document.querySelectorAll('[data-auth-only]').forEach(function (node) {
      var patientView = node.hasAttribute('data-home-patient-details') || node.hasAttribute('data-patient-content');
      node.hidden = !signedIn || (patientView && !window.patientMockData);
    });
    document.querySelectorAll('[data-auth-required]').forEach(function (node) { node.hidden = signedIn; });
    var homeSummary = document.querySelector('[data-home-patient-summary]');
    if (homeSummary) {
      var target = new URL(signedIn ? 'mypage.html' : 'login.html', window.location.href);
      if (window.aaUILanguage && window.aaUILanguage !== 'ko') target.searchParams.set('lang', window.aaUILanguage);
      homeSummary.href = target.href;
      homeSummary.setAttribute('aria-label', signedIn ? '마이페이지로 이동 · 환자 요약 (샘플)' : '로그인하고 내정보 확인');
    }
    if (signedIn && mode) navigate('index.html');
  }
  function setFormBusy(busy) {
    formBusy = busy;
    if (!form) return;
    form.setAttribute('aria-busy', String(busy));
    form.querySelectorAll('input, button').forEach(function (node) { node.disabled = busy; });
  }

  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (formBusy || !client) return;
      var emailInput = form.querySelector('[name="email"]');
      var passwordInput = form.querySelector('[name="password"]');
      var email = emailInput.value.trim();
      var password = passwordInput.value;
      emailInput.value = email;
      if (!email || emailInput.validity.typeMismatch) {
        message('올바른 이메일 주소를 입력해 주세요.');
        emailInput.focus();
        return;
      }
      if (!password || (mode === 'signup' && password.length < 6)) {
        message(mode === 'signup' ? '비밀번호는 6자 이상 입력해 주세요.' : '비밀번호를 입력해 주세요.');
        passwordInput.focus();
        return;
      }
      message('');
      setFormBusy(true);
      try {
        var result;
        if (mode === 'signup') {
          var credentials = { email: email, password: password };
          if (/^https?:$/.test(window.location.protocol)) {
            credentials.options = { emailRedirectTo: new URL('login.html', window.location.href).href };
          }
          result = await client.auth.signUp(credentials);
        } else {
          result = await client.auth.signInWithPassword({ email: email, password: password });
        }
        passwordInput.value = '';
        if (result.error) throw result.error;
        if (result.data && result.data.session) {
          renderSession(result.data.session);
          navigate('index.html');
        } else if (mode === 'signup') {
          message('가입 요청을 접수했습니다. 인증메일이 도착하면 이메일 인증 후 로그인해 주세요. 이미 가입한 이메일이라면 로그인해 주세요.', true);
        } else {
          message('로그인 정보를 확인하지 못했습니다. 다시 로그인해 주세요.');
        }
      } catch (error) {
        passwordInput.value = '';
        message(readableError(error));
      } finally {
        setFormBusy(false);
      }
    });
  }

  document.querySelectorAll('[data-auth-logout]').forEach(function (button) {
    button.addEventListener('click', async function () {
      if (!client || logoutInProgress) return;
      logoutInProgress = true;
      document.querySelectorAll('[data-auth-logout]').forEach(function (node) { node.disabled = true; });
      message('', false, true);
      try {
        // 현재 로그인한 브라우저의 세션을 종료합니다.
        var result = await client.auth.signOut({ scope: 'local' });
        if (result.error) throw result.error;
        renderSession(null);
        navigate('login.html');
      } catch (error) {
        message('로그아웃하지 못했습니다. 인터넷 연결을 확인한 후 다시 시도해 주세요.', false, true);
      } finally {
        logoutInProgress = false;
        document.querySelectorAll('[data-auth-logout]').forEach(function (node) { node.disabled = false; });
      }
    });
  });

  setFormBusy(true);
  if (!client) {
    renderSession(null);
    message('로그인 서비스를 불러오지 못했습니다. 인터넷 연결을 확인한 후 새로고침해 주세요.', false, true);
    if (form) message('로그인 서비스를 불러오지 못했습니다. 인터넷 연결을 확인한 후 새로고침해 주세요.');
    return;
  }

  // 콜백 안에서는 SDK의 다른 인증 메서드를 호출하거나 기다리지 않습니다.
  client.auth.onAuthStateChange(function (event, session) {
    sessionRevision += 1;
    renderSession(session);
    if (event === 'SIGNED_OUT' && !logoutInProgress) navigate('login.html');
  });
  var revisionAtStart = sessionRevision;
  client.auth.getSession().then(function (result) {
    if (revisionAtStart !== sessionRevision) return;
    if (result.error) throw result.error;
    renderSession(result.data && result.data.session);
  }).catch(function (error) {
    if (revisionAtStart !== sessionRevision) return;
    renderSession(null);
    message('로그인 상태를 확인하지 못했습니다. 다시 로그인해 주세요.', false, true);
  }).finally(function () { setFormBusy(false); });
}());
