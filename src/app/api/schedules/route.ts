import { getCurrentHousehold } from "@/lib/server/auth";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

export async function GET() {
  try {
    const household = await getCurrentHousehold();
    if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 });

    const schedules = await prisma.schedule.findMany({
      where: { householdId: household.id },
      include: { appliance: true }
    });
    return NextResponse.json(schedules);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
