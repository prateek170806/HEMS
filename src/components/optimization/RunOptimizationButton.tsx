"use client";

import { Button } from "@/components/ui/button";
import { Play, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useTransition, useState } from "react";
import { runOptimizationAction } from "@/app/actions";

export function RunOptimizationButton() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const handleRun = () => {
    setStatus("idle");
    setMessage("");
    startTransition(async () => {
      try {
        const result = await runOptimizationAction();
        setStatus("success");
        setMessage(`Optimization complete — ${result.count} appliance${result.count !== 1 ? 's' : ''} scheduled.`);
      } catch (err: unknown) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Optimization failed. Check database connection.");
      }
    });
  };

  return (
    <div className="space-y-3">
      <Button
        className="w-full mt-4"
        onClick={handleRun}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Play className="w-4 h-4 mr-2" />
        )}
        {isPending ? "Optimizing..." : "Run Optimization"}
      </Button>

      {status === "success" && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-3">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {message}
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md p-3">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          {message}
        </div>
      )}
    </div>
  );
}
