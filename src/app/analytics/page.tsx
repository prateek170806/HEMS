import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BarChart3, TrendingDown, Clock, Zap } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Research & Analytics</h2>
          <p className="text-muted-foreground">
            Compare baseline usage against HEMS optimized schedules.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <TrendingDown className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14.3%</div>
            <p className="text-xs text-muted-foreground mt-1">₹690 saved this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Peak Reduction</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">21.2%</div>
            <p className="text-xs text-muted-foreground mt-1">4.1 kW vs 5.2 kW baseline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Solar Utilization</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82%</div>
            <p className="text-xs text-muted-foreground mt-1">Self-consumption rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Optimization Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45ms</div>
            <p className="text-xs text-muted-foreground mt-1">Avg solver runtime</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Baseline vs HEMS Comparison</CardTitle>
          <CardDescription>Evaluation of different scheduling algorithms across metrics.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3">Metric</th>
                  <th className="px-4 py-3">User-Driven (Baseline)</th>
                  <th className="px-4 py-3">Rule-Based</th>
                  <th className="px-4 py-3">HEMS Optimization</th>
                  <th className="px-4 py-3">Improvement</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-3 font-medium">Total Cost (₹)</td>
                  <td className="px-4 py-3">142.60</td>
                  <td className="px-4 py-3">128.40</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">118.40</td>
                  <td className="px-4 py-3 text-emerald-600">17.0%</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-medium">Peak Demand (kW)</td>
                  <td className="px-4 py-3">5.2</td>
                  <td className="px-4 py-3">4.8</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">4.1</td>
                  <td className="px-4 py-3 text-emerald-600">21.2%</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-medium">Comfort Violations</td>
                  <td className="px-4 py-3">0</td>
                  <td className="px-4 py-3">2</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">0</td>
                  <td className="px-4 py-3 text-muted-foreground">-</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Tasks Completed</td>
                  <td className="px-4 py-3">8/8</td>
                  <td className="px-4 py-3">8/8</td>
                  <td className="px-4 py-3 font-bold">8/8</td>
                  <td className="px-4 py-3 text-muted-foreground">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
