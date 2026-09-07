"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2 } from "lucide-react";

type TariffPeriod = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  pricePerKwh: number;
  type: string;
};

type Tariff = {
  id: string;
  name: string;
  periods: TariffPeriod[];
};

export function EditTariffDialog({ tariff }: { tariff: Tariff }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tariffName, setTariffName] = useState(tariff.name);
  const [periods, setPeriods] = useState<TariffPeriod[]>(tariff.periods.map(p => ({ ...p })));

  const updatePeriod = (index: number, field: keyof TariffPeriod, value: string | number) => {
    setPeriods(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tariffs/${tariff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tariffName,
          periods: periods.map(p => ({
            id: p.id,
            name: p.name,
            startTime: p.startTime,
            endTime: p.endTime,
            pricePerKwh: Number(p.pricePerKwh),
            type: p.type,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update tariff");
      }

      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Edit2 className="mr-2 h-4 w-4" /> Edit Tariff
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tariff</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {error && <div className="text-sm text-destructive">{error}</div>}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tariff-name" className="text-right">Tariff Name</Label>
              <Input
                id="tariff-name"
                value={tariffName}
                onChange={(e) => setTariffName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-4">Time-of-Use Periods</h4>
              <div className="space-y-4">
                {periods.map((period, idx) => (
                  <div key={period.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">{period.startTime} – {period.endTime}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Period Name</Label>
                        <Input
                          value={period.name}
                          onChange={(e) => updatePeriod(idx, 'name', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Price (₹/kWh)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={period.pricePerKwh}
                          onChange={(e) => updatePeriod(idx, 'pricePerKwh', Number(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Start Time</Label>
                        <Input
                          type="time"
                          value={period.startTime}
                          onChange={(e) => updatePeriod(idx, 'startTime', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End Time</Label>
                        <Input
                          type="time"
                          value={period.endTime}
                          onChange={(e) => updatePeriod(idx, 'endTime', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select value={period.type} onValueChange={(val) => updatePeriod(idx, 'type', val || 'normal')}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="peak">Peak</SelectItem>
                            <SelectItem value="off_peak">Off-Peak</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="solar">Solar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Tariff"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
