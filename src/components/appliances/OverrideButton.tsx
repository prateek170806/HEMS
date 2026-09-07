"use client";

import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { overrideScheduleAction } from "@/app/actions";
import { useTransition } from "react";

export function OverrideButton({ applianceId }: { applianceId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleOverride = () => {
    startTransition(async () => {
      try {
        await overrideScheduleAction(applianceId);
      } catch (e) {
        console.error("Failed to override schedule", e);
      }
    });
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex-1" 
      onClick={handleOverride}
      disabled={isPending}
    >
      <Play className="mr-2 h-4 w-4" /> 
      {isPending ? "Running..." : "Run Now"}
    </Button>
  );
}
