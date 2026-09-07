import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { z } from 'zod';

const updateTariffPeriodSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  pricePerKwh: z.number().min(0),
  type: z.enum(['peak', 'off_peak', 'normal', 'solar']),
});

const updateTariffSchema = z.object({
  name: z.string().min(1).optional(),
  periods: z.array(updateTariffPeriodSchema).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = updateTariffSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', issues: result.error.issues }, { status: 400 });
    }

    const { name, periods } = result.data;

    if (name) {
      await prisma.tariff.update({ where: { id }, data: { name } });
    }

    if (periods) {
      for (const period of periods) {
        await prisma.tariffPeriod.update({
          where: { id: period.id },
          data: {
            name: period.name,
            startTime: period.startTime,
            endTime: period.endTime,
            pricePerKwh: period.pricePerKwh,
            type: period.type,
          }
        });
      }
    }

    const updated = await prisma.tariff.findUnique({
      where: { id },
      include: { periods: { orderBy: { startTime: 'asc' } } }
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
