-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "public"."ChatType" AS ENUM ('DIRECT', 'GROUP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE "public"."ChatRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "type" "public"."ChatType" NOT NULL DEFAULT 'DIRECT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatMember" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "roomId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "ChatMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "roomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatRoom_updatedAt_idx" ON "public"."ChatRoom"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMember_userId_roomId_key" ON "public"."ChatMember"("userId", "roomId");

-- CreateIndex
CREATE INDEX "ChatMessage_roomId_createdAt_idx" ON "public"."ChatMessage"("roomId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."ChatMember" ADD CONSTRAINT "ChatMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMember" ADD CONSTRAINT "ChatMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
