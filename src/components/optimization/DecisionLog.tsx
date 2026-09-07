"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

export interface DecisionLogProps {
  logs: {
    scheduleId: string;
    applianceName: string;
    baselineTime: string;
    optimizedTime: Date;
    baselineCost: number;
    optimizedCost: number;
    reason: string;
    isOverridden: boolean;
  }[];
}

export function DecisionLog({ logs }: DecisionLogProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Decision Log</CardTitle>
          <CardDescription>Why appliances were scheduled</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No active schedules to display. Run the optimizer.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Decision Log</CardTitle>
        <CardDescription>Explainable AI scheduling reasoning</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log) => {
            const costDiff = log.baselineCost - log.optimizedCost;
            const saved = costDiff > 0.01;
            const sameTime = format(log.optimizedTime, "HH:mm") === log.baselineTime;

            return (
              <div key={log.scheduleId} className="border rounded-lg p-4 space-y-4 bg-card">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {log.isOverridden ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                    <span className="font-semibold">{log.applianceName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant={log.isOverridden ? "destructive" : (saved ? "default" : "secondary")}>
                      {log.isOverridden ? "Manual Override" : (saved ? `Saved ₹${costDiff.toFixed(2)}` : "Baseline Kept")}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between text-sm bg-muted/30 p-3 rounded-md">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-1">Preferred Time</p>
                      <p className="font-mono font-medium">{log.baselineTime}</p>
                      <p className="text-xs text-muted-foreground mt-1">₹{log.baselineCost.toFixed(2)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-4" />
                    <div className="text-center">
                      <p className="text-muted-foreground mb-1">Scheduled Time</p>
                      <p className="font-mono font-medium">{format(log.optimizedTime, "HH:mm")}</p>
                      <p className="text-xs text-muted-foreground mt-1">₹{log.optimizedCost.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="bg-primary/5 p-3 rounded-md border border-primary/10">
                    <p className="text-sm font-medium mb-1">Reasoning:</p>
                    <p className="text-sm text-muted-foreground">{log.reason}</p>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>Constraints Satisfied: {log.isOverridden ? "No (Overridden)" : "Yes"}</span>
                    <span>{sameTime && !log.isOverridden ? "No shifting required" : ""}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
