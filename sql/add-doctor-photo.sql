-- 기존 원장과 일정을 보존하면서 선택적인 사진 주소를 추가합니다.
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS photo_url text;
NOTIFY pgrst, 'reload schema';
