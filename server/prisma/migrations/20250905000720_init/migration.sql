-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'RECRUITER');

-- CreateEnum
CREATE TYPE "public"."ContractType" AS ENUM ('FullTime', 'PartTime', 'Contract');

-- CreateEnum
CREATE TYPE "public"."LeaveType" AS ENUM ('Vacation', 'Sick', 'Maternity');

-- CreateEnum
CREATE TYPE "public"."LeaveStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "public"."EvalPeriod" AS ENUM ('Quarterly', 'Annual');

-- CreateEnum
CREATE TYPE "public"."PostingStatus" AS ENUM ('Open', 'Closed');

-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('Pending', 'Selected', 'Rejected');

-- CreateEnum
CREATE TYPE "public"."TrainingType" AS ENUM ('Internal', 'External');

-- CreateEnum
CREATE TYPE "public"."DepartureReason" AS ENUM ('Resignation', 'Firing', 'Retirement');

-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('Performance', 'Absence', 'Salary');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permissions" (
    "id" SERIAL NOT NULL,
    "role" "public"."Role" NOT NULL,
    "resource" TEXT NOT NULL,
    "actions" TEXT[],
    "site" TEXT,

    CONSTRAINT "Permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Manager" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Manager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Employee" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "managerId" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "seniority" INTEGER NOT NULL,
    "contractStart" TIMESTAMP(3) NOT NULL,
    "contractEnd" TIMESTAMP(3),
    "contractType" "public"."ContractType" NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HR_Admin" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sitesManaged" TEXT[],

    CONSTRAINT "HR_Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Recruiter" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Recruiter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Candidate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL,
    "content" BYTEA NOT NULL,
    "employeeId" INTEGER,
    "candidateId" INTEGER,
    "applicationId" INTEGER,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Leave" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "managerId" INTEGER,
    "hrAdminId" INTEGER,
    "type" "public"."LeaveType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."LeaveStatus" NOT NULL DEFAULT 'Pending',
    "balanceRemaining" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Leave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Schedule" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "shifts" JSONB[],
    "rotationType" TEXT,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Evaluation" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "managerId" INTEGER,
    "period" "public"."EvalPeriod" NOT NULL,
    "scores" JSONB NOT NULL,
    "achievements" TEXT,
    "improvements" TEXT,
    "goals" TEXT[],
    "selfEval" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobPosting" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "status" "public"."PostingStatus" NOT NULL DEFAULT 'Open',
    "recruiterId" INTEGER NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Application" (
    "id" SERIAL NOT NULL,
    "candidateId" INTEGER NOT NULL,
    "postingId" INTEGER NOT NULL,
    "recruiterId" INTEGER,
    "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Training" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "type" "public"."TrainingType" NOT NULL,
    "completionDate" TIMESTAMP(3),
    "certification" TEXT,
    "employeeId" INTEGER NOT NULL,
    "managerId" INTEGER,

    CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "hrAdminId" INTEGER,
    "baseSalary" DOUBLE PRECISION NOT NULL,
    "bonuses" DOUBLE PRECISION,
    "primes" DOUBLE PRECISION,
    "payslipDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "recruiterId" INTEGER,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Announcement" (
    "id" SERIAL NOT NULL,
    "hrAdminId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "publishDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Departure" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "hrAdminId" INTEGER,
    "reason" "public"."DepartureReason" NOT NULL,
    "exitDate" TIMESTAMP(3) NOT NULL,
    "indemnity" DOUBLE PRECISION,
    "surveyResponses" JSONB,

    CONSTRAINT "Departure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" SERIAL NOT NULL,
    "hrAdminId" INTEGER NOT NULL,
    "type" "public"."ReportType" NOT NULL,
    "data" JSONB NOT NULL,
    "generatedDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_site_idx" ON "public"."User"("site");

-- CreateIndex
CREATE INDEX "Permissions_role_resource_idx" ON "public"."Permissions"("role", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "Manager_userId_key" ON "public"."Manager"("userId");

-- CreateIndex
CREATE INDEX "Manager_userId_idx" ON "public"."Manager"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "public"."Employee"("userId");

-- CreateIndex
CREATE INDEX "Employee_department_userId_idx" ON "public"."Employee"("department", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "HR_Admin_userId_key" ON "public"."HR_Admin"("userId");

-- CreateIndex
CREATE INDEX "HR_Admin_userId_idx" ON "public"."HR_Admin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Recruiter_userId_key" ON "public"."Recruiter"("userId");

-- CreateIndex
CREATE INDEX "Recruiter_userId_idx" ON "public"."Recruiter"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_applicationId_key" ON "public"."Document"("applicationId");

-- CreateIndex
CREATE INDEX "Leave_employeeId_status_idx" ON "public"."Leave"("employeeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_employeeId_key" ON "public"."Schedule"("employeeId");

-- CreateIndex
CREATE INDEX "Schedule_employeeId_idx" ON "public"."Schedule"("employeeId");

-- CreateIndex
CREATE INDEX "Evaluation_employeeId_period_idx" ON "public"."Evaluation"("employeeId", "period");

-- CreateIndex
CREATE INDEX "JobPosting_recruiterId_site_idx" ON "public"."JobPosting"("recruiterId", "site");

-- CreateIndex
CREATE INDEX "Application_candidateId_postingId_idx" ON "public"."Application"("candidateId", "postingId");

-- CreateIndex
CREATE INDEX "Training_employeeId_idx" ON "public"."Training"("employeeId");

-- CreateIndex
CREATE INDEX "Payment_employeeId_payslipDate_idx" ON "public"."Payment"("employeeId", "payslipDate");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_idx" ON "public"."Message"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "Announcement_hrAdminId_idx" ON "public"."Announcement"("hrAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "Departure_employeeId_key" ON "public"."Departure"("employeeId");

-- CreateIndex
CREATE INDEX "Departure_employeeId_idx" ON "public"."Departure"("employeeId");

-- CreateIndex
CREATE INDEX "Report_hrAdminId_type_idx" ON "public"."Report"("hrAdminId", "type");

-- AddForeignKey
ALTER TABLE "public"."Manager" ADD CONSTRAINT "Manager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Employee" ADD CONSTRAINT "Employee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."Manager"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HR_Admin" ADD CONSTRAINT "HR_Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Recruiter" ADD CONSTRAINT "Recruiter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "public"."Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Leave" ADD CONSTRAINT "Leave_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Leave" ADD CONSTRAINT "Leave_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."Manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Leave" ADD CONSTRAINT "Leave_hrAdminId_fkey" FOREIGN KEY ("hrAdminId") REFERENCES "public"."HR_Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Schedule" ADD CONSTRAINT "Schedule_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evaluation" ADD CONSTRAINT "Evaluation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evaluation" ADD CONSTRAINT "Evaluation_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."Manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobPosting" ADD CONSTRAINT "JobPosting_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "public"."Recruiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "public"."Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "public"."JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "public"."Recruiter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Training" ADD CONSTRAINT "Training_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Training" ADD CONSTRAINT "Training_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."Manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_hrAdminId_fkey" FOREIGN KEY ("hrAdminId") REFERENCES "public"."HR_Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "public"."Recruiter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Announcement" ADD CONSTRAINT "Announcement_hrAdminId_fkey" FOREIGN KEY ("hrAdminId") REFERENCES "public"."HR_Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Departure" ADD CONSTRAINT "Departure_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Departure" ADD CONSTRAINT "Departure_hrAdminId_fkey" FOREIGN KEY ("hrAdminId") REFERENCES "public"."HR_Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_hrAdminId_fkey" FOREIGN KEY ("hrAdminId") REFERENCES "public"."HR_Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
