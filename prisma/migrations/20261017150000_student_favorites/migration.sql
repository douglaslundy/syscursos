CREATE TABLE "favorite_courses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorite_courses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "favorite_lessons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorite_lessons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "favorite_courses_student_id_course_id_key" ON "favorite_courses"("student_id", "course_id");
CREATE UNIQUE INDEX "favorite_lessons_student_id_lesson_id_key" ON "favorite_lessons"("student_id", "lesson_id");

ALTER TABLE "favorite_courses" ADD CONSTRAINT "favorite_courses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorite_courses" ADD CONSTRAINT "favorite_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorite_lessons" ADD CONSTRAINT "favorite_lessons_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorite_lessons" ADD CONSTRAINT "favorite_lessons_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
