-- AlterTable
ALTER TABLE "OptimizationRun" ADD COLUMN     "baselineCost" DOUBLE PRECISION,
ADD COLUMN     "baselinePeak" DOUBLE PRECISION,
ADD COLUMN     "gridImport" DOUBLE PRECISION,
ADD COLUMN     "ruleBasedCost" DOUBLE PRECISION,
ADD COLUMN     "ruleBasedPeak" DOUBLE PRECISION,
ADD COLUMN     "runtimeMs" INTEGER,
ADD COLUMN     "solarUsage" DOUBLE PRECISION;
