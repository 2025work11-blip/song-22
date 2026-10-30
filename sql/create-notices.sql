BEGIN;

-- 공지사항: 날짜, 제목, 본문, 선택 사항인 이미지 주소를 저장합니다.
-- 이미지 파일 자체가 아니라 공개 이미지 URL을 저장합니다.
CREATE TABLE IF NOT EXISTS public.notices (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  notice_date date NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  image_url text
);

-- 앞서 이미지 없이 notices를 만든 경우에도 사용할 수 있습니다.
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS image_url text;

-- 누구나 조회할 수 있고 브라우저에서 등록·수정·삭제할 수는 없습니다.
REVOKE ALL PRIVILEGES ON TABLE public.notices FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.notices TO anon, authenticated;

-- RLS 정책과 관리자 등록 기능은 이번 SQL에 포함하지 않습니다.
COMMIT;
