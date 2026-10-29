// Supabase 연결 설정. 브라우저 공개용 Publishable Key만 사용합니다.
// CDN이 제공하는 window.supabase는 SDK이고, window.supabaseClient는 이 프로젝트의 클라이언트입니다.
// 인증 화면은 auth.js에서 처리합니다. 환자 데이터 조회·저장은 아직 연결하지 않습니다.
(function () {
  'use strict';

  if (window.supabaseClient) return;
  window.supabaseClient = null;

  var sdk = window.supabase;
  if (!sdk || typeof sdk.createClient !== 'function') {
    console.warn('Supabase CDN을 불러오지 못했습니다. 기존 화면은 계속 사용할 수 있습니다.');
    return;
  }

  var projectUrl = 'https://jhrygpmughystzskasaq.supabase.co';
  var publishableKey = 'sb_publishable_d-h8y7jq3G76aR0uyhaMWA_u7yLeqDH';

  try {
    window.supabaseClient = sdk.createClient(projectUrl, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } catch (error) {
    console.warn('Supabase 클라이언트를 초기화하지 못했습니다. 연결 설정을 확인해 주세요.');
  }
}());
