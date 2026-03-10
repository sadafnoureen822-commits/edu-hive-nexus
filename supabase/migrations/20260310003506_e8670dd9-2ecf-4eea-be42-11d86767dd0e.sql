
-- =============================================
-- FIX ATTENDANCE RLS: Role-based access control
-- =============================================

-- Drop the overly broad "Members manage attendance" policy
DROP POLICY IF EXISTS "Members manage attendance" ON public.attendance;

-- Helper function: check if user is a teacher in an institution
CREATE OR REPLACE FUNCTION public.is_institution_teacher(_user_id uuid, _institution_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.institution_members
    WHERE user_id = _user_id
      AND institution_id = _institution_id
      AND role = 'teacher'
  );
$$;

-- Helper function: check if user is a parent in an institution
CREATE OR REPLACE FUNCTION public.is_institution_parent(_user_id uuid, _institution_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.institution_members
    WHERE user_id = _user_id
      AND institution_id = _institution_id
      AND role = 'parent'
  );
$$;

-- Teachers can fully manage (INSERT, UPDATE, DELETE, SELECT) attendance
CREATE POLICY "Teachers manage attendance"
ON public.attendance
FOR ALL
TO public
USING (
  is_institution_teacher(auth.uid(), institution_id)
)
WITH CHECK (
  is_institution_teacher(auth.uid(), institution_id)
);

-- Students can only view their OWN attendance
CREATE POLICY "Students view own attendance"
ON public.attendance
FOR SELECT
TO public
USING (
  student_id = auth.uid()
  AND is_institution_member(auth.uid(), institution_id)
);

-- Parents can view attendance of their linked children
CREATE POLICY "Parents view children attendance"
ON public.attendance
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.parent_student_links psl
    WHERE psl.parent_user_id = auth.uid()
      AND psl.student_user_id = attendance.student_id
      AND psl.institution_id = attendance.institution_id
  )
);

-- =============================================
-- FIX STUDENT MARKS RLS: Role-based access control
-- =============================================

-- Drop overly broad policies on student_marks
DROP POLICY IF EXISTS "Members can manage student marks" ON public.student_marks;
DROP POLICY IF EXISTS "Teachers submit marks" ON public.student_marks;

-- Teachers can manage (insert/update) marks
CREATE POLICY "Teachers manage student marks"
ON public.student_marks
FOR ALL
TO public
USING (
  is_institution_teacher(auth.uid(), institution_id)
)
WITH CHECK (
  is_institution_teacher(auth.uid(), institution_id)
);

-- Parents can view approved marks of their linked children
CREATE POLICY "Parents view children marks"
ON public.student_marks
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.parent_student_links psl
    WHERE psl.parent_user_id = auth.uid()
      AND psl.student_user_id = student_marks.student_id
      AND psl.institution_id = student_marks.institution_id
  )
  AND status = 'approved'
);
