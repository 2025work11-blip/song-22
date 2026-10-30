// 원장 일정에 필요한 공개 테이블만 조회합니다. 환자 정보는 조회하지 않습니다.
(function () {
  'use strict';
  window.loadDoctorScheduleData = async function () {
    var client = window.supabaseClient;
    if (!client) throw new Error('일정 조회 연결을 사용할 수 없습니다.');

    // 날짜별 일정이 늘어나도 기본 조회 건수 제한으로 누락되지 않게 나눠 읽습니다.
    async function readRows(table, columns) {
      var rows = [];
      var size = 1000;
      while (true) {
        var result = await client.from(table).select(columns).order('id')
          .range(rows.length, rows.length + size - 1);
        if (result.error) throw result.error;
        if (!Array.isArray(result.data)) throw new Error('일정 조회 결과를 확인할 수 없습니다.');
        rows = rows.concat(result.data);
        if (result.data.length < size) return rows;
      }
    }
    var result = await Promise.all([
      readRows('doctors', 'id,name,initial,color'),
      readRows('doctor_weekly_schedules', 'id,doctor_id,weekday,period'),
      readRows('doctor_date_schedules', 'id,doctor_id,schedule_date,period'),
      readRows('doctor_closures', 'id,doctor_id,start_date,end_date')
    ]);
    // 기존 달력의 표시 형태로 변환하여 디자인과 근무 구분을 유지합니다.
    var doctors = result[0].map(function (doctor) {
      var weekly = result[1].filter(function (row) { return String(row.doctor_id) === String(doctor.id); });
      return {
        id: String(doctor.id), name: doctor.name, initial: doctor.initial, color: doctor.color,
        weekdays: weekly.map(function (row) { return Number(row.weekday); }),
        morningOnly: weekly.filter(function (row) { return row.period === 'morning'; })
          .map(function (row) { return Number(row.weekday); })
      };
    });
    var schedules = result[2].filter(function (row) {
      return doctors.some(function (doctor) { return doctor.id === String(row.doctor_id); });
    }).map(function (row) {
      return {
        doctorId: String(row.doctor_id), date: row.schedule_date, period: row.period,
        time: row.period === 'morning' ? '오전 진료만' : '종일 진료'
      };
    });
    var closures = result[3].map(function (row) {
      var doctor = doctors.find(function (item) { return item.id === String(row.doctor_id); });
      return doctor ? { doctorId: doctor.id, doctorName: doctor.name, startDate: row.start_date, endDate: row.end_date } : null;
    }).filter(Boolean);
    return { doctors: doctors, schedules: schedules, closures: closures };
  };
}());
