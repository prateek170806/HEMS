import { describe, it, expect } from 'vitest';
import { getPriceForTime } from './tariff';
import { TariffPeriod } from '@prisma/client';
import { startOfDay, addHours } from 'date-fns';

describe('Tariff Domain Logic', () => {
  const mockPeriods: TariffPeriod[] = [
    {
      id: 'p1',
      tariffId: 't1',
      name: 'Off-Peak',
      startTime: '00:00',
      endTime: '06:00',
      pricePerKwh: 3.5,
      type: 'off_peak',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'p2',
      tariffId: 't1',
      name: 'Peak',
      startTime: '18:00',
      endTime: '22:00',
      pricePerKwh: 12.0,
      type: 'peak',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'p3',
      tariffId: 't1',
      name: 'Normal',
      startTime: '06:00',
      endTime: '18:00',
      pricePerKwh: 5.5,
      type: 'normal',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'p4',
      tariffId: 't1',
      name: 'Night',
      startTime: '22:00',
      endTime: '23:59',
      pricePerKwh: 4.0,
      type: 'off_peak',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const baseDate = startOfDay(new Date());

  it('should return correct price for off-peak time', () => {
    const time = addHours(baseDate, 2); // 02:00
    expect(getPriceForTime(mockPeriods, time)).toBe(3.5);
  });

  it('should return correct price for peak time', () => {
    const time = addHours(baseDate, 19); // 19:00
    expect(getPriceForTime(mockPeriods, time)).toBe(12.0);
  });

  it('should return correct price for normal time', () => {
    const time = addHours(baseDate, 12); // 12:00
    expect(getPriceForTime(mockPeriods, time)).toBe(5.5);
  });

  it('should handle boundaries correctly (inclusive start, exclusive end)', () => {
    const timeStart = addHours(baseDate, 18); // 18:00 exact
    expect(getPriceForTime(mockPeriods, timeStart)).toBe(12.0);
    
    const timeEnd = addHours(baseDate, 22); // 22:00 exact -> moves to next period
    expect(getPriceForTime(mockPeriods, timeEnd)).toBe(4.0);
  });
});
