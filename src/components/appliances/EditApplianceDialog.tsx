"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings2 } from "lucide-react";

type Appliance = {
  id: string;
  name: string;
  category: string;
  ratedPower: number;
  flexibility: string;
  minRuntime: number;
  maxRuntime: number;
  earliestStart: string | null;
  latestFinish: string | null;
  priority: string;
  automationEnabled: boolean;
};

export function EditApplianceDialog({ appliance }: { appliance: Appliance }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: appliance.name,
    ratedPower: appliance.ratedPower,
    flexibility: appliance.flexibility,
    minRuntime: appliance.minRuntime,
    maxRuntime: appliance.maxRuntime,
    earliestStart: appliance.earliestStart || "00:00",
    latestFinish: appliance.latestFinish || "23:59",
    priority: appliance.priority,
    automationEnabled: appliance.automationEnabled,
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setFormData({
        name: appliance.name,
        ratedPower: appliance.ratedPower,
        flexibility: appliance.flexibility,
        minRuntime: appliance.minRuntime,
        maxRuntime: appliance.maxRuntime,
        earliestStart: appliance.earliestStart || "00:00",
        latestFinish: appliance.latestFinish || "23:59",
        priority: appliance.priority,
        automationEnabled: appliance.automationEnabled,
      });
      setError(null);
    }
    setOpen(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/appliances/${appliance.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          ratedPower: Number(formData.ratedPower),
          minRuntime: Number(formData.minRuntime),
          maxRuntime: Number(formData.maxRuntime),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update appliance");
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
      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenChange(true)}>
        <Settings2 className="mr-2 h-4 w-4" /> Edit
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Appliance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && <div className="text-sm text-destructive">{error}</div>}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="col-span-3" required />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="power" className="text-right">Power (kW)</Label>
            <Input id="power" type="number" step="0.1" value={formData.ratedPower} onChange={(e) => setFormData({ ...formData, ratedPower: Number(e.target.value) })} className="col-span-3" required />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="flexibility" className="text-right">Flexibility</Label>
            <div className="col-span-3">
              <Select value={formData.flexibility} onValueChange={(val) => setFormData({ ...formData, flexibility: val || "non_flexible" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select flexibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="non_flexible">Non-Flexible</SelectItem>
                  <SelectItem value="shiftable">Shiftable</SelectItem>
                  <SelectItem value="interruptible">Interruptible</SelectItem>
                  <SelectItem value="thermostatic">Thermostatic</SelectItem>
                  <SelectItem value="storage">Storage</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="text-right">Priority</Label>
            <div className="col-span-3">
              <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val || "medium" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="minRuntime" className="text-right">Min Run (h)</Label>
            <Input id="minRuntime" type="number" step="0.5" value={formData.minRuntime} onChange={(e) => setFormData({ ...formData, minRuntime: Number(e.target.value) })} className="col-span-3" required />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="maxRuntime" className="text-right">Max Run (h)</Label>
            <Input id="maxRuntime" type="number" step="0.5" value={formData.maxRuntime} onChange={(e) => setFormData({ ...formData, maxRuntime: Number(e.target.value) })} className="col-span-3" required />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="earliestStart" className="text-right">Start Time</Label>
            <Input id="earliestStart" type="time" value={formData.earliestStart} onChange={(e) => setFormData({ ...formData, earliestStart: e.target.value })} className="col-span-3" required />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="latestFinish" className="text-right">End Time</Label>
            <Input id="latestFinish" type="time" value={formData.latestFinish} onChange={(e) => setFormData({ ...formData, latestFinish: e.target.value })} className="col-span-3" required />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="automationEnabled" className="text-right">Automation</Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Switch id="automationEnabled" checked={formData.automationEnabled} onCheckedChange={(checked) => setFormData({ ...formData, automationEnabled: checked })} />
              <Label htmlFor="automationEnabled">{formData.automationEnabled ? 'Enabled' : 'Disabled'}</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
