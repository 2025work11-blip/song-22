(async function () {
  'use strict';
  var lists = document.querySelectorAll('[data-clinic-hours]');
  if (!lists.length || !window.supabaseClient) return;
  var keys = ['weekday', 'saturday', 'holiday', 'substitute', 'lunch'];
  function time(value) {
    var parts = String(value).split(':').map(Number), hour = parts[0];
    if (!Number.isInteger(hour) || !Number.isInteger(parts[1])) return '';
    return (hour < 12 ? '오전 ' : '오후 ') + (hour % 12 || 12) + ':' + String(parts[1]).padStart(2, '0');
  }
  try {
    var result = await window.supabaseClient.from('clinic_hours').select('id,start_time,end_time');
    if (result.error || !Array.isArray(result.data)) return;
    lists.forEach(function (list) {
      var rows = list.querySelectorAll(':scope > div');
      keys.forEach(function (key, index) {
        var entry = result.data.find(function (row) { return row.id === key; });
        var target = rows[index] && rows[index].querySelector('dd');
        if (entry && target && time(entry.start_time) && time(entry.end_time)) target.textContent = time(entry.start_time) + ' ~ ' + time(entry.end_time);
      });
    });
  } catch (error) { /* 연결 실패 시 기존 안내를 유지합니다. */ }
}());
