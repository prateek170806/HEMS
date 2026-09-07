"use client";

import { Button } from "@/components/ui/button";
import { Zap, Loader2 } from "lucide-react";
import { overrideScheduleAction } from "@/app/actions";
import { useTransition, useState } from "react";

export function EVOverrideButton({ applianceId }: { applianceId: string }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleForceCharge = () => {
    setStatus("idle");
    startTransition(async () => {
      try {
        await overrideScheduleAction(applianceId);
        setStatus("success");
      } catch {
        setStatus("error");
      }
    });
  };

  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={handleForceCharge} disabled={isPending}>
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Zap className="mr-2 h-4 w-4" />
        )}
        {isPending ? "Starting charge..." : "Force Charge Now"}
      </Button>
      {status === "success" && (
        <p className="text-xs text-center text-emerald-600 font-medium">✓ EV charge override saved — refresh to see updated status</p>
      )}
      {status === "error" && (
        <p className="text-xs text-center text-destructive">✗ Failed to override. Please try again.</p>
      )}
    </div>
  );
}
