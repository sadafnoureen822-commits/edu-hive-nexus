
-- ============================================================
-- REMAINING MISSING TABLES
-- login_logs, api_keys, student_promotions, announcements,
-- email_logs, sms_logs, verification_records
-- ============================================================

-- 1. LOGIN LOGS
CREATE TABLE public.login_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  email          TEXT,
  action         TEXT NOT NULL DEFAULT 'login', -- login, logout, failed_login, password_reset
  ip_address     TEXT,
  user_agent     TEXT,
  location       TEXT,
  success        BOOLEAN NOT NULL DEFAULT true,
  failure_reason TEXT,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_login_logs_user        ON public.login_logs(user_id, created_at DESC);
CREATE INDEX idx_login_logs_institution ON public.login_logs(institution_id, created_at DESC);

-- 2. API KEYS
CREATE TABLE public.api_keys (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  created_by     UUID NOT NULL,
  name           TEXT NOT NULL,
  key_prefix     TEXT NOT NULL,  -- first 8 chars shown publicly
  key_hash       TEXT NOT NULL,  -- bcrypt/sha256 hash of full key
  scopes         TEXT[] DEFAULT ARRAY['read'],  -- read, write, admin
  last_used_at   TIMESTAMP WITH TIME ZONE,
  expires_at     TIMESTAMP WITH TIME ZONE,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_api_keys_institution ON public.api_keys(institution_id);

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. STUDENT PROMOTIONS
CREATE TABLE public.student_promotions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id    UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_id        UUID NOT NULL,
  from_session_id   UUID NOT NULL REFERENCES public.academic_sessions(id),
  to_session_id     UUID NOT NULL REFERENCES public.academic_sessions(id),
  from_class_id     UUID NOT NULL REFERENCES public.classes(id),
  to_class_id       UUID NOT NULL REFERENCES public.classes(id),
  from_section_id   UUID REFERENCES public.sections(id),
  to_section_id     UUID REFERENCES public.sections(id),
  promotion_type    TEXT NOT NULL DEFAULT 'promoted', -- promoted, repeated, transferred, graduated
  promoted_by       UUID,
  remarks           TEXT,
  promoted_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.student_promotions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_promotions_student     ON public.student_promotions(student_id, institution_id);
CREATE INDEX idx_promotions_institution ON public.student_promotions(institution_id, promoted_at DESC);

-- 4. ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  created_by     UUID,
  title          TEXT NOT NULL,
  content        TEXT NOT NULL,
  audience       TEXT[] DEFAULT ARRAY['all'], -- all, students, teachers, parents, staff
  class_ids      UUID[] DEFAULT ARRAY[]::UUID[],  -- empty = all classes
  is_published   BOOLEAN NOT NULL DEFAULT false,
  is_pinned      BOOLEAN NOT NULL DEFAULT false,
  publish_date   DATE,
  expire_date    DATE,
  attachment_url TEXT,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_announcements_institution ON public.announcements(institution_id, is_published, created_at DESC);

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. EMAIL LOGS
CREATE TABLE public.email_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  sent_by         UUID,
  recipient_email TEXT NOT NULL,
  recipient_name  TEXT,
  subject         TEXT NOT NULL,
  body            TEXT,
  template_id     TEXT,
  status          TEXT NOT NULL DEFAULT 'sent', -- sent, failed, bounced, delivered
  message_id      TEXT,
  error_message   TEXT,
  audience        TEXT,
  sent_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_email_logs_institution ON public.email_logs(institution_id, sent_at DESC);

-- 6. SMS LOGS
CREATE TABLE public.sms_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  sent_by         UUID,
  recipient_phone TEXT NOT NULL,
  recipient_name  TEXT,
  message         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'sent',
  message_id      TEXT,
  error_message   TEXT,
  audience        TEXT,
  cost            NUMERIC DEFAULT 0,
  sent_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sms_logs_institution ON public.sms_logs(institution_id, sent_at DESC);

-- 7. CERTIFICATE VERIFICATION RECORDS
CREATE TABLE public.verification_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id  UUID NOT NULL REFERENCES public.issued_certificates(id) ON DELETE CASCADE,
  institution_id  UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  verified_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address      TEXT,
  user_agent      TEXT,
  verifier_name   TEXT,
  verifier_org    TEXT,
  result          TEXT NOT NULL DEFAULT 'valid' -- valid, invalid, revoked
);
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_verification_cert        ON public.verification_records(certificate_id, verified_at DESC);
CREATE INDEX idx_verification_institution ON public.verification_records(institution_id, verified_at DESC);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- LOGIN LOGS: only the user themselves and admins
CREATE POLICY "Users view own login logs"
  ON public.login_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins view institution login logs"
  ON public.login_logs FOR SELECT
  USING (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "System can insert login logs"
  ON public.login_logs FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access login logs"
  ON public.login_logs FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- API KEYS
CREATE POLICY "Admins manage api keys"
  ON public.api_keys FOR ALL
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access api keys"
  ON public.api_keys FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- STUDENT PROMOTIONS
CREATE POLICY "Members view promotions"
  ON public.student_promotions FOR SELECT
  USING (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Admins manage promotions"
  ON public.student_promotions FOR ALL
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access promotions"
  ON public.student_promotions FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- ANNOUNCEMENTS
CREATE POLICY "Members view published announcements"
  ON public.announcements FOR SELECT
  USING (is_institution_member(auth.uid(), institution_id) AND is_published = true);

CREATE POLICY "Admins manage announcements"
  ON public.announcements FOR ALL
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Public view published announcements"
  ON public.announcements FOR SELECT
  USING (
    is_published = true AND
    institution_id IN (SELECT id FROM public.institutions WHERE status = 'active')
  );

CREATE POLICY "Platform admins full access announcements"
  ON public.announcements FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- EMAIL LOGS
CREATE POLICY "Admins view email logs"
  ON public.email_logs FOR SELECT
  USING (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "System insert email logs"
  ON public.email_logs FOR INSERT
  WITH CHECK (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access email logs"
  ON public.email_logs FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- SMS LOGS
CREATE POLICY "Admins view sms logs"
  ON public.sms_logs FOR SELECT
  USING (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "System insert sms logs"
  ON public.sms_logs FOR INSERT
  WITH CHECK (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access sms logs"
  ON public.sms_logs FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- VERIFICATION RECORDS
CREATE POLICY "Admins view verification records"
  ON public.verification_records FOR SELECT
  USING (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Public can insert verification records"
  ON public.verification_records FOR INSERT
  WITH CHECK (
    institution_id IN (SELECT id FROM public.institutions WHERE status = 'active')
  );

CREATE POLICY "Platform admins full access verification"
  ON public.verification_records FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));
