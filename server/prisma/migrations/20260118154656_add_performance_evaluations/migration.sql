/*
  Warnings:

  - You are about to drop the `Evaluation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Goal` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."EvaluationPeriod" AS ENUM ('QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "public"."EvaluationStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."EvaluationType" AS ENUM ('AUTOMATIC', 'MANUAL', 'SELF');

-- CreateEnum
CREATE TYPE "public"."ObjectiveStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- DropForeignKey
ALTER TABLE "public"."Evaluation" DROP CONSTRAINT "Evaluation_evaluatorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Evaluation" DROP CONSTRAINT "Evaluation_profileId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Goal" DROP CONSTRAINT "Goal_createdInEvaluationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Goal" DROP CONSTRAINT "Goal_profileId_fkey";

-- DropTable
DROP TABLE "public"."Evaluation";

-- DropTable
DROP TABLE "public"."Goal";

-- CreateTable
CREATE TABLE "public"."EvaluationCycle" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "period" "public"."EvaluationPeriod" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PerformanceEvaluation" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "cycleId" INTEGER NOT NULL,
    "status" "public"."EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "finalScore" DOUBLE PRECISION,
    "rank" INTEGER,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EvaluationCriteria" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EvaluationScore" (
    "id" SERIAL NOT NULL,
    "evaluationId" INTEGER NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ManualEvaluation" (
    "id" SERIAL NOT NULL,
    "evaluationId" INTEGER NOT NULL,
    "reviewerId" INTEGER NOT NULL,
    "strengths" TEXT NOT NULL,
    "weaknesses" TEXT NOT NULL,
    "achievements" TEXT,
    "recommendations" TEXT,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SelfEvaluation" (
    "id" SERIAL NOT NULL,
    "evaluationId" INTEGER NOT NULL,
    "comments" TEXT NOT NULL,
    "achievements" TEXT,
    "challenges" TEXT,
    "selfScore" DOUBLE PRECISION,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SelfEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmployeeObjective" (
    "id" SERIAL NOT NULL,
    "evaluationId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" TEXT,
    "status" "public"."ObjectiveStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "weight" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ObjectiveProgress" (
    "id" SERIAL NOT NULL,
    "objectiveId" INTEGER NOT NULL,
    "progressNote" TEXT NOT NULL,
    "progressRate" DOUBLE PRECISION,
    "updatedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObjectiveProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EvaluationCycle_period_idx" ON "public"."EvaluationCycle"("period");

-- CreateIndex
CREATE INDEX "EvaluationCycle_isActive_idx" ON "public"."EvaluationCycle"("isActive");

-- CreateIndex
CREATE INDEX "EvaluationCycle_tenantId_idx" ON "public"."EvaluationCycle"("tenantId");

-- CreateIndex
CREATE INDEX "PerformanceEvaluation_status_idx" ON "public"."PerformanceEvaluation"("status");

-- CreateIndex
CREATE INDEX "PerformanceEvaluation_tenantId_idx" ON "public"."PerformanceEvaluation"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceEvaluation_employeeId_cycleId_key" ON "public"."PerformanceEvaluation"("employeeId", "cycleId");

-- CreateIndex
CREATE INDEX "EvaluationCriteria_isActive_idx" ON "public"."EvaluationCriteria"("isActive");

-- CreateIndex
CREATE INDEX "EvaluationCriteria_tenantId_idx" ON "public"."EvaluationCriteria"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationScore_evaluationId_key" ON "public"."EvaluationScore"("evaluationId");

-- CreateIndex
CREATE UNIQUE INDEX "ManualEvaluation_evaluationId_key" ON "public"."ManualEvaluation"("evaluationId");

-- CreateIndex
CREATE INDEX "ManualEvaluation_reviewerId_idx" ON "public"."ManualEvaluation"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "SelfEvaluation_evaluationId_key" ON "public"."SelfEvaluation"("evaluationId");

-- CreateIndex
CREATE INDEX "EmployeeObjective_status_idx" ON "public"."EmployeeObjective"("status");

-- CreateIndex
CREATE INDEX "ObjectiveProgress_objectiveId_idx" ON "public"."ObjectiveProgress"("objectiveId");

-- AddForeignKey
ALTER TABLE "public"."PerformanceEvaluation" ADD CONSTRAINT "PerformanceEvaluation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PerformanceEvaluation" ADD CONSTRAINT "PerformanceEvaluation_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "public"."EvaluationCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EvaluationScore" ADD CONSTRAINT "EvaluationScore_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "public"."PerformanceEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ManualEvaluation" ADD CONSTRAINT "ManualEvaluation_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "public"."PerformanceEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ManualEvaluation" ADD CONSTRAINT "ManualEvaluation_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SelfEvaluation" ADD CONSTRAINT "SelfEvaluation_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "public"."PerformanceEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmployeeObjective" ADD CONSTRAINT "EmployeeObjective_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "public"."PerformanceEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ObjectiveProgress" ADD CONSTRAINT "ObjectiveProgress_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "public"."EmployeeObjective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ObjectiveProgress" ADD CONSTRAINT "ObjectiveProgress_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
