ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "access_expires_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMPTZ(6);

ALTER TABLE "courses"
  ADD COLUMN IF NOT EXISTS "producer_id" UUID;

CREATE TABLE IF NOT EXISTS "producer_students" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "producer_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "producer_students_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'producer_students_producer_id_fkey') THEN
    ALTER TABLE "producer_students"
      ADD CONSTRAINT "producer_students_producer_id_fkey"
      FOREIGN KEY ("producer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'producer_students_student_id_fkey') THEN
    ALTER TABLE "producer_students"
      ADD CONSTRAINT "producer_students_student_id_fkey"
      FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "producer_students_producer_id_student_id_key"
  ON "producer_students"("producer_id", "student_id");
CREATE INDEX IF NOT EXISTS "producer_students_student_id_idx"
  ON "producer_students"("student_id");

WITH owner_by_org AS (
  SELECT o.id AS organization_id,
         COALESCE(
           (SELECT u.id FROM users u WHERE u.organization_id = o.id AND u.role = 'PRODUCER' ORDER BY u.created_at ASC LIMIT 1),
           (SELECT u.id FROM users u WHERE u.organization_id = o.id AND u.role = 'ADMIN' ORDER BY u.created_at ASC LIMIT 1)
         ) AS producer_id
  FROM organizations o
)
UPDATE courses c
SET producer_id = owner_by_org.producer_id
FROM owner_by_org
WHERE c.organization_id = owner_by_org.organization_id
  AND c.producer_id IS NULL
  AND owner_by_org.producer_id IS NOT NULL;

INSERT INTO producer_students (producer_id, student_id)
SELECT DISTINCT c.producer_id, e.student_id
FROM enrollments e
JOIN courses c ON c.id = e.course_id
WHERE c.producer_id IS NOT NULL
ON CONFLICT (producer_id, student_id) DO NOTHING;

ALTER TABLE "courses"
  ALTER COLUMN "producer_id" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'courses_producer_id_fkey') THEN
    ALTER TABLE "courses"
      ADD CONSTRAINT "courses_producer_id_fkey"
      FOREIGN KEY ("producer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "courses_organization_id_producer_id_status_idx"
  ON "courses"("organization_id", "producer_id", "status");

DROP INDEX IF EXISTS "courses_organization_id_status_idx";
