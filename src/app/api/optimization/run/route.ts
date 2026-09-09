import { NextResponse } from 'next/server';

import { executeOptimizationRun } from '@/lib/optimization/execute';
import { getCurrentHousehold } from '@/lib/server/auth';

export async function POST() {
  // Defense-in-depth: explicit route-level auth check.
  // The optimization engine also checks internally, but we fail-fast here
  // to avoid entering the transaction/computation layer for unauthenticated requests.
  const household = await getCurrentHousehold();
  if (!household) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
