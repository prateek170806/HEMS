"use client";

import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { runOptimizationAction } from "@/app/actions";

export function RunOptimizationButton() {
  const [isPending, startTransition] = useTransition();

  const handleRun = () => {
    startTransition(async () => {
      try {
        const result = await runOptimizationAction();
        // In a real app, use a toast notification here
        console.log(`Optimization succeeded for ${result.count} appliances`);
      } catch (error) {
        console.error("Optimization failed:", error);
      }
    });
  };

  return (
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
  );
}
