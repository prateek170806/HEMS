import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { applianceSchema } from '@/lib/validations/appliance';

export async function GET() {
  try {
    const household = await prisma.household.findFirst();
    if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 });

    const appliances = await prisma.appliance.findMany({
      where: { householdId: household.id }
    });
    return NextResponse.json(appliances);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const household = await prisma.household.findFirst();
    if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 });

    const body = await req.json();
    const result = applianceSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid input', issues: result.error.issues }, { status: 400 });

    const appliance = await prisma.appliance.create({
      data: {
        ...result.data,
        householdId: household.id
      }
    });
    return NextResponse.json(appliance, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
