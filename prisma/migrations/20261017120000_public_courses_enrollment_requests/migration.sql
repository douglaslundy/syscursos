-- CreateEnum
CREATE TYPE "EnrollmentRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "courses" ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "enrollment_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "status" "EnrollmentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "enrollment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "courses_is_public_status_idx" ON "courses"("is_public", "status");
CREATE UNIQUE INDEX "enrollment_requests_student_id_course_id_key" ON "enrollment_requests"("student_id", "course_id");
CREATE INDEX "enrollment_requests_course_id_status_idx" ON "enrollment_requests"("course_id", "status");

-- AddForeignKey
ALTER TABLE "enrollment_requests" ADD CONSTRAINT "enrollment_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "enrollment_requests" ADD CONSTRAINT "enrollment_requests_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
