"use client";

import { Button } from "@/components/ui/button";
import { runOptimizationAction } from "@/app/actions";
import { useState } from "react";
import { Play } from "lucide-react";

export function DemoButton() {
  const [loading, setLoading] = useState(false);

  const handleDemo = async () => {
    setLoading(true);
    try {
      await runOptimizationAction();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleDemo} 
      disabled={loading}
      className="bg-indigo-600 hover:bg-indigo-700 text-white"
    >
      <Play className="mr-2 h-4 w-4" />
      {loading ? "Running Simulation..." : "Run Demo Scenario"}
    </Button>
  );
}
