-- 병원소개 프로필 사진을 메인 일정표 사진과 별도로 보관합니다.
ALTER TABLE public.doctor_about_profiles ADD COLUMN IF NOT EXISTS profile_photo_url text;
NOTIFY pgrst, 'reload schema';
