/*
  Warnings:

  - You are about to drop the column `profileId` on the `Shift` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Shift" DROP CONSTRAINT "Shift_profileId_fkey";

-- DropIndex
DROP INDEX "public"."Shift_profileId_date_idx";

-- AlterTable
ALTER TABLE "public"."Profile" ADD COLUMN     "shiftId" INTEGER;

-- AlterTable
ALTER TABLE "public"."Shift" DROP COLUMN "profileId",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "title" TEXT;

-- CreateIndex
CREATE INDEX "Shift_date_idx" ON "public"."Shift"("date");

-- AddForeignKey
ALTER TABLE "public"."Profile" ADD CONSTRAINT "Profile_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "public"."Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
