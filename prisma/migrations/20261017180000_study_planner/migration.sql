ALTER TABLE "lessons" ADD COLUMN "duration_seconds" INTEGER;

ALTER TABLE "student_profiles"
  ADD COLUMN "study_weekdays" INTEGER[] NOT NULL DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
  ADD COLUMN "study_start_minute" INTEGER NOT NULL DEFAULT 1140,
  ADD COLUMN "study_end_minute" INTEGER NOT NULL DEFAULT 1260;

CREATE TABLE "study_plans" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "student_id" UUID NOT NULL,
  "course_id" UUID NOT NULL,
  "target_date" DATE NOT NULL,
  "daily_minutes" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "study_plans_student_id_course_id_key" ON "study_plans"("student_id", "course_id");
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
