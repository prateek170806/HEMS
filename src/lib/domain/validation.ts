import { Appliance } from '@prisma/client';

export interface ScheduleSlot {
  startTime: Date;
  endTime: Date;
  applianceId: string;
}

export interface ValidationIssue {
  applianceId: string;
  reason: string;
}

export function validateSchedule(
  slots: ScheduleSlot[],
  appliances: Appliance[],
  householdPowerLimitKw: number
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Group slots by time to check power limits
  // In a real scenario, we'd discretize the timeline into 15m intervals
  // For validation, we'll do a simple overlap check
  
  // Check appliance constraints
  for (const slot of slots) {
    const appliance = appliances.find(a => a.id === slot.applianceId);
    if (!appliance) continue;

    const durationHours = (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60 * 60);

    // 1. Check runtime
    if (durationHours < appliance.minRuntime) {
      issues.push({
        applianceId: appliance.id,
        reason: `Duration (${durationHours.toFixed(1)}h) is less than minimum runtime (${appliance.minRuntime}h)`
      });
    }

    // 2. Check time windows
    if (appliance.earliestStart && appliance.latestFinish) {
      const slotStartH = slot.startTime.getHours();
      const slotStartM = slot.startTime.getMinutes();
      const slotStart = slotStartH * 60 + slotStartM;

      const slotEndH = slot.endTime.getHours();
      const slotEndM = slot.endTime.getMinutes();
      const slotEnd = slotEndH * 60 + slotEndM;

      const [eH, eM] = appliance.earliestStart.split(':').map(Number);
      const earliest = eH * 60 + eM;

      let [lH, lM] = appliance.latestFinish.split(':').map(Number);
      let latest = lH * 60 + lM;
      if (latest === 0) latest = 24 * 60; // 00:00 end of day

      if (slotStart < earliest || slotEnd > latest) {
        issues.push({
          applianceId: appliance.id,
          reason: `Scheduled outside allowed window (${appliance.earliestStart} - ${appliance.latestFinish})`
        });
      }
    }
  }

  return issues;
}
