import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getCurrentHousehold } from '@/lib/server/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Specifically handle the manual override
    if (body.action === 'override') {
      const household = await getCurrentHousehold();
      if (!household) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const scheduleToOverride = await prisma.schedule.findFirst({
        where: { id, householdId: household.id },
        include: { appliance: true }
      });

      if (!scheduleToOverride) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });

      const now = new Date();
      const runtimeHours = scheduleToOverride.appliance?.minRuntime ?? 1;
      const endTime = new Date(now.getTime() + runtimeHours * 3600 * 1000);

      const updated = await prisma.schedule.update({
        where: { id },
        data: {
          status: 'overridden',
          startTime: now,
          endTime: endTime,
          reason: 'Manual user override: Forced immediate execution.'
        }
      });
      return NextResponse.json(updated);
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
