import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/server/db';
import { updateApplianceSchema } from '@/lib/validations/appliance';
import { getCurrentHousehold } from '@/lib/server/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const household = await getCurrentHousehold();
    if (!household) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const appliance = await prisma.appliance.findFirst({
      where: { id, householdId: household.id }
    });
    if (!appliance) return NextResponse.json({ error: 'Appliance not found' }, { status: 404 });
    return NextResponse.json(appliance);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = updateApplianceSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid input', issues: result.error.issues }, { status: 400 });
    const household = await getCurrentHousehold();
    if (!household) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.appliance.findFirst({ where: { id, householdId: household.id } });
    if (!existing) return NextResponse.json({ error: 'Appliance not found' }, { status: 404 });

    const appliance = await prisma.appliance.update({
      where: { id },
      data: result.data
    });
    
    revalidatePath("/appliances");
    
    return NextResponse.json(appliance);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const household = await getCurrentHousehold();
    if (!household) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.appliance.findFirst({ where: { id, householdId: household.id } });
    if (!existing) return NextResponse.json({ error: 'Appliance not found' }, { status: 404 });

    await prisma.appliance.delete({
      where: { id }
    });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
