/*
  Warnings:

  - You are about to drop the column `owner_id` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_owner_id_fkey";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "owner_id",
ADD COLUMN     "area" "ETaskArea" NOT NULL DEFAULT 'home';

-- DropTable
DROP TABLE "users";
