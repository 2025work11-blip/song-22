# 관리자 화면과 실제 DB 저장

admin.html에서 관리합니다. profiles.role이 admin으로 확인된 계정만 Drawer의 admin 버튼과 관리자 화면을 사용할 수 있습니다.

## 저장 대상

- 원장 정보: doctors
- 정기 진료 일정: doctor_weekly_schedules
- 날짜별 변경 일정: doctor_date_schedules
- 휴진 기간: doctor_closures
- 공지사항: notices

등록·편집창의 저장과 삭제는 실제 DB에 요청합니다. 서버가 성공 응답을 반환한 뒤에만 목록을 바꿉니다. 실패하면 입력값과 기존 목록을 유지합니다. 처리 중에는 중복 실행과 편집창 닫기를 막습니다.

홈페이지를 새로고침하면 DB 변경을 반영합니다. 휴진도 DB에서 조회하며 로컬 예시로 자동 대체하지 않습니다. 공지는 홈에서 최근 3개월만, 관리자 화면에서 전체 기간을 조회합니다.

DB 조회 실패 목록은 비우고 편집을 막습니다. 예시 행을 실제 DB 행처럼 수정하거나 삭제하지 않습니다.

## 읽기 전용

사용자가 선택한 범위에 따라 새 테이블은 추가하지 않았습니다. 병원 진료시간·원장소개·장비소개·질환 안내·홈페이지 설정은 기존 자료 확인만 가능하며 편집 버튼을 제공하지 않습니다.

## Supabase에서 실행할 SQL

1. 필요한 테이블이 없다면 sql/create-doctor-schedules.sql과 sql/create-notices.sql을 실행합니다.
2. 기존 profiles에서 관리자 계정의 role이 admin인지 확인합니다.
3. sql/enable-admin-writes.sql을 SQL Editor에서 실행합니다. 기존 공용 테이블 5개에 공개 조회와 관리자 전용 쓰기 정책·권한을 설정합니다. profiles 구조와 정책은 변경하지 않습니다.
4. 수정 파일을 배포하고 관리자 페이지를 새로고침합니다.

이 작업에서 원격 DB에 SQL을 직접 실행하지 않았습니다. 기존 쓰기 권한이 없다면 SQL 실행 전 저장은 거부됩니다.

## 권한과 파일

- js/role-access.js: 관리자 화면과 메뉴의 역할 검사
- js/admin-store.js: 저장 직전 Auth 계정·profiles 역할 재확인, 허용 테이블·컬럼과 항목 번호로 쓰기 제한
- js/admin.js: 목록, 편집, 저장·삭제 결과 표시
- js/schedule-data.js, js/home.js: DB 휴진을 포함한 홈 일정 표시
- sql/enable-admin-writes.sql: 관리자 쓰기 권한 설정

브라우저의 역할 검사와 별개로 DB 정책에서도 admin을 검사합니다. Secret Key·Service Role Key·Auth 관리자 API는 사용하지 않습니다. 실제 데이터 권한은 SQL 실행 후 DB에서 적용됩니다.

## 검증

공용 테이블 5개의 존재와 공개 조회를 확인했습니다. 모의 응답으로 저장·삭제 성공/실패, 역할 재확인, 중복 실행 방지, 실패 시 입력 유지, DB 휴진의 달력 반영을 검증했습니다. 실제 관리자 계정으로 운영 DB를 변경하거나 브라우저 시각 검증을 수행하지 않았습니다.
