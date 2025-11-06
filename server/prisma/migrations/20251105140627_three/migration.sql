-- CreateTable
CREATE TABLE "public"."LeaveBalance" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "leaveType" "public"."LeaveType" NOT NULL,
    "year" INTEGER NOT NULL,
    "totalAllocated" DOUBLE PRECISION NOT NULL,
    "daysUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "daysCarriedOver" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeavePolicy" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "leaveType" "public"."LeaveType" NOT NULL,
    "daysAllocated" DOUBLE PRECISION NOT NULL,
    "contractType" "public"."ContractType",
    "role" "public"."Role",
    "department" TEXT,
    "site" TEXT,
    "minSeniority" INTEGER DEFAULT 0,
    "maxSeniority" INTEGER,
    "isCarryOverAllowed" BOOLEAN NOT NULL DEFAULT false,
    "maxCarryOverDays" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeavePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" SERIAL NOT NULL,
    "recipientId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "linkUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaveBalance_profileId_idx" ON "public"."LeaveBalance"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveBalance_profileId_leaveType_year_key" ON "public"."LeaveBalance"("profileId", "leaveType", "year");

-- CreateIndex
CREATE UNIQUE INDEX "LeavePolicy_name_key" ON "public"."LeavePolicy"("name");

-- CreateIndex
CREATE INDEX "LeavePolicy_contractType_role_department_idx" ON "public"."LeavePolicy"("contractType", "role", "department");

-- CreateIndex
CREATE INDEX "Notification_recipientId_isRead_idx" ON "public"."Notification"("recipientId", "isRead");

-- AddForeignKey
ALTER TABLE "public"."LeaveBalance" ADD CONSTRAINT "LeaveBalance_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
