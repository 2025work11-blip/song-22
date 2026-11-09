-- 병원소개에서 항목을 제거해도 메인 달력의 원장 및 일정을 보존합니다.
BEGIN;
ALTER TABLE public.doctor_about_profiles ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;
ALTER TABLE public.doctor_about_schedules ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;
NOTIFY pgrst, 'reload schema';
COMMIT;
