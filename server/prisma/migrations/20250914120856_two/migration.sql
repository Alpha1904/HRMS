/*
  Warnings:

  - A unique constraint covering the columns `[contactInfo]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "password" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_contactInfo_key" ON "public"."User"("contactInfo");
