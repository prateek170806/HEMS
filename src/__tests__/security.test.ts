import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as GET_Tariffs } from '../app/api/tariffs/route';
import { PATCH as PATCH_TariffPeriod } from '../app/api/tariffs/[id]/route';
import { GET as GET_Appliance, PATCH as PATCH_Appliance, DELETE as DELETE_Appliance } from '../app/api/appliances/[id]/route';
import { overrideScheduleAction, updateSimulationStateAction } from '../app/actions';
import { markAsReadAction, markAllAsReadAction, clearNotificationsAction } from '../app/notifications/actions';
import { prisma } from '../lib/server/db';
import * as auth from '../lib/server/auth';
import { NextRequest } from 'next/server';

const mockPrisma = vi.hoisted(() => ({
  tariff: { findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  tariffPeriod: { updateMany: vi.fn() },
  appliance: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
  schedule: { deleteMany: vi.fn(), create: vi.fn() },
  household: { update: vi.fn() },
  notification: { updateMany: vi.fn(), deleteMany: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock('../lib/server/db', () => ({ prisma: mockPrisma }));
vi.mock('../lib/prisma', () => ({ default: mockPrisma }));

vi.mock('../lib/server/auth', () => ({
  getCurrentHousehold: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock executeOptimizationRun
vi.mock('../lib/optimization/execute', () => ({
  executeOptimizationRun: vi.fn(),
}));

describe('Phase 3 Security Remediation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tariffs API', () => {
    it('GET /api/tariffs should deny unauthenticated access', async () => {
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(null);
      const res = await GET_Tariffs();
      expect(res.status).toBe(401);
    });

    it('GET /api/tariffs should isolate reads to the current household', async () => {
      const mockHousehold = { id: 'hh-1' } as unknown as { id: string };
      // @ts-expect-error Mocking household partial
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(mockHousehold);
      vi.mocked(prisma.tariff.findMany).mockResolvedValueOnce([]);

      await GET_Tariffs();

      expect(prisma.tariff.findMany).toHaveBeenCalledWith({
        where: { householdId: 'hh-1' },
        include: { periods: { orderBy: { startTime: 'asc' } } }
      });
    });

    it('PATCH /api/tariffs/[id] should deny cross-tenant period updates', async () => {
      const mockHousehold = { id: 'hh-1' } as unknown as { id: string };
      // @ts-expect-error Mocking household partial
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(mockHousehold);
      // Mock existing tariff lookup
      // @ts-expect-error Mocking tariff partial
      vi.mocked(prisma.tariff.findFirst).mockResolvedValueOnce({ id: 't-1', householdId: 'hh-1' });

      const req = new Request('http://localhost/api/tariffs/t-1', {
        method: 'PATCH',
        body: JSON.stringify({
          periods: [{
            id: 'p-1', name: 'Peak', startTime: '18:00', endTime: '22:00', pricePerKwh: 12.0, type: 'peak'
          }]
        })
      });

      await PATCH_TariffPeriod(req as NextRequest, { params: Promise.resolve({ id: 't-1' }) });

      // Verify that the composite key updateMany was called to prevent IDOR
      expect(prisma.tariffPeriod.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'p-1', tariffId: 't-1' }
      }));
    });
  });

  describe('Appliances API', () => {
    it('GET /api/appliances/[id] should deny access to foreign appliances', async () => {
      const mockHousehold = { id: 'hh-1' } as unknown as { id: string };
      // @ts-expect-error Mocking household partial
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(mockHousehold);
      vi.mocked(prisma.appliance.findFirst).mockResolvedValueOnce(null);

      const res = await GET_Appliance(new Request('http://localhost/api/appliances/app-foreign'), { params: Promise.resolve({ id: 'app-foreign' }) });
      expect(res.status).toBe(404);
      
      expect(prisma.appliance.findFirst).toHaveBeenCalledWith({
        where: { id: 'app-foreign', householdId: 'hh-1' }
      });
    });

    it('PATCH /api/appliances/[id] should deny updates to foreign appliances', async () => {
      const mockHousehold = { id: 'hh-1' } as unknown as { id: string };
      // @ts-expect-error Mocking household partial
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(mockHousehold);
      vi.mocked(prisma.appliance.findFirst).mockResolvedValueOnce(null);

      const req = new Request('http://localhost/api/appliances/app-foreign', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Hacked Appliance' })
      });

      const res = await PATCH_Appliance(req as NextRequest, { params: Promise.resolve({ id: 'app-foreign' }) });
      expect(res.status).toBe(404);
      expect(prisma.appliance.update).not.toHaveBeenCalled();
    });

    it('DELETE /api/appliances/[id] should deny deletion of foreign appliances', async () => {
      const mockHousehold = { id: 'hh-1' } as unknown as { id: string };
      // @ts-expect-error Mocking household partial
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(mockHousehold);
      vi.mocked(prisma.appliance.findFirst).mockResolvedValueOnce(null);

      const res = await DELETE_Appliance(new Request('http://localhost/api/appliances/app-foreign', { method: 'DELETE' }), { params: Promise.resolve({ id: 'app-foreign' }) });
      expect(res.status).toBe(404);
      expect(prisma.appliance.delete).not.toHaveBeenCalled();
    });

    it('DELETE /api/appliances/[id] should delete associated schedules before deleting appliance', async () => {
      const mockHousehold = { id: 'hh-1' } as unknown as { id: string };
      // @ts-expect-error Mocking household partial
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(mockHousehold);
      // @ts-expect-error Mocking appliance lookup
      vi.mocked(prisma.appliance.findFirst).mockResolvedValueOnce({ id: 'app-1', householdId: 'hh-1' });

      const res = await DELETE_Appliance(new Request('http://localhost/api/appliances/app-1', { method: 'DELETE' }), { params: Promise.resolve({ id: 'app-1' }) });
      expect(res.status).toBe(204);
      expect(prisma.schedule.deleteMany).toHaveBeenCalledWith({ where: { applianceId: 'app-1', householdId: 'hh-1' } });
      expect(prisma.appliance.delete).toHaveBeenCalledWith({ where: { id: 'app-1' } });
    });
  });

  describe('Appliance Server Actions', () => {
    it('overrideScheduleAction should isolate appliances to current household', async () => {
      const mockHousehold = { id: 'hh-1' } as unknown as { id: string };
      // @ts-expect-error Mocking household partial
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(mockHousehold);
      vi.mocked(prisma.appliance.findFirst).mockResolvedValueOnce(null); // Not found or wrong household

      await expect(overrideScheduleAction('app-1')).rejects.toThrow("Appliance not found");

      expect(mockPrisma.appliance.findFirst).toHaveBeenCalledWith({
        where: { id: 'app-1', householdId: 'hh-1' }
      });
    });
  });

  describe('Simulation Server Actions', () => {
    it('updateSimulationStateAction should reject mass assignment of protected fields', async () => {
      const mockHousehold = { id: 'hh-1' } as unknown as { id: string };
      // @ts-expect-error Mocking household partial
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(mockHousehold);

      const maliciousData = {
        baseLoad: 15,
        userId: 'hacker-1', // Malicious payload
        householdId: 'foreign-hh',
        customerId: 'sub-1234',
        id: 'hh-admin',
      };

      await expect(updateSimulationStateAction(maliciousData as unknown as Parameters<typeof updateSimulationStateAction>[0])).rejects.toThrow("Invalid simulation state data");
    });

    it('updateSimulationStateAction should accept valid allowlisted fields', async () => {
      const mockHousehold = { id: 'hh-1' } as unknown as { id: string };
      // @ts-expect-error Mocking household partial
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(mockHousehold);

      const validData = {
        baseLoad: 15,
        solarIrradiance: 800,
      };

      await updateSimulationStateAction(validData);

      expect(mockPrisma.household.update).toHaveBeenCalledWith({
        where: { id: 'hh-1' },
        data: validData
      });
    });
  });

  describe('Notification Server Actions', () => {
    it('markAsReadAction should isolate by householdId', async () => {
      const mockHousehold = { id: 'hh-1' } as unknown as { id: string };
      // @ts-expect-error Mocking household partial
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(mockHousehold);

      await markAsReadAction('notif-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', householdId: 'hh-1' },
        data: { isRead: true }
      });
    });

    it('markAllAsReadAction should isolate by householdId', async () => {
      const mockHousehold = { id: 'hh-1' } as unknown as { id: string };
      // @ts-expect-error Mocking household partial
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(mockHousehold);

      await markAllAsReadAction();

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { householdId: 'hh-1', isRead: false },
        data: { isRead: true }
      });
    });

    it('clearNotificationsAction should isolate by householdId', async () => {
      const mockHousehold = { id: 'hh-1' } as unknown as { id: string };
      // @ts-expect-error Mocking household partial
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(mockHousehold);

      await clearNotificationsAction();

      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { householdId: 'hh-1' }
      });
    });
  });
});
