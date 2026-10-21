-- CreateTable
CREATE TABLE "rate_limit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rate_limit_events_key_created_at_idx" ON "rate_limit_events"("key", "created_at");
