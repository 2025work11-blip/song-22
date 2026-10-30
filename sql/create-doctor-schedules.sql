-- Supabase SQL Editor에서 전체 실행합니다.
-- 기존 원장/정기/날짜별 일정 테이블이 있으면 유지하고, 휴진 기간 테이블을 추가합니다.
-- 테이블이 없는 새 환경에서는 아래 순서로 네 테이블을 생성합니다.
-- 기존 테이블의 구조를 변경하거나 데이터를 삭제하지 않습니다.
BEGIN;

-- 1. 원장 이름, 달력 표시 문자와 구분 색상
CREATE TABLE IF NOT EXISTS public.doctors (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  initial text NOT NULL,
  color text NOT NULL
);

-- 2. 매주 반복되는 원장별 진료 일정
-- 요일: 일요일 0 ~ 토요일 6 / morning: 오전 / full: 종일
CREATE TABLE IF NOT EXISTS public.doctor_weekly_schedules (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id bigint NOT NULL REFERENCES public.doctors (id),
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  period text NOT NULL CHECK (period IN ('morning', 'full')),
  CONSTRAINT doctor_weekly_schedules_doctor_weekday_unique
    UNIQUE (doctor_id, weekday)
);

-- 3. 특정 날짜의 변경 진료 일정
-- 해당 원장의 같은 날짜 정기 일정 대신 적용합니다.
CREATE TABLE IF NOT EXISTS public.doctor_date_schedules (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id bigint NOT NULL REFERENCES public.doctors (id),
  schedule_date date NOT NULL,
  period text NOT NULL CHECK (period IN ('morning', 'full')),
  CONSTRAINT doctor_date_schedules_doctor_date_unique
    UNIQUE (doctor_id, schedule_date)
);

-- 4. 원장별 특별 휴진 기간
-- 시작일과 종료일을 모두 포함하며, 휴진 기간은 진료 일정보다 우선합니다.
-- 빨간 휴진 버튼과 달력 기간 띠에 사용할 데이터입니다.
CREATE TABLE IF NOT EXISTS public.doctor_closures (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id bigint NOT NULL REFERENCES public.doctors (id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  CONSTRAINT doctor_closures_valid_dates CHECK (end_date >= start_date),
  CONSTRAINT doctor_closures_doctor_period_unique
    UNIQUE (doctor_id, start_date, end_date)
);

-- 공용 일정은 로그인 여부와 관계없이 조회만 허용합니다.
-- 브라우저에서 등록/수정/삭제할 권한은 부여하지 않습니다.
REVOKE ALL PRIVILEGES ON TABLE
  public.doctors,
  public.doctor_weekly_schedules,
  public.doctor_date_schedules,
  public.doctor_closures
FROM PUBLIC, anon, authenticated;

REVOKE ALL PRIVILEGES ON SEQUENCE
  public.doctors_id_seq,
  public.doctor_weekly_schedules_id_seq,
  public.doctor_date_schedules_id_seq,
  public.doctor_closures_id_seq
FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE
  public.doctors,
  public.doctor_weekly_schedules,
  public.doctor_date_schedules,
  public.doctor_closures
TO anon, authenticated;

-- 인증 테이블, 사용자별 데이터, RLS 정책은 생성하지 않습니다.
COMMIT;

-- 요청한 휴진 예시를 넣으려면 원장 데이터가 등록된 상태에서
-- sql/seed-doctor-closures.sql을 이어서 실행합니다.
