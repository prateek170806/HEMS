-- DropForeignKey
ALTER TABLE "Household" DROP CONSTRAINT "Household_userId_fkey";

-- AlterTable
ALTER TABLE "Household" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Appliance_householdId_idx" ON "Appliance"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "Household_userId_key" ON "Household"("userId");

-- CreateIndex
CREATE INDEX "MeterReading_householdId_idx" ON "MeterReading"("householdId");

-- CreateIndex
CREATE INDEX "Notification_householdId_idx" ON "Notification"("householdId");

-- CreateIndex
CREATE INDEX "OptimizationRun_householdId_idx" ON "OptimizationRun"("householdId");

-- CreateIndex
CREATE INDEX "Schedule_householdId_idx" ON "Schedule"("householdId");

-- CreateIndex
CREATE INDEX "Tariff_householdId_idx" ON "Tariff"("householdId");

-- AddForeignKey
ALTER TABLE "Household" ADD CONSTRAINT "Household_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

