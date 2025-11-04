-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'RECRUITER', 'CANDIDATE', 'SYSTEM_ADMIN');

-- CreateEnum
CREATE TYPE "public"."ContractType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'FREELANCE');

-- CreateEnum
CREATE TYPE "public"."LeaveType" AS ENUM ('VACATION', 'SICK', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'UNPAID');

-- CreateEnum
CREATE TYPE "public"."LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."EvalPeriod" AS ENUM ('QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'AD_HOC');

-- CreateEnum
CREATE TYPE "public"."PostingStatus" AS ENUM ('OPEN', 'CLOSED', 'DRAFT', 'PAUSED');

-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('PENDING', 'REVIEWED', 'INTERVIEW', 'SELECTED', 'REJECTED', 'OFFERED', 'HIRED');

-- CreateEnum
CREATE TYPE "public"."TrainingType" AS ENUM ('INTERNAL', 'EXTERNAL', 'ONLINE', 'IN_PERSON', 'MANDATORY');

-- CreateEnum
CREATE TYPE "public"."DepartureReason" AS ENUM ('RESIGNATION', 'FIRING', 'RETIREMENT', 'TERMINATION', 'LAYOFF');

-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('PERFORMANCE', 'ABSENCE', 'SALARY', 'TURNOVER', 'DIVERSITY', 'COMPLIANCE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "otp" TEXT,
    "otpExpiry" TIMESTAMP(3),
    "resetOtp" TEXT,
    "resetOtpExpiry" TIMESTAMP(3),
    "refreshTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "tenantId" TEXT,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Profile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "phone" TEXT,
    "site" TEXT,
    "department" TEXT,
    "position" TEXT,
    "hireDate" TIMESTAMP(3),
    "terminationDate" TIMESTAMP(3),
    "isTerminated" BOOLEAN NOT NULL DEFAULT false,
    "seniority" INTEGER,
    "contractType" "public"."ContractType",
    "contractStart" TIMESTAMP(3),
    "contractEnd" TIMESTAMP(3),
    "roleData" JSONB,
    "managerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permissions" (
    "id" SERIAL NOT NULL,
    "role" "public"."Role" NOT NULL,
    "resource" TEXT NOT NULL,
    "actions" TEXT[],
    "site" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Candidate" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "resumeUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobPosting" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "department" TEXT,
    "site" TEXT,
    "salaryRange" JSONB,
    "requirements" TEXT,
    "status" "public"."PostingStatus" NOT NULL DEFAULT 'OPEN',
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "recruiterId" INTEGER,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Application" (
    "id" SERIAL NOT NULL,
    "candidateId" INTEGER,
    "postingId" INTEGER NOT NULL,
    "profileId" INTEGER,
    "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interviewedAt" TIMESTAMP(3),
    "offerSentAt" TIMESTAMP(3),
    "hiredAt" TIMESTAMP(3),
    "feedback" TEXT,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "uploadUrl" TEXT,
    "thumbnailUrl" TEXT,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileId" INTEGER,
    "candidateId" INTEGER,
    "applicationId" INTEGER,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Leave" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "manager_id" INTEGER,
    "hr_admin_id" INTEGER,
    "type" "public"."LeaveType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "daysRequested" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "reason" TEXT,
    "status" "public"."LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "balanceUsed" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Leave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Schedule" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "shifts" JSONB[],
    "rotationType" TEXT,
    "workWeekHours" DOUBLE PRECISION,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Evaluation" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "evaluatorId" INTEGER,
    "period" "public"."EvalPeriod" NOT NULL,
    "overallScore" DOUBLE PRECISION,
    "scores" JSONB,
    "achievements" TEXT,
    "improvements" TEXT,
    "goals" JSONB,
    "selfEval" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Training" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."TrainingType" NOT NULL,
    "durationHours" DOUBLE PRECISION,
    "provider" TEXT,
    "cost" DOUBLE PRECISION,
    "completionDate" TIMESTAMP(3),
    "certification" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "profileId" INTEGER NOT NULL,
    "assignedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "processedById" INTEGER,
    "period" TEXT NOT NULL,
    "baseSalary" DOUBLE PRECISION NOT NULL,
    "bonuses" DOUBLE PRECISION,
    "deductions" JSONB,
    "overtimeHours" DOUBLE PRECISION,
    "totalNet" DOUBLE PRECISION NOT NULL,
    "payslipUrl" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "channelType" TEXT,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Announcement" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "targetSites" TEXT[],
    "publishDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "postedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Departure" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "processedById" INTEGER,
    "reason" "public"."DepartureReason" NOT NULL,
    "exitDate" TIMESTAMP(3) NOT NULL,
    "noticePeriodDays" INTEGER,
    "finalPayAmount" DOUBLE PRECISION,
    "indemnity" DOUBLE PRECISION,
    "exitInterviewNotes" TEXT,
    "surveyResponses" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Departure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" SERIAL NOT NULL,
    "type" "public"."ReportType" NOT NULL,
    "title" TEXT,
    "filters" JSONB,
    "data" JSONB NOT NULL,
    "fileUrl" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedById" INTEGER NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" INTEGER,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "performedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "public"."User"("isActive");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "public"."User"("tenantId");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "public"."User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "public"."Profile"("userId");

-- CreateIndex
CREATE INDEX "Profile_userId_idx" ON "public"."Profile"("userId");

-- CreateIndex
CREATE INDEX "Profile_department_idx" ON "public"."Profile"("department");

-- CreateIndex
CREATE INDEX "Profile_site_idx" ON "public"."Profile"("site");

-- CreateIndex
CREATE INDEX "Profile_managerId_idx" ON "public"."Profile"("managerId");

-- CreateIndex
CREATE INDEX "Profile_isTerminated_deletedAt_idx" ON "public"."Profile"("isTerminated", "deletedAt");

-- CreateIndex
CREATE INDEX "Permissions_role_resource_idx" ON "public"."Permissions"("role", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "Permissions_role_resource_site_tenantId_key" ON "public"."Permissions"("role", "resource", "site", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_email_key" ON "public"."Candidate"("email");

-- CreateIndex
CREATE INDEX "Candidate_email_idx" ON "public"."Candidate"("email");

-- CreateIndex
CREATE INDEX "JobPosting_recruiterId_idx" ON "public"."JobPosting"("recruiterId");

-- CreateIndex
CREATE INDEX "JobPosting_status_idx" ON "public"."JobPosting"("status");

-- CreateIndex
CREATE INDEX "JobPosting_site_department_idx" ON "public"."JobPosting"("site", "department");

-- CreateIndex
CREATE INDEX "Application_candidateId_idx" ON "public"."Application"("candidateId");

-- CreateIndex
CREATE INDEX "Application_postingId_idx" ON "public"."Application"("postingId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "public"."Application"("status");

-- CreateIndex
CREATE INDEX "Application_profileId_idx" ON "public"."Application"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_applicationId_key" ON "public"."Document"("applicationId");

-- CreateIndex
CREATE INDEX "Document_profileId_idx" ON "public"."Document"("profileId");

-- CreateIndex
CREATE INDEX "Document_candidateId_idx" ON "public"."Document"("candidateId");

-- CreateIndex
CREATE INDEX "Document_applicationId_idx" ON "public"."Document"("applicationId");

-- CreateIndex
CREATE INDEX "Document_type_uploadDate_idx" ON "public"."Document"("type", "uploadDate");

-- CreateIndex
CREATE INDEX "Leave_profileId_status_idx" ON "public"."Leave"("profileId", "status");

-- CreateIndex
CREATE INDEX "Leave_startDate_endDate_idx" ON "public"."Leave"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Leave_manager_id_idx" ON "public"."Leave"("manager_id");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_profileId_key" ON "public"."Schedule"("profileId");

-- CreateIndex
CREATE INDEX "Schedule_profileId_idx" ON "public"."Schedule"("profileId");

-- CreateIndex
CREATE INDEX "Evaluation_profileId_period_idx" ON "public"."Evaluation"("profileId", "period");

-- CreateIndex
CREATE INDEX "Evaluation_evaluatorId_idx" ON "public"."Evaluation"("evaluatorId");

-- CreateIndex
CREATE INDEX "Training_profileId_idx" ON "public"."Training"("profileId");

-- CreateIndex
CREATE INDEX "Training_status_completionDate_idx" ON "public"."Training"("status", "completionDate");

-- CreateIndex
CREATE INDEX "Payment_profileId_period_idx" ON "public"."Payment"("profileId", "period");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "public"."Payment"("paymentDate");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_idx" ON "public"."Message"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "Message_createdAt_isRead_idx" ON "public"."Message"("createdAt", "isRead");

-- CreateIndex
CREATE INDEX "Announcement_postedById_idx" ON "public"."Announcement"("postedById");

-- CreateIndex
CREATE INDEX "Announcement_publishDate_idx" ON "public"."Announcement"("publishDate");

-- CreateIndex
CREATE UNIQUE INDEX "Departure_profileId_key" ON "public"."Departure"("profileId");

-- CreateIndex
CREATE INDEX "Departure_profileId_idx" ON "public"."Departure"("profileId");

-- CreateIndex
CREATE INDEX "Departure_exitDate_status_idx" ON "public"."Departure"("exitDate", "status");

-- CreateIndex
CREATE INDEX "Report_generatedById_type_idx" ON "public"."Report"("generatedById", "type");

-- CreateIndex
CREATE INDEX "Report_generatedAt_idx" ON "public"."Report"("generatedAt");

-- CreateIndex
CREATE INDEX "AuditLog_performedById_idx" ON "public"."AuditLog"("performedById");

-- CreateIndex
CREATE INDEX "AuditLog_resource_resourceId_idx" ON "public"."AuditLog"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Profile" ADD CONSTRAINT "Profile_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobPosting" ADD CONSTRAINT "JobPosting_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "public"."Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobPosting" ADD CONSTRAINT "JobPosting_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "public"."Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "public"."JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "public"."Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Leave" ADD CONSTRAINT "Leave_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Leave" ADD CONSTRAINT "Leave_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Leave" ADD CONSTRAINT "Leave_hr_admin_id_fkey" FOREIGN KEY ("hr_admin_id") REFERENCES "public"."Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Schedule" ADD CONSTRAINT "Schedule_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evaluation" ADD CONSTRAINT "Evaluation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evaluation" ADD CONSTRAINT "Evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "public"."Profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Training" ADD CONSTRAINT "Training_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Training" ADD CONSTRAINT "Training_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "public"."Profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "public"."Profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Announcement" ADD CONSTRAINT "Announcement_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Departure" ADD CONSTRAINT "Departure_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Departure" ADD CONSTRAINT "Departure_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "public"."Profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
