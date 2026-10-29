/*
  Warnings:

  - You are about to drop the column `user_id` on the `tasks` table. All the data in the column will be lost.
  - Added the required column `owner_id` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_user_id_fkey";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "user_id",
ADD COLUMN     "owner_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "subtasks" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "task_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subtasks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtasks" ADD CONSTRAINT "subtasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
