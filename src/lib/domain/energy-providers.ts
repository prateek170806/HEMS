import { EnergyDataProvider, EnergyReadingData } from "./energy-provider";
import { Appliance, Household, TariffPeriod, Schedule } from "@prisma/client";
import { simulateDay } from "../simulation/engine";
import { EnergyRepository } from "../server/repositories/energy.repository";

export class SimulationEnergyProvider implements EnergyDataProvider {
  async getReadings(
    household: Household,
    appliances: Appliance[],
    schedules: Schedule[],
    _tariffPeriods: TariffPeriod[],
    date: Date
  ): Promise<EnergyReadingData[]> {
    // We map schedules to match the expected format for simulateDay
    const mappedSchedules = schedules.map(s => ({
      ...s,
      reason: s.reason ?? undefined
    }));
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawSim = simulateDay(date, household, appliances, mappedSchedules as any[], 1.0, 1.0);
    
    return rawSim.map(s => ({
      timestamp: s.timestamp,
      importKw: s.gridImportKw,
      exportKw: s.gridExportKw,
      solarKw: s.solarKw,
      batterySoc: s.batterySoc,
      homeDemandKw: s.homeDemandKw
    }));
  }
}

export class DatabaseEnergyProvider implements EnergyDataProvider {
  async getReadings(
    household: Household,
    _appliances: Appliance[],
    _schedules: Schedule[],
    _tariffPeriods: TariffPeriod[],
    date: Date
  ): Promise<EnergyReadingData[]> {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const records = await EnergyRepository.getHistory(household.id, date, nextDay);
    return records.map(r => ({
      timestamp: r.timestamp,
      importKw: r.importKw,
      exportKw: r.exportKw,
      solarKw: r.solarKw,
      batterySoc: r.batterySoc,
      homeDemandKw: r.homeDemandKw
    }));
  }
}
