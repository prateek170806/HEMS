import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';

describe('Household Cascade & Relational Integrity Invariants', () => {
  const dmmf = Prisma.dmmf;
  const models = dmmf.datamodel.models;

  function getModel(name: string) {
    const model = models.find((m) => m.name === name);
    if (!model) throw new Error(`Model ${name} not found in Prisma DMMF`);
    return model;
  }

  function getRelationField(modelName: string, relationFieldName: string) {
    const model = getModel(modelName);
    const field = model.fields.find((f) => f.name === relationFieldName);
    if (!field) throw new Error(`Field ${relationFieldName} not found in model ${modelName}`);
    return field;
  }

  describe('1. Tenant-Owned Models Cascade on Household Delete', () => {
    it('Appliance.household must have onDelete: Cascade', () => {
      const field = getRelationField('Appliance', 'household');
      expect(field.relationOnDelete).toBe('Cascade');
    });

    it('Schedule.household must have onDelete: Cascade', () => {
      const field = getRelationField('Schedule', 'household');
      expect(field.relationOnDelete).toBe('Cascade');
    });

    it('Tariff.household must have onDelete: Cascade', () => {
      const field = getRelationField('Tariff', 'household');
      expect(field.relationOnDelete).toBe('Cascade');
    });

    it('MeterReading.household must have onDelete: Cascade', () => {
      const field = getRelationField('MeterReading', 'household');
      expect(field.relationOnDelete).toBe('Cascade');
    });

    it('OptimizationRun.household must have onDelete: Cascade', () => {
      const field = getRelationField('OptimizationRun', 'household');
      expect(field.relationOnDelete).toBe('Cascade');
    });

    it('Notification.household must have onDelete: Cascade', () => {
      const field = getRelationField('Notification', 'household');
      expect(field.relationOnDelete).toBe('Cascade');
    });
  });

  describe('2. Sub-Dependent Models Cascade on Parent Delete', () => {
    it('TariffPeriod.tariff must have onDelete: Cascade', () => {
      const field = getRelationField('TariffPeriod', 'tariff');
      expect(field.relationOnDelete).toBe('Cascade');
    });

    it('Schedule.optimization must have onDelete: Cascade', () => {
      const field = getRelationField('Schedule', 'optimization');
      expect(field.relationOnDelete).toBe('Cascade');
    });
  });

  describe('3. Protected Invariants (User & Appliance Restrict)', () => {
    it('Household.user must NOT cascade to User (User is preserved)', () => {
      const field = getRelationField('Household', 'user');
      // Should not be Cascade, ensuring User preservation
      expect(field.relationOnDelete).not.toBe('Cascade');
    });

    it('Schedule.appliance must maintain RESTRICT behavior', () => {
      const field = getRelationField('Schedule', 'appliance');
      // Must NOT be Cascade to preserve validated RESTRICT invariant
      expect(field.relationOnDelete).not.toBe('Cascade');
    });
  });

  describe('4. Multi-Tenant Key Isolation', () => {
    it('All tenant-owned models must have householdId indexed or present', () => {
      const tenantModels = ['Appliance', 'Tariff', 'MeterReading', 'Notification', 'OptimizationRun', 'Schedule'];
      for (const modelName of tenantModels) {
        const model = getModel(modelName);
        const householdIdField = model.fields.find((f) => f.name === 'householdId');
        expect(householdIdField).toBeDefined();
        expect(householdIdField?.type).toBe('String');
      }
    });
  });
});
