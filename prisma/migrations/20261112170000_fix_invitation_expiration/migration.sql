-- Repair invitations created with the old immediate-expiration default.
UPDATE "invitations"
SET "expires_at" = "created_at" + INTERVAL '7 days'
WHERE "expires_at" <= "created_at";

-- Invitations must always receive an explicit expiration from the application.
ALTER TABLE "invitations" ALTER COLUMN "expires_at" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "invitations_expires_at_idx" ON "invitations"("expires_at");
