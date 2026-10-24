-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN "whatsapp_phone" VARCHAR(20),
ADD COLUMN "whatsapp_code_hash" VARCHAR(64),
ADD COLUMN "whatsapp_code_expires_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_whatsapp_phone_key" ON "student_profiles"("whatsapp_phone");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_whatsapp_code_hash_key" ON "student_profiles"("whatsapp_code_hash");
