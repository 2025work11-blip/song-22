// 기존 공용 테이블만 저장합니다. 실제 쓰기 권한은 DB의 관리자 RLS로 제한합니다.
(function () {
  'use strict';
  var columns = {
    doctors: ['name', 'initial', 'color', 'photo_url'],
    doctor_weekly_schedules: ['doctor_id', 'weekday', 'period', 'end_time'],
    doctor_date_schedules: ['doctor_id', 'schedule_date', 'period', 'end_time'],
    doctor_closures: ['doctor_id', 'start_date', 'end_date'],
    notices: ['notice_date', 'title', 'content', 'image_url'],
    blog_posts: ['post_date', 'title', 'content', 'content_html', 'source', 'source_url', 'source_links', 'is_academic']
  };
  async function clientForWrite(table) {
    if (!Object.prototype.hasOwnProperty.call(columns, table)) throw new Error('저장 대상이 아닙니다.');
    if (!window.roleAccess || !window.roleAccess.isAdmin()) throw new Error('관리자 권한을 다시 확인해 주세요.');
    var client = window.supabaseClient;
    if (!client) throw new Error('DB에 연결할 수 없습니다.');
    // 저장 직전에도 서버가 확인한 계정의 역할을 다시 읽습니다.
    var user = await client.auth.getUser();
    if (user.error || !user.data || !user.data.user) throw new Error('로그인 후 다시 시도해 주세요.');
    var profile = await client.from('profiles').select('id,role').eq('id', user.data.user.id).maybeSingle();
    if (profile.error || !profile.data || profile.data.id !== user.data.user.id || profile.data.role !== 'admin' || !window.roleAccess.isAdmin()) {
      throw new Error('관리자 권한을 다시 확인해 주세요.');
    }
    return client;
  }
  function checkId(id) { if (!/^\d+$/.test(String(id))) throw new Error('저장된 항목을 다시 불러와 주세요.'); }
  window.adminStore = {
    verifyBlogWrite: function () { return clientForWrite('blog_posts'); },
    verifyDoctorWrite: function () { return clientForWrite('doctors'); },
    setBlogAcademic: async function (id, enabled) {
      checkId(id);
      var client = await clientForWrite('blog_posts');
      var result = await client.rpc('set_blog_academic', { p_id: Number(id), p_enabled: enabled });
      if (result.error) throw result.error;
      if (!result.data) throw new Error('저장 결과를 확인하지 못했습니다.');
      return result.data;
    },
    setGeneratedBlogDisplay: async function (id, enabled, date) {
      checkId(id);
      var client = await clientForWrite('blog_posts');
      var result = await client.rpc('set_blog_display', { p_id: Number(id), p_enabled: enabled, p_post_date: date });
      if (result.error) throw result.error;
      if (!result.data) throw new Error('저장 결과를 확인하지 못했습니다.');
      return result.data;
    },
    save: async function (table, values, id) {
      var client = await clientForWrite(table);
      // Generated posts are edited as private drafts, preserving their live approved copy.
      if (table === 'blog_posts' && id !== null && id !== undefined) {
        checkId(id);
        var original = await client.from('blog_posts').select('source_post_id').eq('id', id).maybeSingle();
        if (original.error) throw original.error;
        if (original.data && original.data.source_post_id) throw new Error('자동 생성 글은 자동 생성 글 영역에서 수정한 뒤 다시 게시하세요.');
      }
      var payload = {};
      columns[table].forEach(function (key) { payload[key] = values[key]; });
      if (table === 'doctor_weekly_schedules' || table === 'doctor_date_schedules') {
        if (!['morning', 'full'].includes(payload.period)) throw new Error('근무 구분을 확인해 주세요.');
        if (payload.period === 'full' && !['17:00', '19:00'].includes(payload.end_time)) throw new Error('종일 종료 시간을 선택해 주세요.');
        payload.end_time = payload.period === 'full' ? payload.end_time : null;
      }
      if (table === 'doctor_weekly_schedules') payload.weekday = Number(payload.weekday);
      if (table === 'notices') payload.image_url = payload.image_url || null;
      if (table === 'doctors') payload.photo_url = payload.photo_url || null;
      var query;
      if (id !== null && id !== undefined) { checkId(id); query = client.from(table).update(payload).eq('id', id); }
      else query = client.from(table).insert(payload);
      var result = await query.select('*').single();
      // 새 컬럼이 없는 DB에도 출처가 하나 이하면 기존 형식으로 저장합니다.
      while (table === 'blog_posts' && result.error && ['42703', 'PGRST204'].includes(result.error.code)) {
        var message = result.error.message || '';
        if (/source_links/i.test(message) && Object.prototype.hasOwnProperty.call(payload, 'source_links')) {
          if (Array.isArray(payload.source_links) && payload.source_links.length > 1) {
            throw new Error('여러 출처를 저장하려면 DB 업데이트를 먼저 적용해 주세요.');
          }
          delete payload.source_links;
        } else if (/source_url/i.test(message) && !payload.source_url && Object.prototype.hasOwnProperty.call(payload, 'source_url')) {
          delete payload.source_url;
        } else break;
        query = id !== null && id !== undefined ? client.from(table).update(payload).eq('id', id) : client.from(table).insert(payload);
        result = await query.select('*').single();
      }
      if (result.error) throw result.error;
      if (!result.data) throw new Error('저장 결과를 확인하지 못했습니다. 목록을 다시 불러와 주세요.');
      return result.data;
    },
    remove: async function (table, id) {
      checkId(id);
      var client = await clientForWrite(table);
      var result = await client.from(table).delete().eq('id', id).select('id').maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) throw new Error('삭제되지 않았습니다. 항목이나 삭제 권한을 확인해 주세요.');
      return result.data;
    }
  };
}());
