"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";

export function AddApplianceDialog({ householdId }: { householdId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "other",
    ratedPower: 1.0,
    flexibility: "shiftable",
    minRuntime: 1,
    maxRuntime: 2,
    earliestStart: "06:00",
    latestFinish: "22:00",
    priority: "medium",
    automationEnabled: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/appliances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          householdId,
          ratedPower: Number(formData.ratedPower),
          minRuntime: Number(formData.minRuntime),
          maxRuntime: Number(formData.maxRuntime),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create appliance");
      }

      setOpen(false);
      setFormData({
        name: "", category: "other", ratedPower: 1.0, flexibility: "shiftable",
        minRuntime: 1, maxRuntime: 2, earliestStart: "06:00", latestFinish: "22:00",
        priority: "medium", automationEnabled: true,
      });
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
        <Plus className="mr-2 h-4 w-4" /> Add Appliance
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add New Appliance</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {error && <div className="text-sm text-destructive">{error}</div>}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-name" className="text-right">Name</Label>
              <Input id="add-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="col-span-3" required placeholder="e.g. Dishwasher" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-category" className="text-right">Category</Label>
              <div className="col-span-3">
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val || "other" })}>
                  <SelectTrigger id="add-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="washing_machine">Washing Machine</SelectItem>
                    <SelectItem value="dishwasher">Dishwasher</SelectItem>
                    <SelectItem value="water_heater">Water Heater</SelectItem>
                    <SelectItem value="ev">EV Charger</SelectItem>
                    <SelectItem value="air_conditioner">Air Conditioner</SelectItem>
                    <SelectItem value="refrigerator">Refrigerator</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-power" className="text-right">Power (kW)</Label>
              <Input id="add-power" type="number" step="0.1" min="0.1" value={formData.ratedPower} onChange={(e) => setFormData({ ...formData, ratedPower: Number(e.target.value) })} className="col-span-3" required />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-flexibility" className="text-right">Flexibility</Label>
              <div className="col-span-3">
                <Select value={formData.flexibility} onValueChange={(val) => setFormData({ ...formData, flexibility: val || "shiftable" })}>
                  <SelectTrigger id="add-flexibility"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non_flexible">Non-Flexible</SelectItem>
                    <SelectItem value="shiftable">Shiftable</SelectItem>
                    <SelectItem value="interruptible">Interruptible</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-priority" className="text-right">Priority</Label>
              <div className="col-span-3">
                <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val || "medium" })}>
                  <SelectTrigger id="add-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-min" className="text-right">Min Run (h)</Label>
              <Input id="add-min" type="number" step="0.5" min="0.5" value={formData.minRuntime} onChange={(e) => setFormData({ ...formData, minRuntime: Number(e.target.value) })} className="col-span-3" required />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-max" className="text-right">Max Run (h)</Label>
              <Input id="add-max" type="number" step="0.5" min="0.5" value={formData.maxRuntime} onChange={(e) => setFormData({ ...formData, maxRuntime: Number(e.target.value) })} className="col-span-3" required />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-start" className="text-right">Start Time</Label>
              <Input id="add-start" type="time" value={formData.earliestStart} onChange={(e) => setFormData({ ...formData, earliestStart: e.target.value })} className="col-span-3" required />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-end" className="text-right">End Time</Label>
              <Input id="add-end" type="time" value={formData.latestFinish} onChange={(e) => setFormData({ ...formData, latestFinish: e.target.value })} className="col-span-3" required />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-automation" className="text-right">Automation</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch id="add-automation" checked={formData.automationEnabled} onCheckedChange={(checked) => setFormData({ ...formData, automationEnabled: checked })} />
                <Label htmlFor="add-automation">{formData.automationEnabled ? "Enabled" : "Disabled"}</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? "Creating..." : "Create Appliance"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
