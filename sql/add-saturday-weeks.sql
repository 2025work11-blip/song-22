-- 기존 정기 일정을 매주 근무로 유지하면서 토요일 근무 주차를 선택합니다.
BEGIN;
ALTER TABLE public.doctor_weekly_schedules
  ADD COLUMN IF NOT EXISTS saturday_weeks text NOT NULL DEFAULT 'all'
  CHECK (saturday_weeks IN ('all', 'first_third', 'second_fourth'));
NOTIFY pgrst, 'reload schema';
COMMIT;
