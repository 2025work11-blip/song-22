// 기존 공용 테이블만 저장합니다. 실제 쓰기 권한은 DB의 관리자 RLS로 제한합니다.
(function () {
  'use strict';
  var columns = {
    doctors: ['name', 'initial', 'color'],
    doctor_weekly_schedules: ['doctor_id', 'weekday', 'period'],
    doctor_date_schedules: ['doctor_id', 'schedule_date', 'period'],
    doctor_closures: ['doctor_id', 'start_date', 'end_date'],
    notices: ['notice_date', 'title', 'content', 'image_url']
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
    save: async function (table, values, id) {
      var client = await clientForWrite(table);
      var payload = {};
      columns[table].forEach(function (key) { payload[key] = values[key]; });
      if (table === 'doctor_weekly_schedules') payload.weekday = Number(payload.weekday);
      if (table === 'notices') payload.image_url = payload.image_url || null;
      var query;
      if (id !== null && id !== undefined) { checkId(id); query = client.from(table).update(payload).eq('id', id); }
      else query = client.from(table).insert(payload);
      var result = await query.select('*').single();
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
