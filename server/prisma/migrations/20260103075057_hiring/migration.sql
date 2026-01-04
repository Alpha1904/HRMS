/*
  Warnings:

  - The values [REVIEWED,SELECTED,OFFERED] on the enum `ApplicationStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isCompleted` on the `Shift` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."EmployeeStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TERMINATED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ApplicationStatus_new" AS ENUM ('PENDING', 'SCREENING', 'INTERVIEW', 'EXAMINATION', 'REJECTED', 'HIRED');
ALTER TABLE "public"."Application" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Application" ALTER COLUMN "status" TYPE "public"."ApplicationStatus_new" USING ("status"::text::"public"."ApplicationStatus_new");
ALTER TYPE "public"."ApplicationStatus" RENAME TO "ApplicationStatus_old";
ALTER TYPE "public"."ApplicationStatus_new" RENAME TO "ApplicationStatus";
DROP TYPE "public"."ApplicationStatus_old";
ALTER TABLE "public"."Application" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
ALTER TYPE "public"."ChatType" ADD VALUE 'ANNOUNCEMENT';

-- DropForeignKey
ALTER TABLE "public"."ChatMember" DROP CONSTRAINT "ChatMember_roomId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ChatMessage" DROP CONSTRAINT "ChatMessage_roomId_fkey";

-- DropIndex
DROP INDEX "public"."ChatMessage_roomId_createdAt_idx";

-- AlterTable
ALTER TABLE "public"."Application" ADD COLUMN     "boardPosition" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Shift" DROP COLUMN "isCompleted";

-- CreateTable
CREATE TABLE "public"."Interaction" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicationId" INTEGER NOT NULL,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Interaction" ADD CONSTRAINT "Interaction_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMember" ADD CONSTRAINT "ChatMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."ChatRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."ChatRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
