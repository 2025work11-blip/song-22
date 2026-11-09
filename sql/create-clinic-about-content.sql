BEGIN;
CREATE TABLE IF NOT EXISTS public.clinic_hours (
  id text PRIMARY KEY CHECK (id IN ('weekday', 'saturday', 'holiday', 'substitute', 'lunch')),
  start_time time NOT NULL, end_time time NOT NULL, CHECK (end_time > start_time)
);
INSERT INTO public.clinic_hours (id, start_time, end_time) VALUES
  ('weekday','08:30','19:00'), ('saturday','08:30','17:00'), ('holiday','08:30','13:00'),
  ('substitute','08:30','19:00'), ('lunch','12:30','14:00') ON CONFLICT (id) DO NOTHING;
CREATE TABLE IF NOT EXISTS public.doctor_about_profiles (
  doctor_id bigint PRIMARY KEY REFERENCES public.doctors(id) ON DELETE CASCADE,
  greeting text NOT NULL DEFAULT '',
  career jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(career) = 'array'),
  activities jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(activities) = 'array'),
  specialties jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(specialties) = 'array')
);
ALTER TABLE public.clinic_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_about_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.clinic_hours, public.doctor_about_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.clinic_hours, public.doctor_about_profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.clinic_hours, public.doctor_about_profiles TO authenticated;
DROP POLICY IF EXISTS clinic_hours_read ON public.clinic_hours;
CREATE POLICY clinic_hours_read ON public.clinic_hours FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS clinic_hours_admin_write ON public.clinic_hours;
CREATE POLICY clinic_hours_admin_write ON public.clinic_hours FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
DROP POLICY IF EXISTS about_profiles_read ON public.doctor_about_profiles;
CREATE POLICY about_profiles_read ON public.doctor_about_profiles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS about_profiles_admin_write ON public.doctor_about_profiles;
CREATE POLICY about_profiles_admin_write ON public.doctor_about_profiles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
NOTIFY pgrst, 'reload schema';
COMMIT;
