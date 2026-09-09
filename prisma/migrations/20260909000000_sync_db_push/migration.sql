-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarInitials" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_customerId_key" ON "User"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AlterTable
ALTER TABLE "Household" ADD COLUMN "userId" TEXT;

-- AddForeignKey
ALTER TABLE "Household" ADD CONSTRAINT "Household_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "OptimizationRun" 
  ADD COLUMN "baselineGridImport" DOUBLE PRECISION,
  ADD COLUMN "baselineSolarUsage" DOUBLE PRECISION,
  ADD COLUMN "ruleBasedGridImport" DOUBLE PRECISION,
  ADD COLUMN "ruleBasedSolarUsage" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Schedule" 
  ADD COLUMN "affectedMetric" TEXT,
  ADD COLUMN "impact" TEXT,
  ADD COLUMN "originalEnd" TIMESTAMP(3),
  ADD COLUMN "originalStart" TIMESTAMP(3),
  ADD COLUMN "reasonCategory" TEXT;
