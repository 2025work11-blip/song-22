-- create-doctor-schedules.sql 실행 후 사용합니다.
-- 기존 원장 데이터에 요청받은 휴진 두 건만 연결합니다.
BEGIN;

-- 이름이 없거나 같은 이름이 여러 명이면 잘못 연결하지 않고 중단합니다.
DO $$
BEGIN
  IF (SELECT count(*) FROM public.doctors WHERE name = 'AAA원장') <> 1
     OR (SELECT count(*) FROM public.doctors WHERE name = 'BBB원장') <> 1 THEN
    RAISE EXCEPTION 'doctors에 AAA원장과 BBB원장이 각각 한 명씩 등록되어 있어야 합니다. 원장 데이터를 먼저 확인해 주세요.';
  END IF;
END;
$$;

-- 시작일과 종료일을 포함합니다. 동일 기간 재실행 시 중복 등록하지 않습니다.
INSERT INTO public.doctor_closures (doctor_id, start_date, end_date)
SELECT doctor.id, closure.start_date, closure.end_date
FROM (
  VALUES
    ('AAA원장', DATE '2026-11-10', DATE '2026-11-20'),
    ('BBB원장', DATE '2026-11-25', DATE '2026-11-30')
) AS closure (doctor_name, start_date, end_date)
JOIN public.doctors AS doctor ON doctor.name = closure.doctor_name
ON CONFLICT (doctor_id, start_date, end_date) DO NOTHING;

COMMIT;
