import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { updateApplianceSchema } from '@/lib/validations/appliance';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const appliance = await prisma.appliance.findUnique({
      where: { id }
    });
    if (!appliance) return NextResponse.json({ error: 'Appliance not found' }, { status: 404 });
    return NextResponse.json(appliance);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = updateApplianceSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid input', issues: result.error.issues }, { status: 400 });

    const appliance = await prisma.appliance.update({
      where: { id },
      data: result.data
    });
    return NextResponse.json(appliance);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.appliance.delete({
      where: { id }
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
