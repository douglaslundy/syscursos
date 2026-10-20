CREATE TYPE "AiContentKind" AS ENUM ('SUMMARY', 'FLASHCARDS', 'MINDMAP');

CREATE TABLE "lesson_ai_contents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lesson_id" UUID NOT NULL,
    "kind" "AiContentKind" NOT NULL,
    "technique" VARCHAR(32) NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "provider" VARCHAR(20) NOT NULL,
    "model" VARCHAR(60) NOT NULL,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_ai_contents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_usage_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" VARCHAR(20) NOT NULL,
    "model" VARCHAR(60) NOT NULL,
    "kind" "AiContentKind" NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "student_id" UUID,
    "course_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lesson_ai_contents_lesson_id_kind_technique_key" ON "lesson_ai_contents"("lesson_id", "kind", "technique");
CREATE INDEX "ai_usage_logs_created_at_idx" ON "ai_usage_logs"("created_at");
CREATE INDEX "ai_usage_logs_course_id_idx" ON "ai_usage_logs"("course_id");
CREATE INDEX "ai_usage_logs_student_id_idx" ON "ai_usage_logs"("student_id");

ALTER TABLE "lesson_ai_contents" ADD CONSTRAINT "lesson_ai_contents_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
