-- Lembretes de estudo por WhatsApp (ate 3 horarios por dia).
ALTER TABLE "student_profiles"
  ADD COLUMN "reminder_mode" VARCHAR(10) NOT NULL DEFAULT 'off',
  ADD COLUMN "reminder_count" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "reminder_start" VARCHAR(5) NOT NULL DEFAULT '08:00',
  ADD COLUMN "reminder_interval_min" INTEGER NOT NULL DEFAULT 120,
  ADD COLUMN "reminder_slots" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "reminder_last_sent" VARCHAR(16);
