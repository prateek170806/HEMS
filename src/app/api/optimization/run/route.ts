import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { executeOptimizationRun } from '@/lib/optimization/execute';

export async function POST(req: Request) {
  try {
    const result = await executeOptimizationRun();
    
    return NextResponse.json({ 
      success: true, 
      runId: result.run.id,
      schedules: result.schedules 
    }, { status: 201 });
  } catch (error) {
    console.error("Optimization failed:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
