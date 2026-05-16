CREATE TYPE "LessonMaterialType" AS ENUM ('PDF', 'LINK');
CREATE TYPE "LessonMaterialStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "lesson_materials" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "lesson_id" UUID NOT NULL,
  "material_type" "LessonMaterialType" NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "url" VARCHAR(500) NOT NULL,
  "position" INTEGER NOT NULL,
  "status" "LessonMaterialStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "lesson_materials_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "lesson_materials_lesson_id_fkey" FOREIGN KEY ("lesson_id")
    REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "lesson_materials_lesson_id_position_key" ON "lesson_materials"("lesson_id", "position");
CREATE INDEX "lesson_materials_lesson_id_status_idx" ON "lesson_materials"("lesson_id", "status");
