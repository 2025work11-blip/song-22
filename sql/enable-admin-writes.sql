-- Supabase SQL Editor에서 한 번에 실행합니다.
-- 먼저 원장 일정 4개 테이블, notices, profiles가 생성되어 있어야 합니다.
-- 새 테이블/컬럼이나 profiles 역할 변경은 없습니다.
-- 공개 조회는 유지하고 profiles.role = admin인 계정만 저장/수정/삭제합니다.
BEGIN;

DO $$
DECLARE
  table_name text;
  admin_check text := 'EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = ''admin'')';
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'profiles 테이블을 먼저 생성해 주세요.';
  END IF;

  FOREACH table_name IN ARRAY ARRAY[
    'doctors', 'doctor_weekly_schedules', 'doctor_date_schedules',
    'doctor_closures', 'notices'
  ] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NULL THEN
      RAISE EXCEPTION '% 테이블을 먼저 생성해 주세요.', table_name;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated', table_name);

    -- 홈페이지의 기존 공개 조회를 유지합니다.
    EXECUTE format('DROP POLICY IF EXISTS website_public_read ON public.%I', table_name);
    EXECUTE format('CREATE POLICY website_public_read ON public.%I FOR SELECT TO anon, authenticated USING (true)', table_name);

    -- 관리자에게만 쓰기를 허용합니다.
    EXECUTE format('DROP POLICY IF EXISTS website_admin_manage ON public.%I', table_name);
    EXECUTE format('CREATE POLICY website_admin_manage ON public.%I FOR ALL TO authenticated USING (%s) WITH CHECK (%s)', table_name, admin_check, admin_check);

    -- 다른 허용 정책이 있더라도 일반 사용자 쓰기를 허용하지 않도록 제한합니다.
    EXECUTE format('DROP POLICY IF EXISTS website_admin_insert_guard ON public.%I', table_name);
    EXECUTE format('CREATE POLICY website_admin_insert_guard ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (%s)', table_name, admin_check);
    EXECUTE format('DROP POLICY IF EXISTS website_admin_update_guard ON public.%I', table_name);
    EXECUTE format('CREATE POLICY website_admin_update_guard ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)', table_name, admin_check, admin_check);
    EXECUTE format('DROP POLICY IF EXISTS website_admin_delete_guard ON public.%I', table_name);
    EXECUTE format('CREATE POLICY website_admin_delete_guard ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING (%s)', table_name, admin_check);

    EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', table_name);

    -- 자동 번호 생성은 관리자 쓰기 요청 시 필요합니다. 실제 쓰기는 위 정책이 검사합니다.
    EXECUTE format('REVOKE ALL PRIVILEGES ON SEQUENCE public.%I FROM PUBLIC, anon, authenticated', table_name || '_id_seq');
    EXECUTE format('GRANT USAGE ON SEQUENCE public.%I TO authenticated', table_name || '_id_seq');
  END LOOP;
END;
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
COMMIT;
