import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getCurrentHousehold } from '@/lib/server/auth';

export async function GET() {
  try {
    const household = await getCurrentHousehold();
    if (!household) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tariffs = await prisma.tariff.findMany({
      where: { householdId: household.id },
      include: { periods: { orderBy: { startTime: 'asc' } } }
    });
    return NextResponse.json(tariffs);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
