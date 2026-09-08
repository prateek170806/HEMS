import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { energyReadingSchema } from '@/lib/validations/energy';

export async function POST(req: Request) {
  try {
    const household = await prisma.household.findFirst();
    if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 });

    const body = await req.json();
    const result = energyReadingSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid input', issues: result.error.issues }, { status: 400 });

    const reading = await prisma.meterReading.create({
      data: {
        householdId: household.id,
        timestamp: new Date(result.data.timestamp),
        importKw: result.data.importKw,
        exportKw: result.data.exportKw,
        solarKw: result.data.solarKw,
        batterySoc: result.data.batterySoc,
        homeDemandKw: result.data.homeDemandKw,
      }
    });
    return NextResponse.json(reading, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
