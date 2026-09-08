import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');

    const from = fromStr ? new Date(fromStr) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const to = toStr ? new Date(toStr) : new Date();

    const household = await prisma.household.findFirst();
    if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 });

    const readings = await prisma.meterReading.findMany({
      where: {
        householdId: household.id,
        timestamp: {
          gte: from,
          lte: to
        }
      },
      orderBy: { timestamp: 'asc' }
    });
    
    return NextResponse.json(readings);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
