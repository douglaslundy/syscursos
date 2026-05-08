-- Create organizations table for SaaS tenant isolation.
CREATE TABLE "organizations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(180) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "users" ADD COLUMN "organization_id" UUID;
ALTER TABLE "courses" ADD COLUMN "organization_id" UUID;

-- Backfill single-tenant data into a default organization.
WITH default_org AS (
  INSERT INTO "organizations" ("name")
  VALUES ('SysCursos Default Tenant')
  RETURNING "id"
)
UPDATE "users"
SET "organization_id" = default_org."id"
FROM default_org
WHERE "users"."organization_id" IS NULL;

WITH default_org AS (
  SELECT "id" FROM "organizations" ORDER BY "created_at" ASC LIMIT 1
)
UPDATE "courses"
SET "organization_id" = default_org."id"
FROM default_org
WHERE "courses"."organization_id" IS NULL;

ALTER TABLE "users" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "courses" ALTER COLUMN "organization_id" SET NOT NULL;

CREATE INDEX "users_organization_id_role_status_idx" ON "users"("organization_id", "role", "status");
CREATE INDEX "courses_organization_id_status_idx" ON "courses"("organization_id", "status");

ALTER TABLE "users"
  ADD CONSTRAINT "users_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "courses"
  ADD CONSTRAINT "courses_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
