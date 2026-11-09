-- 병원소개 표는 메인 달력의 진료 일정과 별도로 관리합니다.
CREATE TABLE IF NOT EXISTS public.doctor_about_schedules (
  doctor_id bigint PRIMARY KEY REFERENCES public.doctors(id) ON DELETE CASCADE,
  schedule jsonb NOT NULL CHECK (jsonb_typeof(schedule) = 'object')
);
ALTER TABLE public.doctor_about_schedules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.doctor_about_schedules FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.doctor_about_schedules TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.doctor_about_schedules TO authenticated;
DROP POLICY IF EXISTS about_schedules_read ON public.doctor_about_schedules;
CREATE POLICY about_schedules_read ON public.doctor_about_schedules FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS about_schedules_admin_insert ON public.doctor_about_schedules;
CREATE POLICY about_schedules_admin_insert ON public.doctor_about_schedules FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
DROP POLICY IF EXISTS about_schedules_admin_update ON public.doctor_about_schedules;
CREATE POLICY about_schedules_admin_update ON public.doctor_about_schedules FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
DROP POLICY IF EXISTS about_schedules_admin_delete ON public.doctor_about_schedules;
CREATE POLICY about_schedules_admin_delete ON public.doctor_about_schedules FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
NOTIFY pgrst, 'reload schema';
