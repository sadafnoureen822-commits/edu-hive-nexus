
-- ============================================================
-- Fix overpermissive storage bucket policies
-- Scope all write/delete operations to institution folder ownership
-- ============================================================

-- -------------------------------------------------------
-- 1. institution-media  (public bucket, path: {institution_id}/{filename})
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can upload institution media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update institution media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete institution media" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload institution media" ON storage.objects;
DROP POLICY IF EXISTS "Admins update institution media" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete institution media" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins can update media" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins can delete media" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins upload media" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins update media" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins delete media" ON storage.objects;

CREATE POLICY "Institution admins upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'institution-media'
    AND (storage.foldername(name))[1] IN (
      SELECT im.institution_id::text
      FROM public.institution_members im
      WHERE im.user_id = auth.uid()
        AND im.role = 'admin'
    )
  );

CREATE POLICY "Institution admins update media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'institution-media'
    AND (storage.foldername(name))[1] IN (
      SELECT im.institution_id::text
      FROM public.institution_members im
      WHERE im.user_id = auth.uid()
        AND im.role = 'admin'
    )
  );

CREATE POLICY "Institution admins delete media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'institution-media'
    AND (storage.foldername(name))[1] IN (
      SELECT im.institution_id::text
      FROM public.institution_members im
      WHERE im.user_id = auth.uid()
        AND im.role = 'admin'
    )
  );

-- -------------------------------------------------------
-- 2. course-materials  (private bucket, path: {institution_id}/{filename})
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can upload course materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update course materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete course materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view course materials" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload course materials" ON storage.objects;
DROP POLICY IF EXISTS "Admins update course materials" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete course materials" ON storage.objects;
DROP POLICY IF EXISTS "Members view course materials" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins can upload course materials" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins can update course materials" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins can delete course materials" ON storage.objects;
DROP POLICY IF EXISTS "Institution members can view course materials" ON storage.objects;
DROP POLICY IF EXISTS "Institution members view course materials" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins upload course materials" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins update course materials" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins delete course materials" ON storage.objects;

CREATE POLICY "Institution members view course materials"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'course-materials'
    AND (storage.foldername(name))[1] IN (
      SELECT im.institution_id::text
      FROM public.institution_members im
      WHERE im.user_id = auth.uid()
    )
  );

CREATE POLICY "Institution admins upload course materials"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'course-materials'
    AND (storage.foldername(name))[1] IN (
      SELECT im.institution_id::text
      FROM public.institution_members im
      WHERE im.user_id = auth.uid()
        AND im.role = 'admin'
    )
  );

CREATE POLICY "Institution admins update course materials"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'course-materials'
    AND (storage.foldername(name))[1] IN (
      SELECT im.institution_id::text
      FROM public.institution_members im
      WHERE im.user_id = auth.uid()
        AND im.role = 'admin'
    )
  );

CREATE POLICY "Institution admins delete course materials"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'course-materials'
    AND (storage.foldername(name))[1] IN (
      SELECT im.institution_id::text
      FROM public.institution_members im
      WHERE im.user_id = auth.uid()
        AND im.role = 'admin'
    )
  );

-- -------------------------------------------------------
-- 3. assignment-submissions  (private bucket)
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can upload submissions" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update submissions" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete submissions" ON storage.objects;
DROP POLICY IF EXISTS "Admins view all submissions" ON storage.objects;
DROP POLICY IF EXISTS "Students upload own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Students view own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins view submissions" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins can upload submissions" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins can delete submissions" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins view submissions" ON storage.objects;
DROP POLICY IF EXISTS "Students view own assignment submissions" ON storage.objects;
DROP POLICY IF EXISTS "Students upload own assignment submissions" ON storage.objects;
DROP POLICY IF EXISTS "Students delete own assignment submissions" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins delete submissions" ON storage.objects;

-- Admins see all submissions in their institution folder
CREATE POLICY "Institution admins view submissions"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assignment-submissions'
    AND (storage.foldername(name))[1] IN (
      SELECT im.institution_id::text
      FROM public.institution_members im
      WHERE im.user_id = auth.uid()
        AND im.role = 'admin'
    )
  );

-- Students see only their own submissions (path: {institution_id}/{student_uid}/...)
CREATE POLICY "Students view own assignment submissions"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assignment-submissions'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Students upload only to their own folder within their institution
CREATE POLICY "Students upload own assignment submissions"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assignment-submissions'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND (storage.foldername(name))[1] IN (
      SELECT im.institution_id::text
      FROM public.institution_members im
      WHERE im.user_id = auth.uid()
    )
  );

-- Students can delete their own submissions
CREATE POLICY "Students delete own assignment submissions"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'assignment-submissions'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Admins can delete any submission in their institution folder
CREATE POLICY "Institution admins delete submissions"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'assignment-submissions'
    AND (storage.foldername(name))[1] IN (
      SELECT im.institution_id::text
      FROM public.institution_members im
      WHERE im.user_id = auth.uid()
        AND im.role = 'admin'
    )
  );

-- -------------------------------------------------------
-- 4. certificates  (public bucket, path: {institution_id}/{filename})
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can upload certificates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update certificates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete certificates" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload certificates" ON storage.objects;
DROP POLICY IF EXISTS "Admins update certificates" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete certificates" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins can upload certificates" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins can update certificates" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins can delete certificates" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins upload certificates" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins update certificates" ON storage.objects;
DROP POLICY IF EXISTS "Institution admins delete certificates" ON storage.objects;

CREATE POLICY "Institution admins upload certificates"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'certificates'
    AND (storage.foldername(name))[1] IN (
      SELECT im.institution_id::text
      FROM public.institution_members im
      WHERE im.user_id = auth.uid()
        AND im.role = 'admin'
    )
  );

CREATE POLICY "Institution admins update certificates"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'certificates'
    AND (storage.foldername(name))[1] IN (
      SELECT im.institution_id::text
      FROM public.institution_members im
      WHERE im.user_id = auth.uid()
        AND im.role = 'admin'
    )
  );

CREATE POLICY "Institution admins delete certificates"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'certificates'
    AND (storage.foldername(name))[1] IN (
      SELECT im.institution_id::text
      FROM public.institution_members im
      WHERE im.user_id = auth.uid()
        AND im.role = 'admin'
    )
  );
