ALTER TABLE "modules"
DROP COLUMN IF EXISTS "cover_image_url";

ALTER TABLE "lessons"
ADD COLUMN "cover_image_url" VARCHAR(500);
