/*
  Warnings:

  - You are about to drop the column `goals` on the `Evaluation` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."GoalStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."Evaluation" DROP COLUMN "goals";

-- CreateTable
CREATE TABLE "public"."Goal" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profileId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER DEFAULT 0,
    "targetDate" TIMESTAMP(3),
    "createdInEvaluationId" INTEGER,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_profileId_status_idx" ON "public"."Goal"("profileId", "status");

-- AddForeignKey
ALTER TABLE "public"."Goal" ADD CONSTRAINT "Goal_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Goal" ADD CONSTRAINT "Goal_createdInEvaluationId_fkey" FOREIGN KEY ("createdInEvaluationId") REFERENCES "public"."Evaluation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
