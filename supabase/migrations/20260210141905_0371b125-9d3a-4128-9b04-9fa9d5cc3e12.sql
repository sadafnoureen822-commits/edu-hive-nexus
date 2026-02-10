
-- 1. Add new institution roles
ALTER TYPE public.institution_role ADD VALUE IF NOT EXISTS 'exam_controller';
ALTER TYPE public.institution_role ADD VALUE IF NOT EXISTS 'principal';

-- 2. Academic session model enum
CREATE TYPE public.academic_model AS ENUM ('annual', 'term', 'semester');

-- 3. Exam status enum
CREATE TYPE public.exam_status AS ENUM ('draft', 'scheduled', 'active', 'completed', 'cancelled');

-- 4. Result approval status enum
CREATE TYPE public.approval_status AS ENUM ('draft', 'submitted', 'reviewed', 'approved', 'rejected');

-- 5. Academic Sessions table
CREATE TABLE public.academic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  academic_model academic_model NOT NULL DEFAULT 'annual',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;

-- 6. Subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(institution_id, code)
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- 7. Classes / Grades table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  numeric_level INTEGER,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- 8. Sections table (e.g., Section A, Section B)
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

-- 9. Grading scales table
CREATE TABLE public.grading_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.grading_scales ENABLE ROW LEVEL SECURITY;

-- 10. Grading scale entries
CREATE TABLE public.grading_scale_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scale_id UUID NOT NULL REFERENCES public.grading_scales(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  grade_letter TEXT NOT NULL,
  min_percentage NUMERIC(5,2) NOT NULL,
  max_percentage NUMERIC(5,2) NOT NULL,
  gpa_points NUMERIC(3,2),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.grading_scale_entries ENABLE ROW LEVEL SECURITY;

-- 11. Exams table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  exam_type academic_model NOT NULL,
  term_number INTEGER,
  status exam_status NOT NULL DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  grading_scale_id UUID REFERENCES public.grading_scales(id),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- 12. Exam subjects (link subjects to exams with config)
CREATE TABLE public.exam_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  total_marks NUMERIC(6,2) NOT NULL DEFAULT 100,
  passing_marks NUMERIC(6,2) NOT NULL DEFAULT 33,
  theory_weightage NUMERIC(5,2) NOT NULL DEFAULT 100,
  practical_weightage NUMERIC(5,2) NOT NULL DEFAULT 0,
  viva_weightage NUMERIC(5,2) NOT NULL DEFAULT 0,
  grace_marks NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(exam_id, subject_id)
);
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;

-- 13. Date sheets
CREATE TABLE public.exam_date_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  exam_subject_id UUID NOT NULL REFERENCES public.exam_subjects(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exam_date_sheets ENABLE ROW LEVEL SECURITY;

-- 14. Updated_at triggers for new tables
CREATE TRIGGER update_academic_sessions_updated_at BEFORE UPDATE ON public.academic_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON public.sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_grading_scales_updated_at BEFORE UPDATE ON public.grading_scales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_exam_subjects_updated_at BEFORE UPDATE ON public.exam_subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_exam_date_sheets_updated_at BEFORE UPDATE ON public.exam_date_sheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. RLS Policies for all new tables

-- Academic Sessions
CREATE POLICY "Institution members can view sessions" ON public.academic_sessions FOR SELECT USING (is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Institution admins can manage sessions" ON public.academic_sessions FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access sessions" ON public.academic_sessions FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- Subjects
CREATE POLICY "Institution members can view subjects" ON public.subjects FOR SELECT USING (is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Institution admins can manage subjects" ON public.subjects FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access subjects" ON public.subjects FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- Classes
CREATE POLICY "Institution members can view classes" ON public.classes FOR SELECT USING (is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Institution admins can manage classes" ON public.classes FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access classes" ON public.classes FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- Sections
CREATE POLICY "Institution members can view sections" ON public.sections FOR SELECT USING (is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Institution admins can manage sections" ON public.sections FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access sections" ON public.sections FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- Grading Scales
CREATE POLICY "Institution members can view grading scales" ON public.grading_scales FOR SELECT USING (is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Institution admins can manage grading scales" ON public.grading_scales FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access grading scales" ON public.grading_scales FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- Grading Scale Entries
CREATE POLICY "Institution members can view grading entries" ON public.grading_scale_entries FOR SELECT USING (is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Institution admins can manage grading entries" ON public.grading_scale_entries FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access grading entries" ON public.grading_scale_entries FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- Exams
CREATE POLICY "Institution members can view exams" ON public.exams FOR SELECT USING (is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Institution admins can manage exams" ON public.exams FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access exams" ON public.exams FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- Exam Subjects
CREATE POLICY "Institution members can view exam subjects" ON public.exam_subjects FOR SELECT USING (is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Institution admins can manage exam subjects" ON public.exam_subjects FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access exam subjects" ON public.exam_subjects FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- Date Sheets
CREATE POLICY "Institution members can view date sheets" ON public.exam_date_sheets FOR SELECT USING (is_institution_member(auth.uid(), institution_id));
CREATE POLICY "Institution admins can manage date sheets" ON public.exam_date_sheets FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "Platform admins full access date sheets" ON public.exam_date_sheets FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));
