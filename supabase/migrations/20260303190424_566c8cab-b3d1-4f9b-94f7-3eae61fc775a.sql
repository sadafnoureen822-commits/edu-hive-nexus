
-- Attendance table (without function in UNIQUE constraint)
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  class_id UUID REFERENCES public.classes(id),
  section_id UUID REFERENCES public.sections(id),
  subject_id UUID REFERENCES public.subjects(id),
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS attendance_unique_daily
  ON public.attendance(institution_id, student_id, date)
  WHERE subject_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS attendance_unique_subject
  ON public.attendance(institution_id, student_id, date, subject_id)
  WHERE subject_id IS NOT NULL;

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage attendance"
  ON public.attendance FOR ALL
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Members manage attendance"
  ON public.attendance FOR ALL
  USING (is_institution_member(auth.uid(), institution_id))
  WITH CHECK (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access attendance"
  ON public.attendance FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- WhatsApp message logs
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  sent_by UUID,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  message_id TEXT,
  error_message TEXT,
  audience TEXT DEFAULT 'individual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whatsapp logs"
  ON public.whatsapp_logs FOR ALL
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access whatsapp logs"
  ON public.whatsapp_logs FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_attendance_institution_date ON public.attendance(institution_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_institution ON public.whatsapp_logs(institution_id);
