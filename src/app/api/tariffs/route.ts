import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

export async function GET() {
  try {
    const tariffs = await prisma.tariff.findMany({
      include: { periods: { orderBy: { startTime: 'asc' } } }
    });
    return NextResponse.json(tariffs);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
