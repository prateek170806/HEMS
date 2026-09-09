import { getCurrentHousehold } from "@/lib/server/auth";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

// Maximum allowed historical query window: 90 days.
// Rationale: WattWise simulation runs in real-time ticks (~3s interval).
// Even at fast-forward speeds, 90 days of history is more than sufficient
// for analytics use, while preventing runaway full-table scans on Neon.
const MAX_RANGE_DAYS = 90;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');

    // Default: last 24 hours
    const defaultFrom = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const defaultTo = new Date();

    const from = fromStr ? new Date(fromStr) : defaultFrom;
    const to = toStr ? new Date(toStr) : defaultTo;

    // Reject invalid date strings
    if (isNaN(from.getTime())) {
      return NextResponse.json({ error: 'Invalid \'from\' date' }, { status: 400 });
    }
    if (isNaN(to.getTime())) {
      return NextResponse.json({ error: 'Invalid \'to\' date' }, { status: 400 });
    }

    // Reject reversed ranges
    if (from > to) {
      return NextResponse.json({ error: '\'from\' must be before \'to\'' }, { status: 400 });
    }

    // Enforce maximum range
    const rangeDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    if (rangeDays > MAX_RANGE_DAYS) {
      return NextResponse.json(
        { error: `Date range cannot exceed ${MAX_RANGE_DAYS} days` },
        { status: 400 }
      );
    }

    const household = await getCurrentHousehold();
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
