import { TariffPeriod } from '@prisma/client';
import { parse, isAfter, isBefore, isEqual, format } from 'date-fns';

/**
 * Returns the current active tariff period for a given time
 */
export function getCurrentTariffPeriod(periods: TariffPeriod[], time: Date): TariffPeriod | null {
  const timeString = format(time, 'HH:mm');
  const [hours, minutes] = timeString.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;

  for (const period of periods) {
    const [startH, startM] = period.startTime.split(':').map(Number);
    const [endH, endM] = period.endTime.split(':').map(Number);
    
    let startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;

    // Handle midnight wrap around
    if (endTotal === 0 && startTotal !== 0) {
        endTotal = 24 * 60; // 1440
    }

    if (totalMinutes >= startTotal && totalMinutes < endTotal) {
      return period;
    }
  }

  return null;
}

/**
 * Returns the price for a specific slot (interval in minutes)
 */
export function getPriceForTime(periods: TariffPeriod[], time: Date): number {
  const period = getCurrentTariffPeriod(periods, time);
  return period ? period.pricePerKwh : 0;
}
