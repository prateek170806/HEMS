import { getCurrentHousehold } from "@/lib/server/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { TrendingDown, PiggyBank, Calendar, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SavingsCenterPage() {
  const household = await getCurrentHousehold();
  if (!household) return <div>No household configured.</div>;

  const runs = await prisma.optimizationRun.findMany({
    where: { householdId: household.id, status: "success" },
    orderBy: { createdAt: 'desc' }
  });

  // Helper: get YYYY-MM-DD in the household's local timezone
  const tz = household.timezone || 'Asia/Kolkata';
  const toLocalDateStr = (date: Date): string => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  };
  const toLocalMonthStr = (date: Date): string => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit' }).format(date).substring(0, 7);
  };

  // Deduplicate: only take the most recent run for each calendar day (household-local timezone)
  const dailyRuns = new Map();
  runs.forEach(run => {
    const day = toLocalDateStr(run.createdAt);
    if (!dailyRuns.has(day)) {
      dailyRuns.set(day, run);
    }
  });

  // Calculate metrics
  const uniqueRuns = Array.from(dailyRuns.values());
  const now = new Date();
  
  let totalSavings = 0;
  let totalBaseline = 0;
  
  let todaySavings = 0;
  let todayBaseline = 0;
  
  let monthSavings = 0;
  let monthBaseline = 0;

  const todayStr = toLocalDateStr(now);
  const thisMonthStr = toLocalMonthStr(now);

  uniqueRuns.forEach(run => {
    const runDateStr = toLocalDateStr(run.createdAt);
    const isToday = runDateStr === todayStr;
    const isThisMonth = runDateStr.substring(0, 7) === thisMonthStr;
    
    const savings = run.savings || 0;
    const baseline = run.baselineCost || 0;

    totalSavings += savings;
    totalBaseline += baseline;
    
    if (isThisMonth) {
      monthSavings += savings;
      monthBaseline += baseline;
    }
    
    if (isToday) {
      todaySavings += savings;
      todayBaseline += baseline;
    }
  });

  const totalSavingsPct = totalBaseline > 0 ? (totalSavings / totalBaseline) * 100 : 0;
  const monthSavingsPct = monthBaseline > 0 ? (monthSavings / monthBaseline) * 100 : 0;
  const todaySavingsPct = todayBaseline > 0 ? (todaySavings / todayBaseline) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Savings Center</h2>
        <p className="text-muted-foreground">Track your estimated optimization savings over time.</p>
      </div>

      {uniqueRuns.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No successful optimization runs recorded yet. Run the optimizer to start tracking savings.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center text-emerald-800 dark:text-emerald-400">
                <TrendingDown className="h-4 w-4 mr-2" />
                Today&apos;s Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">₹{todaySavings.toFixed(2)}</div>
              <p className="text-xs font-medium mt-1 text-emerald-600 dark:text-emerald-500">
                {todaySavingsPct > 0 ? `${todaySavingsPct.toFixed(1)}% reduction vs unmanaged` : 'No savings yet today'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-primary" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">₹{monthSavings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {monthSavingsPct > 0 ? `${monthSavingsPct.toFixed(1)}% overall reduction` : 'No savings this month'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <PiggyBank className="h-4 w-4 mr-2 text-blue-500" />
                Lifetime Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">₹{totalSavings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalSavingsPct > 0 ? `${totalSavingsPct.toFixed(1)}% cumulative reduction` : 'No savings recorded'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {uniqueRuns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="h-5 w-5 mr-2 text-primary" />
              Daily Breakdown
            </CardTitle>
            <CardDescription>
              A log of your daily estimated optimization savings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Baseline Cost</th>
                    <th className="px-4 py-3 text-right">Optimized Cost</th>
                    <th className="px-4 py-3 text-right">Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueRuns.slice(0, 30).map(run => {
                    const dateStr = run.createdAt.toISOString().split('T')[0];
                    const baseline = run.baselineCost || 0;
                    const opt = run.projectedCost || 0;
                    const savings = run.savings || 0;
                    const isZero = savings === 0;

                    return (
                      <tr key={run.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{dateStr}</td>
                        <td className="px-4 py-3 font-mono text-right text-muted-foreground">₹{baseline.toFixed(2)}</td>
                        <td className="px-4 py-3 font-mono text-right">₹{opt.toFixed(2)}</td>
                        <td className={`px-4 py-3 font-mono font-bold text-right ${isZero ? 'text-muted-foreground' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {isZero ? '-' : `₹${savings.toFixed(2)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {uniqueRuns.length > 30 && (
                <div className="text-center py-3 text-xs text-muted-foreground border-t">
                  Showing last 30 days.
                </div>
              )}
            </div>
            
            <div className="mt-6 p-4 bg-muted/40 rounded-lg text-xs text-muted-foreground space-y-2">
              <p><strong>Note on methodology:</strong> Savings shown represent estimated optimization impact, calculated as the difference between unmanaged rule-based scheduling and WattWise dynamic optimization.</p>
              <p>Because multiple optimization runs can occur in a single day, this table calculates savings using only the final successful optimization run of each calendar day to prevent double-counting.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
