import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { z } from 'zod';

export async function GET() {
  try {
    const household = await prisma.household.findFirst();
    if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 });

    const schedules = await prisma.schedule.findMany({
      where: { householdId: household.id },
      include: { appliance: true }
    });
    return NextResponse.json(schedules);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
