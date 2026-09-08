import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

export async function GET() {
  try {
    const household = await prisma.household.findFirst();
    if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 });

    const latestReading = await prisma.meterReading.findFirst({
      where: { householdId: household.id },
      orderBy: { timestamp: 'desc' }
    });
    
    if (!latestReading) return NextResponse.json({ error: 'No readings found' }, { status: 404 });
    return NextResponse.json(latestReading);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
