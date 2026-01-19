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
    "selfEval" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Goal" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profileId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER DEFAULT 0,
    "targetDate" TIMESTAMP(3),
    "createdInEvaluationId" INTEGER,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Evaluation_profileId_period_idx" ON "public"."Evaluation"("profileId", "period");

-- CreateIndex
CREATE INDEX "Evaluation_evaluatorId_idx" ON "public"."Evaluation"("evaluatorId");

-- CreateIndex
CREATE INDEX "Goal_profileId_status_idx" ON "public"."Goal"("profileId", "status");

-- AddForeignKey
ALTER TABLE "public"."Evaluation" ADD CONSTRAINT "Evaluation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evaluation" ADD CONSTRAINT "Evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "public"."Profile"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Goal" ADD CONSTRAINT "Goal_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Goal" ADD CONSTRAINT "Goal_createdInEvaluationId_fkey" FOREIGN KEY ("createdInEvaluationId") REFERENCES "public"."Evaluation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
