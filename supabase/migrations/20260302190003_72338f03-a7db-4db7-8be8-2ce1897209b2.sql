
-- ============================================================
-- LMS CORE SCHEMA: Courses, Lessons, Assignments, Quizzes,
-- Student Marks, Certificates
-- ============================================================

-- ----- COURSES -----
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_courses_institution ON public.courses(institution_id);

-- ----- COURSE LESSONS -----
CREATE TABLE public.course_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  file_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_lessons_course ON public.course_lessons(course_id);

-- ----- COURSE ENROLLMENTS -----
CREATE TABLE public.course_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(course_id, student_id)
);
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_enrollments_course ON public.course_enrollments(course_id);
CREATE INDEX idx_enrollments_student ON public.course_enrollments(student_id);

-- ----- LESSON PROGRESS -----
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(lesson_id, student_id)
);
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- ----- ASSIGNMENTS -----
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  total_marks NUMERIC NOT NULL DEFAULT 100,
  passing_marks NUMERIC NOT NULL DEFAULT 40,
  created_by UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed')),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_assignments_institution ON public.assignments(institution_id);
CREATE INDEX idx_assignments_course ON public.assignments(course_id);

-- ----- ASSIGNMENT SUBMISSIONS -----
CREATE TABLE public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  file_url TEXT,
  notes TEXT,
  marks_obtained NUMERIC,
  feedback TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned')),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_student ON public.assignment_submissions(student_id);

-- ----- QUIZZES -----
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  total_marks NUMERIC NOT NULL DEFAULT 100,
  passing_marks NUMERIC NOT NULL DEFAULT 40,
  max_attempts INTEGER NOT NULL DEFAULT 1,
  created_by UUID,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_quizzes_institution ON public.quizzes(institution_id);

-- ----- QUIZ QUESTIONS -----
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'true_false', 'short_answer')),
  marks NUMERIC NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_questions_quiz ON public.quiz_questions(quiz_id);

-- ----- QUIZ OPTIONS -----
CREATE TABLE public.quiz_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_options_question ON public.quiz_options(question_id);

-- ----- QUIZ ATTEMPTS -----
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  marks_obtained NUMERIC,
  percentage NUMERIC,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  time_taken_seconds INTEGER
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_attempts_student ON public.quiz_attempts(student_id);

-- ----- QUIZ ANSWERS -----
CREATE TABLE public.quiz_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.quiz_options(id) ON DELETE SET NULL,
  text_answer TEXT,
  is_correct BOOLEAN,
  marks_awarded NUMERIC
);
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- ----- STUDENT MARKS (Extends exam_subjects) -----
CREATE TABLE public.student_marks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_subject_id UUID NOT NULL REFERENCES public.exam_subjects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  theory_marks NUMERIC,
  practical_marks NUMERIC,
  viva_marks NUMERIC,
  total_marks NUMERIC GENERATED ALWAYS AS (
    COALESCE(theory_marks, 0) + COALESCE(practical_marks, 0) + COALESCE(viva_marks, 0)
  ) STORED,
  grace_marks_applied NUMERIC DEFAULT 0,
  is_absent BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved', 'rejected')),
  submitted_by UUID,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  remarks TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(exam_subject_id, student_id)
);
ALTER TABLE public.student_marks ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_student_marks_exam_subject ON public.student_marks(exam_subject_id);
CREATE INDEX idx_student_marks_student ON public.student_marks(student_id);
CREATE INDEX idx_student_marks_institution ON public.student_marks(institution_id);

-- ----- CERTIFICATE TEMPLATES -----
CREATE TABLE public.certificate_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'certificate' CHECK (template_type IN ('certificate', 'transcript', 'result_card')),
  template_html TEXT,
  background_url TEXT,
  logo_url TEXT,
  signature_urls JSONB DEFAULT '[]'::jsonb,
  fields JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_cert_templates_institution ON public.certificate_templates(institution_id);

-- ----- ISSUED CERTIFICATES -----
CREATE TABLE public.issued_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.certificate_templates(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL,
  certificate_data JSONB DEFAULT '{}'::jsonb,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(institution_id, serial_number)
);
ALTER TABLE public.issued_certificates ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_issued_certs_institution ON public.issued_certificates(institution_id);
CREATE INDEX idx_issued_certs_student ON public.issued_certificates(student_id);
CREATE INDEX idx_issued_certs_serial ON public.issued_certificates(serial_number);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- COURSES
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Members view published courses" ON public.courses FOR SELECT USING (is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access courses" ON public.courses FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- COURSE LESSONS
CREATE POLICY "Admins manage lessons" ON public.course_lessons FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Members view published lessons" ON public.course_lessons FOR SELECT USING (is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access lessons" ON public.course_lessons FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- COURSE ENROLLMENTS
CREATE POLICY "Admins manage enrollments" ON public.course_enrollments FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Students view own enrollments" ON public.course_enrollments FOR SELECT USING (student_id = auth.uid() AND is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Students enroll themselves" ON public.course_enrollments FOR INSERT WITH CHECK (student_id = auth.uid() AND is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access enrollments" ON public.course_enrollments FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- LESSON PROGRESS
CREATE POLICY "Admins view lesson progress" ON public.lesson_progress FOR SELECT USING (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Students manage own progress" ON public.lesson_progress FOR ALL USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "Platform admins full access progress" ON public.lesson_progress FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- ASSIGNMENTS
CREATE POLICY "Admins manage assignments" ON public.assignments FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Members view assignments" ON public.assignments FOR SELECT USING (is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access assignments" ON public.assignments FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- ASSIGNMENT SUBMISSIONS
CREATE POLICY "Admins manage submissions" ON public.assignment_submissions FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Students manage own submissions" ON public.assignment_submissions FOR ALL USING (student_id = auth.uid() AND is_institution_member(auth.uid(), institution_id)) WITH CHECK (student_id = auth.uid() AND is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access submissions" ON public.assignment_submissions FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- QUIZZES
CREATE POLICY "Admins manage quizzes" ON public.quizzes FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Members view published quizzes" ON public.quizzes FOR SELECT USING (is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access quizzes" ON public.quizzes FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- QUIZ QUESTIONS
CREATE POLICY "Admins manage questions" ON public.quiz_questions FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Members view questions" ON public.quiz_questions FOR SELECT USING (is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access questions" ON public.quiz_questions FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- QUIZ OPTIONS
CREATE POLICY "Admins manage options" ON public.quiz_options FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Members view options" ON public.quiz_options FOR SELECT USING (is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access options" ON public.quiz_options FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- QUIZ ATTEMPTS
CREATE POLICY "Admins view all attempts" ON public.quiz_attempts FOR SELECT USING (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Students manage own attempts" ON public.quiz_attempts FOR ALL USING (student_id = auth.uid() AND is_institution_member(auth.uid(), institution_id)) WITH CHECK (student_id = auth.uid() AND is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access attempts" ON public.quiz_attempts FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- QUIZ ANSWERS
CREATE POLICY "Admins view all answers" ON public.quiz_answers FOR SELECT USING (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Students manage own answers" ON public.quiz_answers FOR ALL USING (is_institution_member(auth.uid(), institution_id)) WITH CHECK (is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access answers" ON public.quiz_answers FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- STUDENT MARKS
CREATE POLICY "Admins manage student marks" ON public.student_marks FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Teachers submit marks" ON public.student_marks FOR ALL USING (is_institution_member(auth.uid(), institution_id)) WITH CHECK (is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Students view own approved marks" ON public.student_marks FOR SELECT USING (student_id = auth.uid() AND status = 'approved');
CREATE POLICY "Platform admins full access marks" ON public.student_marks FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- CERTIFICATE TEMPLATES
CREATE POLICY "Admins manage cert templates" ON public.certificate_templates FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Members view active templates" ON public.certificate_templates FOR SELECT USING (is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access cert templates" ON public.certificate_templates FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- ISSUED CERTIFICATES
CREATE POLICY "Admins manage issued certs" ON public.issued_certificates FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Students view own certs" ON public.issued_certificates FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Public cert verification" ON public.issued_certificates FOR SELECT USING (is_revoked = false);
CREATE POLICY "Platform admins full access issued certs" ON public.issued_certificates FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- ============================================================
-- STORAGE: Course materials & assignment uploads
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('course-materials', 'course-materials', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('assignment-submissions', 'assignment-submissions', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Institution members access course materials" ON storage.objects FOR SELECT USING (bucket_id = 'course-materials' AND auth.uid() IS NOT NULL);
CREATE POLICY "Admins upload course materials" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'course-materials' AND auth.uid() IS NOT NULL);
CREATE POLICY "Admins update course materials" ON storage.objects FOR UPDATE USING (bucket_id = 'course-materials' AND auth.uid() IS NOT NULL);
CREATE POLICY "Admins delete course materials" ON storage.objects FOR DELETE USING (bucket_id = 'course-materials' AND auth.uid() IS NOT NULL);

CREATE POLICY "Students upload submissions" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assignment-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Students view own submissions" ON storage.objects FOR SELECT USING (bucket_id = 'assignment-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins view all submissions" ON storage.objects FOR SELECT USING (bucket_id = 'assignment-submissions' AND auth.uid() IS NOT NULL);

CREATE POLICY "Public read certificates" ON storage.objects FOR SELECT USING (bucket_id = 'certificates');
CREATE POLICY "Admins upload certificates" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'certificates' AND auth.uid() IS NOT NULL);

-- ============================================================
-- TRIGGERS: updated_at auto-update
-- ============================================================
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.course_lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.assignment_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_student_marks_updated_at BEFORE UPDATE ON public.student_marks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cert_templates_updated_at BEFORE UPDATE ON public.certificate_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- SERIAL NUMBER FUNCTION for certificates
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_certificate_serial(institution_id UUID, template_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_num INTEGER;
  prefix TEXT;
  serial TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq_num
  FROM public.issued_certificates ic
  WHERE ic.institution_id = generate_certificate_serial.institution_id;

  prefix := UPPER(LEFT(template_type, 4));
  serial := prefix || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN serial;
END;
$$;

-- GPA Calculation helper function
CREATE OR REPLACE FUNCTION public.calculate_grade(percentage NUMERIC, scale_id UUID)
RETURNS TABLE(grade_letter TEXT, gpa_points NUMERIC, description TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gse.grade_letter, gse.gpa_points, gse.description
  FROM public.grading_scale_entries gse
  WHERE gse.scale_id = calculate_grade.scale_id
    AND percentage >= gse.min_percentage
    AND percentage <= gse.max_percentage
  LIMIT 1;
$$;
