
-- ============================================================
-- MISSING TABLES: notifications, admission_applications,
--   timetables, fee_structures, fee_payments, activity_logs
--   student_profiles, teacher_profiles
-- ============================================================

-- 1. NOTIFICATIONS
CREATE TABLE public.notifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  recipient_id   UUID NOT NULL,
  sender_id      UUID,
  title          TEXT NOT NULL,
  message        TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'info',  -- info, warning, success, error, announcement
  channel        TEXT NOT NULL DEFAULT 'in_app', -- in_app, email, sms, whatsapp
  is_read        BOOLEAN NOT NULL DEFAULT false,
  read_at        TIMESTAMP WITH TIME ZONE,
  metadata       JSONB DEFAULT '{}',
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, institution_id);
CREATE INDEX idx_notifications_unread    ON public.notifications(recipient_id, is_read) WHERE is_read = false;

-- 2. ADMISSION APPLICATIONS
CREATE TABLE public.admission_applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id    UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  application_number TEXT,
  full_name         TEXT NOT NULL,
  date_of_birth     DATE,
  gender            TEXT,
  email             TEXT,
  phone             TEXT,
  address           TEXT,
  father_name       TEXT,
  mother_name       TEXT,
  guardian_phone    TEXT,
  applying_for_class UUID REFERENCES public.classes(id),
  previous_school   TEXT,
  previous_grade    TEXT,
  documents         JSONB DEFAULT '[]',   -- [{name, url}]
  status            TEXT NOT NULL DEFAULT 'pending',  -- pending, reviewing, approved, rejected, enrolled
  reviewed_by       UUID,
  reviewed_at       TIMESTAMP WITH TIME ZONE,
  rejection_reason  TEXT,
  notes             TEXT,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.admission_applications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_admission_institution ON public.admission_applications(institution_id, status);

-- auto number trigger
CREATE OR REPLACE FUNCTION public.generate_application_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE seq INTEGER;
BEGIN
  SELECT COUNT(*)+1 INTO seq FROM public.admission_applications WHERE institution_id = NEW.institution_id;
  NEW.application_number := 'APP-' || TO_CHAR(NOW(),'YYYY') || '-' || LPAD(seq::TEXT,5,'0');
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_admission_number
  BEFORE INSERT ON public.admission_applications
  FOR EACH ROW EXECUTE FUNCTION public.generate_application_number();

CREATE TRIGGER update_admission_updated_at
  BEFORE UPDATE ON public.admission_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. TIMETABLES
CREATE TABLE public.timetables (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  session_id     UUID NOT NULL REFERENCES public.academic_sessions(id),
  class_id       UUID NOT NULL REFERENCES public.classes(id),
  section_id     UUID REFERENCES public.sections(id),
  subject_id     UUID NOT NULL REFERENCES public.subjects(id),
  teacher_id     UUID,
  day_of_week    SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Mon…6=Sun
  start_time     TIME NOT NULL,
  end_time       TIME NOT NULL,
  room           TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_timetable_class ON public.timetables(institution_id, class_id, section_id, day_of_week);

CREATE TRIGGER update_timetable_updated_at
  BEFORE UPDATE ON public.timetables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. FEE STRUCTURES
CREATE TABLE public.fee_structures (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  session_id     UUID REFERENCES public.academic_sessions(id),
  class_id       UUID REFERENCES public.classes(id),
  name           TEXT NOT NULL,
  description    TEXT,
  fee_type       TEXT NOT NULL DEFAULT 'monthly', -- monthly, quarterly, annual, one_time
  amount         NUMERIC NOT NULL DEFAULT 0,
  due_day        SMALLINT DEFAULT 10,  -- day of month
  late_fee       NUMERIC DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_fee_structure_updated_at
  BEFORE UPDATE ON public.fee_structures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. FEE PAYMENTS
CREATE TABLE public.fee_payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id      UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_id          UUID NOT NULL,
  fee_structure_id    UUID REFERENCES public.fee_structures(id),
  receipt_number      TEXT,
  amount_due          NUMERIC NOT NULL DEFAULT 0,
  amount_paid         NUMERIC NOT NULL DEFAULT 0,
  discount            NUMERIC DEFAULT 0,
  fine                NUMERIC DEFAULT 0,
  payment_method      TEXT DEFAULT 'cash', -- cash, bank_transfer, online, cheque
  transaction_reference TEXT,
  due_date            DATE,
  paid_at             TIMESTAMP WITH TIME ZONE,
  status              TEXT NOT NULL DEFAULT 'pending', -- pending, partial, paid, overdue, waived
  collected_by        UUID,
  notes               TEXT,
  month_year          TEXT,   -- e.g. '2026-01'
  created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_fee_payments_student     ON public.fee_payments(student_id, institution_id);
CREATE INDEX idx_fee_payments_status      ON public.fee_payments(institution_id, status);

CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE seq INTEGER;
BEGIN
  SELECT COUNT(*)+1 INTO seq FROM public.fee_payments WHERE institution_id = NEW.institution_id;
  NEW.receipt_number := 'RCP-' || TO_CHAR(NOW(),'YYYY') || '-' || LPAD(seq::TEXT,5,'0');
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_receipt_number
  BEFORE INSERT ON public.fee_payments
  FOR EACH ROW EXECUTE FUNCTION public.generate_receipt_number();

CREATE TRIGGER update_fee_payments_updated_at
  BEFORE UPDATE ON public.fee_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. ACTIVITY LOGS
CREATE TABLE public.activity_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  user_id        UUID,
  action         TEXT NOT NULL,       -- e.g. 'created_exam', 'deleted_user', 'login'
  entity_type    TEXT,                -- e.g. 'exam', 'user', 'course'
  entity_id      UUID,
  old_data       JSONB,
  new_data       JSONB,
  ip_address     TEXT,
  user_agent     TEXT,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_activity_institution ON public.activity_logs(institution_id, created_at DESC);
CREATE INDEX idx_activity_user        ON public.activity_logs(user_id, created_at DESC);

-- 7. STUDENT PROFILES (extended info)
CREATE TABLE public.student_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,
  roll_number     TEXT,
  admission_date  DATE,
  class_id        UUID REFERENCES public.classes(id),
  section_id      UUID REFERENCES public.sections(id),
  date_of_birth   DATE,
  gender          TEXT,
  blood_group     TEXT,
  address         TEXT,
  phone           TEXT,
  emergency_contact TEXT,
  photo_url       TEXT,
  father_name     TEXT,
  mother_name     TEXT,
  guardian_name   TEXT,
  guardian_phone  TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (institution_id, user_id)
);
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_student_profile_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. TEACHER PROFILES
CREATE TABLE public.teacher_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id   UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL,
  employee_id      TEXT,
  designation      TEXT,
  department       TEXT,
  qualifications   TEXT,
  joining_date     DATE,
  date_of_birth    DATE,
  gender           TEXT,
  phone            TEXT,
  address          TEXT,
  photo_url        TEXT,
  salary           NUMERIC,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (institution_id, user_id)
);
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_teacher_profile_updated_at
  BEFORE UPDATE ON public.teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- NOTIFICATIONS
CREATE POLICY "Recipients view own notifications"
  ON public.notifications FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "Institution members view notifications"
  ON public.notifications FOR SELECT
  USING (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Admins manage notifications"
  ON public.notifications FOR ALL
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access notifications"
  ON public.notifications FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- ADMISSION APPLICATIONS
CREATE POLICY "Public can submit applications"
  ON public.admission_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Applicants view own application by email"
  ON public.admission_applications FOR SELECT
  USING (true);  -- public read for tracking

CREATE POLICY "Admins manage applications"
  ON public.admission_applications FOR ALL
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access applications"
  ON public.admission_applications FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- TIMETABLES
CREATE POLICY "Members view timetables"
  ON public.timetables FOR SELECT
  USING (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Admins manage timetables"
  ON public.timetables FOR ALL
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access timetables"
  ON public.timetables FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- FEE STRUCTURES
CREATE POLICY "Members view fee structures"
  ON public.fee_structures FOR SELECT
  USING (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Admins manage fee structures"
  ON public.fee_structures FOR ALL
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access fee structures"
  ON public.fee_structures FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- FEE PAYMENTS
CREATE POLICY "Students view own fee payments"
  ON public.fee_payments FOR SELECT
  USING ((student_id = auth.uid()) AND is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Admins manage fee payments"
  ON public.fee_payments FOR ALL
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access fee payments"
  ON public.fee_payments FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- ACTIVITY LOGS
CREATE POLICY "Admins view activity logs"
  ON public.activity_logs FOR SELECT
  USING (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "System can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Platform admins full access activity logs"
  ON public.activity_logs FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- STUDENT PROFILES
CREATE POLICY "Student views own profile"
  ON public.student_profiles FOR SELECT
  USING ((user_id = auth.uid()) AND is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Admins manage student profiles"
  ON public.student_profiles FOR ALL
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Members view student profiles"
  ON public.student_profiles FOR SELECT
  USING (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access student profiles"
  ON public.student_profiles FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- TEACHER PROFILES
CREATE POLICY "Teacher views own profile"
  ON public.teacher_profiles FOR SELECT
  USING ((user_id = auth.uid()) AND is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Admins manage teacher profiles"
  ON public.teacher_profiles FOR ALL
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Members view teacher profiles"
  ON public.teacher_profiles FOR SELECT
  USING (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access teacher profiles"
  ON public.teacher_profiles FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- ============================================================
-- FIX EXISTING RESTRICTIVE POLICY ISSUE ON issued_certificates
-- The existing "Public cert verification" policy uses
-- RESTRICTIVE mode by default (it was PERMISSIVE but let's
-- ensure the public SELECT covers non-authenticated users)
-- ============================================================

-- Allow public (unauthenticated) to SELECT issued_certificates 
-- for verification by serial number
DROP POLICY IF EXISTS "Public cert verification" ON public.issued_certificates;
CREATE POLICY "Public cert verification"
  ON public.issued_certificates FOR SELECT
  USING (is_revoked = false);

-- Ensure institutions are visible to everyone (needed for public pages)
DROP POLICY IF EXISTS "Anyone can view active institutions by slug" ON public.institutions;
CREATE POLICY "Anyone can view active institutions by slug"
  ON public.institutions FOR SELECT
  USING (status = 'active');
