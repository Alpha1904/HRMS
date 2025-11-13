/*
  Warnings:

  - You are about to drop the `Schedule` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ShiftChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "public"."Schedule" DROP CONSTRAINT "Schedule_profileId_fkey";

-- DropTable
DROP TABLE "public"."Schedule";

-- CreateTable
CREATE TABLE "public"."WorkScheduleTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "site" TEXT,
    "department" TEXT,
    "role" "public"."Role",
    "isRotation" BOOLEAN NOT NULL DEFAULT false,
    "rotationDaysOn" INTEGER,
    "rotationDaysOff" INTEGER,
    "defaultStartTime" TEXT,
    "defaultEndTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkScheduleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Shift" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "templateId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShiftChangeRequest" (
    "id" SERIAL NOT NULL,
    "shiftId" INTEGER NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "reason" TEXT,
    "status" "public"."ShiftChangeStatus" NOT NULL DEFAULT 'PENDING',
    "newDate" DATE,
    "newStartTime" TIME,
    "newEndTime" TIME,
    "managerFeedback" TEXT,
    "processedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkScheduleTemplate_name_key" ON "public"."WorkScheduleTemplate"("name");

-- CreateIndex
CREATE INDEX "WorkScheduleTemplate_site_department_role_idx" ON "public"."WorkScheduleTemplate"("site", "department", "role");

-- CreateIndex
CREATE INDEX "Shift_profileId_date_idx" ON "public"."Shift"("profileId", "date");

-- CreateIndex
CREATE INDEX "Shift_templateId_idx" ON "public"."Shift"("templateId");

-- CreateIndex
CREATE INDEX "ShiftChangeRequest_shiftId_idx" ON "public"."ShiftChangeRequest"("shiftId");

-- CreateIndex
CREATE INDEX "ShiftChangeRequest_requesterId_status_idx" ON "public"."ShiftChangeRequest"("requesterId", "status");

-- AddForeignKey
ALTER TABLE "public"."Shift" ADD CONSTRAINT "Shift_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shift" ADD CONSTRAINT "Shift_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."WorkScheduleTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShiftChangeRequest" ADD CONSTRAINT "ShiftChangeRequest_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "public"."Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShiftChangeRequest" ADD CONSTRAINT "ShiftChangeRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
