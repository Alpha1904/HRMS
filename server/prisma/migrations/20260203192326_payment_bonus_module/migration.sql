/*
  Warnings:

  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."CompensationType" AS ENUM ('BASE_SALARY', 'BONUS', 'INCENTIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."Frequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'ONE_TIME');

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_processedById_fkey";

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_profileId_fkey";

-- DropTable
DROP TABLE "public"."Payment";

-- CreateTable
CREATE TABLE "public"."CompensationComponent" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "type" "public"."CompensationType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "frequency" "public"."Frequency",
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CompensationComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SalaryAdjustment" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "componentId" INTEGER,
    "adjustmentType" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "percentage" DOUBLE PRECISION,
    "reason" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payslip" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "grossAmount" DECIMAL(10,2) NOT NULL,
    "deductions" DECIMAL(10,2),
    "netAmount" DECIMAL(10,2) NOT NULL,
    "breakdown" JSONB,
    "filePath" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3),

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompensationComponent_profileId_idx" ON "public"."CompensationComponent"("profileId");

-- CreateIndex
CREATE INDEX "CompensationComponent_type_idx" ON "public"."CompensationComponent"("type");

-- CreateIndex
CREATE INDEX "CompensationComponent_active_idx" ON "public"."CompensationComponent"("active");

-- CreateIndex
CREATE INDEX "SalaryAdjustment_profileId_idx" ON "public"."SalaryAdjustment"("profileId");

-- CreateIndex
CREATE INDEX "SalaryAdjustment_componentId_idx" ON "public"."SalaryAdjustment"("componentId");

-- CreateIndex
CREATE INDEX "SalaryAdjustment_createdById_idx" ON "public"."SalaryAdjustment"("createdById");

-- CreateIndex
CREATE INDEX "SalaryAdjustment_effectiveDate_idx" ON "public"."SalaryAdjustment"("effectiveDate");

-- CreateIndex
CREATE INDEX "Payslip_profileId_idx" ON "public"."Payslip"("profileId");

-- CreateIndex
CREATE INDEX "Payslip_month_idx" ON "public"."Payslip"("month");

-- CreateIndex
CREATE UNIQUE INDEX "Payslip_profileId_month_key" ON "public"."Payslip"("profileId", "month");

-- AddForeignKey
ALTER TABLE "public"."CompensationComponent" ADD CONSTRAINT "CompensationComponent_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalaryAdjustment" ADD CONSTRAINT "SalaryAdjustment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalaryAdjustment" ADD CONSTRAINT "SalaryAdjustment_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "public"."CompensationComponent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalaryAdjustment" ADD CONSTRAINT "SalaryAdjustment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payslip" ADD CONSTRAINT "Payslip_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
