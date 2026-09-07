import { TariffPeriod } from '@prisma/client';
import { getPriceForTime } from './tariff';

export interface IntervalData {
  timestamp: Date;
  homeDemandKw: number;
  solarKw: number;
  batteryDischargeKw: number;
  batteryChargeKw: number;
  applianceDemandKw: number;
  durationHours: number; // e.g. 0.25 for 15 mins
}

export function calculateGridImport(data: IntervalData): number {
  const totalLoad = data.homeDemandKw + data.applianceDemandKw + data.batteryChargeKw;
  const totalSupply = data.solarKw + data.batteryDischargeKw;
  
  return Math.max(0, totalLoad - totalSupply);
}

export function calculateIntervalCost(data: IntervalData, periods: TariffPeriod[]): number {
  const gridImportKw = calculateGridImport(data);
  const price = getPriceForTime(periods, data.timestamp);
  
  return gridImportKw * data.durationHours * price;
}

export function calculateTotalCost(intervals: IntervalData[], periods: TariffPeriod[]): number {
  return intervals.reduce((acc, curr) => acc + calculateIntervalCost(curr, periods), 0);
}

export function calculatePeakDemand(intervals: IntervalData[]): number {
  if (intervals.length === 0) return 0;
  
  const imports = intervals.map(calculateGridImport);
  return Math.max(...imports);
}

export function calculateSavings(baselineCost: number, hemsCost: number): { savingAmount: number, savingPercent: number } {
  const savingAmount = baselineCost - hemsCost;
  const savingPercent = baselineCost > 0 ? (savingAmount / baselineCost) * 100 : 0;
  
  return { savingAmount, savingPercent };
}
