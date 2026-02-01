/*
  Warnings:

  - You are about to drop the column `exitDate` on the `Departure` table. All the data in the column will be lost.
  - You are about to drop the column `exitInterviewNotes` on the `Departure` table. All the data in the column will be lost.
  - You are about to drop the column `finalPayAmount` on the `Departure` table. All the data in the column will be lost.
  - You are about to drop the column `indemnity` on the `Departure` table. All the data in the column will be lost.
  - You are about to drop the column `noticePeriodDays` on the `Departure` table. All the data in the column will be lost.
  - You are about to drop the column `processedById` on the `Departure` table. All the data in the column will be lost.
  - You are about to drop the column `profileId` on the `Departure` table. All the data in the column will be lost.
  - You are about to drop the column `surveyResponses` on the `Departure` table. All the data in the column will be lost.
  - The `reason` column on the `Departure` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Departure` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Report` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[employeeId,noticeDate]` on the table `Departure` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `employeeId` to the `Departure` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastWorkDate` to the `Departure` table without a default value. This is not possible if the table is not empty.
  - Added the required column `noticeDate` to the `Departure` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Departure` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."DepartureType" AS ENUM ('RESIGNATION', 'DISMISSAL', 'RETIREMENT');

-- CreateEnum
CREATE TYPE "public"."DepartureStatus" AS ENUM ('PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- DropForeignKey
ALTER TABLE "public"."Departure" DROP CONSTRAINT "Departure_processedById_fkey";

-- DropForeignKey
ALTER TABLE "public"."Departure" DROP CONSTRAINT "Departure_profileId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Report" DROP CONSTRAINT "Report_generatedById_fkey";

-- DropIndex
DROP INDEX "public"."Departure_exitDate_status_idx";

-- DropIndex
DROP INDEX "public"."Departure_profileId_idx";

-- DropIndex
DROP INDEX "public"."Departure_profileId_key";

-- AlterTable
ALTER TABLE "public"."Departure" DROP COLUMN "exitDate",
DROP COLUMN "exitInterviewNotes",
DROP COLUMN "finalPayAmount",
DROP COLUMN "indemnity",
DROP COLUMN "noticePeriodDays",
DROP COLUMN "processedById",
DROP COLUMN "profileId",
DROP COLUMN "surveyResponses",
ADD COLUMN     "actualNoticeDays" INTEGER,
ADD COLUMN     "createdById" INTEGER,
ADD COLUMN     "employeeId" INTEGER NOT NULL,
ADD COLUMN     "lastWorkDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "noticeDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "requiredNoticeDays" INTEGER,
ADD COLUMN     "severanceApproved" BOOLEAN DEFAULT false,
ADD COLUMN     "severanceBreakdown" JSONB,
ADD COLUMN     "severancePay" DOUBLE PRECISION,
ADD COLUMN     "tenantId" TEXT,
ADD COLUMN     "type" "public"."DepartureType" NOT NULL,
ADD COLUMN     "updatedById" INTEGER,
DROP COLUMN "reason",
ADD COLUMN     "reason" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."DepartureStatus" NOT NULL DEFAULT 'PENDING';

-- DropTable
DROP TABLE "public"."Report";

-- DropEnum
DROP TYPE "public"."DepartureReason";

-- CreateTable
CREATE TABLE "public"."ExitInterview" (
    "id" SERIAL NOT NULL,
    "departureId" INTEGER NOT NULL,
    "interviewerId" INTEGER NOT NULL,
    "scheduledDate" TIMESTAMP(3),
    "interviewDate" TIMESTAMP(3),
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExitInterview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExitSurvey" (
    "id" SERIAL NOT NULL,
    "departureId" INTEGER NOT NULL,
    "responses" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExitSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DepartureDocument" (
    "id" SERIAL NOT NULL,
    "departureId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" INTEGER,

    CONSTRAINT "DepartureDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DepartureChecklist" (
    "id" SERIAL NOT NULL,
    "departureId" INTEGER NOT NULL,
    "taskName" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" INTEGER,
    "dueDate" TIMESTAMP(3),
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartureChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HandoverPlan" (
    "id" SERIAL NOT NULL,
    "departureId" INTEGER NOT NULL,
    "assigneeId" INTEGER NOT NULL,
    "notes" TEXT,
    "tasks" JSONB,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HandoverPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DepartureHistory" (
    "id" SERIAL NOT NULL,
    "departureId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performedById" INTEGER,

    CONSTRAINT "DepartureHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExitInterview_departureId_key" ON "public"."ExitInterview"("departureId");

-- CreateIndex
CREATE INDEX "ExitInterview_interviewerId_idx" ON "public"."ExitInterview"("interviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "ExitSurvey_departureId_key" ON "public"."ExitSurvey"("departureId");

-- CreateIndex
CREATE INDEX "DepartureDocument_departureId_idx" ON "public"."DepartureDocument"("departureId");

-- CreateIndex
CREATE INDEX "DepartureChecklist_departureId_idx" ON "public"."DepartureChecklist"("departureId");

-- CreateIndex
CREATE INDEX "DepartureChecklist_status_idx" ON "public"."DepartureChecklist"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HandoverPlan_departureId_key" ON "public"."HandoverPlan"("departureId");

-- CreateIndex
CREATE INDEX "HandoverPlan_assigneeId_idx" ON "public"."HandoverPlan"("assigneeId");

-- CreateIndex
CREATE INDEX "DepartureHistory_departureId_idx" ON "public"."DepartureHistory"("departureId");

-- CreateIndex
CREATE INDEX "DepartureHistory_timestamp_idx" ON "public"."DepartureHistory"("timestamp");

-- CreateIndex
CREATE INDEX "Departure_employeeId_idx" ON "public"."Departure"("employeeId");

-- CreateIndex
CREATE INDEX "Departure_type_idx" ON "public"."Departure"("type");

-- CreateIndex
CREATE INDEX "Departure_status_idx" ON "public"."Departure"("status");

-- CreateIndex
CREATE INDEX "Departure_tenantId_idx" ON "public"."Departure"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Departure_employeeId_noticeDate_key" ON "public"."Departure"("employeeId", "noticeDate");

-- AddForeignKey
ALTER TABLE "public"."Departure" ADD CONSTRAINT "Departure_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Departure" ADD CONSTRAINT "Departure_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Departure" ADD CONSTRAINT "Departure_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExitInterview" ADD CONSTRAINT "ExitInterview_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "public"."Departure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExitInterview" ADD CONSTRAINT "ExitInterview_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "public"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExitSurvey" ADD CONSTRAINT "ExitSurvey_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "public"."Departure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DepartureDocument" ADD CONSTRAINT "DepartureDocument_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "public"."Departure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DepartureDocument" ADD CONSTRAINT "DepartureDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DepartureChecklist" ADD CONSTRAINT "DepartureChecklist_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "public"."Departure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DepartureChecklist" ADD CONSTRAINT "DepartureChecklist_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HandoverPlan" ADD CONSTRAINT "HandoverPlan_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "public"."Departure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HandoverPlan" ADD CONSTRAINT "HandoverPlan_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DepartureHistory" ADD CONSTRAINT "DepartureHistory_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "public"."Departure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DepartureHistory" ADD CONSTRAINT "DepartureHistory_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
