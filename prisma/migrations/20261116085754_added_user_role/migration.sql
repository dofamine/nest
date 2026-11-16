-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'therapist');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'therapist';
