-- Cadernos externos: cursos estudados fora da plataforma, com aulas de texto e materiais de IA.
CREATE TABLE "external_notebooks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "student_id" UUID NOT NULL,
  "title" VARCHAR(150) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "external_notebooks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "external_lessons" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "notebook_id" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "transcript" TEXT,
  "summary" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "external_lessons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "external_ai_contents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "lesson_id" UUID NOT NULL,
  "kind" "AiContentKind" NOT NULL,
  "technique" VARCHAR(32) NOT NULL DEFAULT '',
  "content" TEXT NOT NULL,
  "provider" VARCHAR(20) NOT NULL,
  "model" VARCHAR(60) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "external_ai_contents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "external_card_reviews" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "student_id" UUID NOT NULL,
  "lesson_id" UUID NOT NULL,
  "card_key" VARCHAR(64) NOT NULL,
  "ease" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
  "interval_days" INTEGER NOT NULL DEFAULT 0,
  "reps" INTEGER NOT NULL DEFAULT 0,
  "lapses" INTEGER NOT NULL DEFAULT 0,
  "due_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_reviewed_at" TIMESTAMPTZ(6),
  CONSTRAINT "external_card_reviews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "external_notebooks_student_id_idx" ON "external_notebooks"("student_id");
CREATE INDEX "external_lessons_notebook_id_idx" ON "external_lessons"("notebook_id");
CREATE UNIQUE INDEX "external_ai_contents_lesson_id_kind_technique_key" ON "external_ai_contents"("lesson_id", "kind", "technique");
CREATE UNIQUE INDEX "external_card_reviews_student_id_lesson_id_card_key_key" ON "external_card_reviews"("student_id", "lesson_id", "card_key");
CREATE INDEX "external_card_reviews_student_id_due_at_idx" ON "external_card_reviews"("student_id", "due_at");

ALTER TABLE "external_notebooks" ADD CONSTRAINT "external_notebooks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "external_lessons" ADD CONSTRAINT "external_lessons_notebook_id_fkey" FOREIGN KEY ("notebook_id") REFERENCES "external_notebooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "external_ai_contents" ADD CONSTRAINT "external_ai_contents_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "external_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "external_card_reviews" ADD CONSTRAINT "external_card_reviews_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "external_card_reviews" ADD CONSTRAINT "external_card_reviews_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "external_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
