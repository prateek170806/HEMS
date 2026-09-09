import { getCurrentHousehold } from "@/lib/server/auth";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { z } from "zod";

const controlSchema = z.object({
  action: z.enum(["LIVE", "PAUSE", "SPEED"]),
  speed: z.number().optional()
});

export async function POST(req: Request) {
  try {
    const household = await getCurrentHousehold();
    if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 });

    const body = await req.json();
    const parsed = controlSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { action, speed } = parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updateData: any = {};
    
    // We update simulationLastTick to now so that when we resume, we don't jump time based on paused duration
    if (action === "LIVE") {
      updateData = { simulationStatus: "LIVE", simulationLastTick: new Date() };
    } else if (action === "PAUSE") {
      updateData = { simulationStatus: "PAUSED", simulationLastTick: new Date() };
    } else if (action === "SPEED" && speed !== undefined) {
      updateData = { simulationSpeed: speed, simulationLastTick: new Date() };
    }

    await prisma.household.update({
      where: { id: household.id },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Simulation control error:", e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
