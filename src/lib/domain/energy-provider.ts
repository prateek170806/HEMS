import { Appliance, Household, TariffPeriod, Schedule } from "@prisma/client";

export interface EnergyReadingData {
  timestamp: Date;
  importKw: number;
  exportKw: number;
  solarKw: number;
  batterySoc: number;
  homeDemandKw: number;
}

export interface EnergyDataProvider {
  getReadings(
    household: Household,
    appliances: Appliance[],
    schedules: Schedule[],
    tariffPeriods: TariffPeriod[],
    date: Date
  ): Promise<EnergyReadingData[]>;
}
