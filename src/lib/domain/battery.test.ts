import { describe, it, expect } from 'vitest';
import { calculateBatterySOC, BatteryState, canProvideEnergy, canAcceptEnergy } from './battery';

describe('Battery Domain Logic', () => {
  const baseState: BatteryState = {
    socPercentage: 50,
    capacityKwh: 10,
    maxChargeKw: 5,
    maxDischargeKw: 5,
    reserveSocPercentage: 20,
    efficiency: 0.9,
  };

  describe('calculateBatterySOC', () => {
    it('should correctly calculate SOC after charging', () => {
      // 5 kW * 1 hour * 0.9 efficiency = 4.5 kWh added
      // Current SOC 50% of 10kWh = 5 kWh
      // Total = 9.5 kWh -> 95% SOC
      const newSoc = calculateBatterySOC(baseState, 5, 0, 1);
      expect(newSoc).toBe(95);
    });

    it('should correctly calculate SOC after discharging', () => {
      // 2 kW * 1 hour = 2 kWh removed
      // Current = 5 kWh. Total = 3 kWh -> 30% SOC
      const newSoc = calculateBatterySOC(baseState, 0, 2, 1);
      expect(newSoc).toBe(30);
    });

    it('should cap SOC at 100%', () => {
      const newSoc = calculateBatterySOC(baseState, 10, 0, 1);
      expect(newSoc).toBe(100);
    });

    it('should limit SOC at 0%', () => {
      const newSoc = calculateBatterySOC(baseState, 0, 10, 1);
      expect(newSoc).toBe(0);
    });

    it('should throw error on simultaneous charge and discharge', () => {
      expect(() => {
        calculateBatterySOC(baseState, 5, 2, 1);
      }).toThrow(/cannot simultaneously charge and discharge/);
    });
  });

  describe('canProvideEnergy', () => {
    it('should return true if enough energy above reserve', () => {
      expect(canProvideEnergy(baseState, 2, 1)).toBe(true);
    });

    it('should return false if requested exceeds max discharge rate', () => {
      expect(canProvideEnergy(baseState, 6, 0.1)).toBe(false); // 6kW > 5kW max
    });

    it('should return false if requesting below reserve', () => {
      // 50% - 20% reserve = 30% available (3kWh)
      expect(canProvideEnergy(baseState, 4, 1)).toBe(false); // Wants 4kWh
    });
  });

  describe('canAcceptEnergy', () => {
    it('should return true if enough space', () => {
      expect(canAcceptEnergy(baseState, 3, 1)).toBe(true);
    });

    it('should return false if requested exceeds max charge rate', () => {
      expect(canAcceptEnergy(baseState, 6, 0.1)).toBe(false);
    });
  });
});
