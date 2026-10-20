CREATE TABLE "study_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "course_ids" UUID[],
    "target_date" DATE NOT NULL,
    "daily_minutes" INTEGER NOT NULL,
    "schedule" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "study_schedules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "study_schedules_student_id_key" ON "study_schedules"("student_id");

ALTER TABLE "study_schedules" ADD CONSTRAINT "study_schedules_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
