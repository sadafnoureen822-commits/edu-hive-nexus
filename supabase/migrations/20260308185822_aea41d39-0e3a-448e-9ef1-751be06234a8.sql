-- Add exam_id to student_marks for easier exam-level querying
ALTER TABLE public.student_marks 
  ADD COLUMN IF NOT EXISTS exam_id uuid REFERENCES public.exams(id) ON DELETE CASCADE;

-- Add total_obtained as a regular column (not generated, to avoid conflicts)
ALTER TABLE public.student_marks 
  ADD COLUMN IF NOT EXISTS total_obtained numeric;

-- Ensure RLS is enabled
ALTER TABLE public.student_marks ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_marks
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='student_marks' AND policyname='Platform admins full access student marks') THEN
    CREATE POLICY "Platform admins full access student marks" ON public.student_marks
      FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='student_marks' AND policyname='Institution admins manage student marks') THEN
    CREATE POLICY "Institution admins manage student marks" ON public.student_marks
      FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='student_marks' AND policyname='Members can manage student marks') THEN
    CREATE POLICY "Members can manage student marks" ON public.student_marks
      FOR ALL USING (is_institution_member(auth.uid(), institution_id)) WITH CHECK (is_institution_member(auth.uid(), institution_id));
  END IF;
END $$;

-- Ensure RLS on quizzes tables
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- Quiz RLS policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quizzes' AND policyname='Platform admins full access quizzes') THEN
    CREATE POLICY "Platform admins full access quizzes" ON public.quizzes FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quizzes' AND policyname='Admins manage quizzes') THEN
    CREATE POLICY "Admins manage quizzes" ON public.quizzes FOR ALL USING (is_institution_admin(auth.uid(), institution_id)) WITH CHECK (is_institution_admin(auth.uid(), institution_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quizzes' AND policyname='Members view quizzes') THEN
    CREATE POLICY "Members view quizzes" ON public.quizzes FOR SELECT USING (is_institution_member(auth.uid(), institution_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quizzes' AND policyname='Teachers manage quizzes') THEN
    CREATE POLICY "Teachers manage quizzes" ON public.quizzes FOR ALL USING (is_institution_member(auth.uid(), institution_id)) WITH CHECK (is_institution_member(auth.uid(), institution_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quiz_questions' AND policyname='Members access quiz questions') THEN
    CREATE POLICY "Members access quiz questions" ON public.quiz_questions FOR ALL USING (is_institution_member(auth.uid(), institution_id)) WITH CHECK (is_institution_member(auth.uid(), institution_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quiz_options' AND policyname='Members access quiz options') THEN
    CREATE POLICY "Members access quiz options" ON public.quiz_options FOR ALL USING (is_institution_member(auth.uid(), institution_id)) WITH CHECK (is_institution_member(auth.uid(), institution_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quiz_attempts' AND policyname='Platform admins full access quiz attempts') THEN
    CREATE POLICY "Platform admins full access quiz attempts" ON public.quiz_attempts FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quiz_attempts' AND policyname='Members manage quiz attempts') THEN
    CREATE POLICY "Members manage quiz attempts" ON public.quiz_attempts FOR ALL USING (is_institution_member(auth.uid(), institution_id)) WITH CHECK (is_institution_member(auth.uid(), institution_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quiz_answers' AND policyname='Members manage quiz answers') THEN
    CREATE POLICY "Members manage quiz answers" ON public.quiz_answers FOR ALL USING (is_institution_member(auth.uid(), institution_id)) WITH CHECK (is_institution_member(auth.uid(), institution_id));
  END IF;
END $$;