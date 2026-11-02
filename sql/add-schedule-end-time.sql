-- Supabase SQL Editor에서 한 번 실행합니다. 기존 일정은 보존합니다.
-- NULL인 기존 종일 일정은 토요일 17시, 그 외 19시로 표시합니다.
BEGIN;
ALTER TABLE public.doctor_weekly_schedules
  ADD COLUMN IF NOT EXISTS end_time time
  CHECK (end_time IN (TIME '17:00', TIME '19:00'));
ALTER TABLE public.doctor_date_schedules
  ADD COLUMN IF NOT EXISTS end_time time
  CHECK (end_time IN (TIME '17:00', TIME '19:00'));
NOTIFY pgrst, 'reload schema';
COMMIT;
