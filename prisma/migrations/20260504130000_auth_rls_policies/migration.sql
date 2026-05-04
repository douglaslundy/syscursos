CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS "UserRole"
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT "role"
  FROM public."users"
  WHERE "auth_user_id" = auth.uid()
    OR "email" = auth.jwt() ->> 'email'
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_student_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sp."id"
  FROM public."student_profiles" sp
  INNER JOIN public."users" u ON u."id" = sp."user_id"
  WHERE u."auth_user_id" = auth.uid()
    OR u."email" = auth.jwt() ->> 'email'
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'ADMIN', false)
$$;

ALTER TABLE public."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."student_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."modules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."lessons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."lesson_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."lesson_progress" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_admin_all"
ON public."users"
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "users_select_self"
ON public."users"
FOR SELECT
USING ("auth_user_id" = auth.uid() OR "email" = auth.jwt() ->> 'email');

CREATE POLICY "student_profiles_admin_all"
ON public."student_profiles"
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "student_profiles_select_self"
ON public."student_profiles"
FOR SELECT
USING ("id" = public.current_student_profile_id());

CREATE POLICY "courses_admin_all"
ON public."courses"
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "courses_select_enrolled_student"
ON public."courses"
FOR SELECT
USING (
  "status" = 'ACTIVE'
  AND EXISTS (
    SELECT 1
    FROM public."enrollments" e
    WHERE e."course_id" = public."courses"."id"
      AND e."student_id" = public.current_student_profile_id()
      AND e."status" = 'ACTIVE'
      AND e."starts_at" <= now()
      AND (e."expires_at" IS NULL OR e."expires_at" > now())
  )
);

CREATE POLICY "modules_admin_all"
ON public."modules"
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "modules_select_enrolled_student"
ON public."modules"
FOR SELECT
USING (
  "status" = 'ACTIVE'
  AND EXISTS (
    SELECT 1
    FROM public."courses" c
    INNER JOIN public."enrollments" e ON e."course_id" = c."id"
    WHERE c."id" = public."modules"."course_id"
      AND c."status" = 'ACTIVE'
      AND e."student_id" = public.current_student_profile_id()
      AND e."status" = 'ACTIVE'
      AND e."starts_at" <= now()
      AND (e."expires_at" IS NULL OR e."expires_at" > now())
  )
);

CREATE POLICY "lessons_admin_all"
ON public."lessons"
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "lessons_select_enrolled_student"
ON public."lessons"
FOR SELECT
USING (
  "status" = 'ACTIVE'
  AND EXISTS (
    SELECT 1
    FROM public."modules" m
    INNER JOIN public."courses" c ON c."id" = m."course_id"
    INNER JOIN public."enrollments" e ON e."course_id" = c."id"
    WHERE m."id" = public."lessons"."module_id"
      AND m."status" = 'ACTIVE'
      AND c."status" = 'ACTIVE'
      AND e."student_id" = public.current_student_profile_id()
      AND e."status" = 'ACTIVE'
      AND e."starts_at" <= now()
      AND (e."expires_at" IS NULL OR e."expires_at" > now())
  )
);

CREATE POLICY "enrollments_admin_all"
ON public."enrollments"
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "enrollments_select_self"
ON public."enrollments"
FOR SELECT
USING ("student_id" = public.current_student_profile_id());

CREATE POLICY "lesson_notes_admin_all"
ON public."lesson_notes"
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "lesson_notes_select_self"
ON public."lesson_notes"
FOR SELECT
USING ("student_id" = public.current_student_profile_id());

CREATE POLICY "lesson_notes_insert_self"
ON public."lesson_notes"
FOR INSERT
WITH CHECK (
  "student_id" = public.current_student_profile_id()
  AND EXISTS (
    SELECT 1
    FROM public."lessons" l
    INNER JOIN public."modules" m ON m."id" = l."module_id"
    INNER JOIN public."courses" c ON c."id" = m."course_id"
    INNER JOIN public."enrollments" e ON e."course_id" = c."id"
    WHERE l."id" = public."lesson_notes"."lesson_id"
      AND l."status" = 'ACTIVE'
      AND m."status" = 'ACTIVE'
      AND c."status" = 'ACTIVE'
      AND e."student_id" = public.current_student_profile_id()
      AND e."status" = 'ACTIVE'
      AND e."starts_at" <= now()
      AND (e."expires_at" IS NULL OR e."expires_at" > now())
  )
);

CREATE POLICY "lesson_notes_update_self"
ON public."lesson_notes"
FOR UPDATE
USING ("student_id" = public.current_student_profile_id())
WITH CHECK (
  "student_id" = public.current_student_profile_id()
  AND EXISTS (
    SELECT 1
    FROM public."lessons" l
    INNER JOIN public."modules" m ON m."id" = l."module_id"
    INNER JOIN public."courses" c ON c."id" = m."course_id"
    INNER JOIN public."enrollments" e ON e."course_id" = c."id"
    WHERE l."id" = public."lesson_notes"."lesson_id"
      AND l."status" = 'ACTIVE'
      AND m."status" = 'ACTIVE'
      AND c."status" = 'ACTIVE'
      AND e."student_id" = public.current_student_profile_id()
      AND e."status" = 'ACTIVE'
      AND e."starts_at" <= now()
      AND (e."expires_at" IS NULL OR e."expires_at" > now())
  )
);

CREATE POLICY "lesson_progress_admin_all"
ON public."lesson_progress"
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "lesson_progress_select_self"
ON public."lesson_progress"
FOR SELECT
USING ("student_id" = public.current_student_profile_id());

CREATE POLICY "lesson_progress_insert_self"
ON public."lesson_progress"
FOR INSERT
WITH CHECK (
  "student_id" = public.current_student_profile_id()
  AND EXISTS (
    SELECT 1
    FROM public."lessons" l
    INNER JOIN public."modules" m ON m."id" = l."module_id"
    INNER JOIN public."courses" c ON c."id" = m."course_id"
    INNER JOIN public."enrollments" e ON e."course_id" = c."id"
    WHERE l."id" = public."lesson_progress"."lesson_id"
      AND l."status" = 'ACTIVE'
      AND m."status" = 'ACTIVE'
      AND c."status" = 'ACTIVE'
      AND e."student_id" = public.current_student_profile_id()
      AND e."status" = 'ACTIVE'
      AND e."starts_at" <= now()
      AND (e."expires_at" IS NULL OR e."expires_at" > now())
  )
);

CREATE POLICY "lesson_progress_update_self"
ON public."lesson_progress"
FOR UPDATE
USING ("student_id" = public.current_student_profile_id())
WITH CHECK (
  "student_id" = public.current_student_profile_id()
  AND EXISTS (
    SELECT 1
    FROM public."lessons" l
    INNER JOIN public."modules" m ON m."id" = l."module_id"
    INNER JOIN public."courses" c ON c."id" = m."course_id"
    INNER JOIN public."enrollments" e ON e."course_id" = c."id"
    WHERE l."id" = public."lesson_progress"."lesson_id"
      AND l."status" = 'ACTIVE'
      AND m."status" = 'ACTIVE'
      AND c."status" = 'ACTIVE'
      AND e."student_id" = public.current_student_profile_id()
      AND e."status" = 'ACTIVE'
      AND e."starts_at" <= now()
      AND (e."expires_at" IS NULL OR e."expires_at" > now())
  )
);
