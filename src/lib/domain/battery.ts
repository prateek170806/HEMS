export interface BatteryState {
  socPercentage: number;
  capacityKwh: number;
  maxChargeKw: number;
  maxDischargeKw: number;
  reserveSocPercentage: number;
  efficiency: number; // e.g. 0.95 for 95%
}

export function calculateBatterySOC(
  currentState: BatteryState,
  chargeKw: number,
  dischargeKw: number,
  durationHours: number
): number {
  if (chargeKw > 0 && dischargeKw > 0) {
    throw new Error("Invalid battery state: cannot simultaneously charge and discharge");
  }

  const currentEnergyKwh = (currentState.socPercentage / 100) * currentState.capacityKwh;
  
  // Apply efficiency only on charging to simplify (round-trip efficiency)
  const energyAdded = chargeKw * durationHours * currentState.efficiency;
  const energyRemoved = dischargeKw * durationHours;
  
  const newEnergyKwh = currentEnergyKwh + energyAdded - energyRemoved;
  
  const newSoc = (newEnergyKwh / currentState.capacityKwh) * 100;
  
  return Math.max(0, Math.min(100, newSoc));
}

export function canProvideEnergy(state: BatteryState, requestedKw: number, durationHours: number): boolean {
  if (state.socPercentage <= state.reserveSocPercentage) return false;
  
  const availableEnergyKwh = ((state.socPercentage - state.reserveSocPercentage) / 100) * state.capacityKwh;
  const requestedEnergy = requestedKw * durationHours;
  
  return availableEnergyKwh >= requestedEnergy && requestedKw <= state.maxDischargeKw;
}

export function canAcceptEnergy(state: BatteryState, availableKw: number, durationHours: number): boolean {
  if (state.socPercentage >= 100) return false;
  
  const spaceAvailableKwh = ((100 - state.socPercentage) / 100) * state.capacityKwh;
  const energyToAdd = availableKw * durationHours * state.efficiency;
  
  return spaceAvailableKwh >= energyToAdd && availableKw <= state.maxChargeKw;
}
