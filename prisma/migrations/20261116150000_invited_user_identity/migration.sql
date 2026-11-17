ALTER TABLE "invitations" ADD COLUMN "invited_user_id" TEXT;
UPDATE "invitations" SET "invited_user_id" = gen_random_uuid()::text;
ALTER TABLE "invitations" ALTER COLUMN "invited_user_id" SET NOT NULL;
CREATE UNIQUE INDEX "invitations_invited_user_id_key" ON "invitations"("invited_user_id");
