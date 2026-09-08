"use client";

import { useState, useTransition } from "react";
import { SettingsFormData, updateSettingsAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function SettingsForm({ initialData }: { initialData: SettingsFormData }) {
  const [formData, setFormData] = useState<SettingsFormData>(initialData);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSelectChange = (value: string | null) => {
    if (!value) return;
    setFormData(prev => ({ ...prev, optimizationMode: value as "economic" | "balanced" | "comfort" | "green" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, message: '' });

    startTransition(async () => {
      const result = await updateSettingsAction(formData);
      if (result.success) {
        setStatus({ type: 'success', message: 'Settings saved successfully.' });
      } else {
        setStatus({ 
          type: 'error', 
          message: result.message || 'Validation failed. Check your inputs.' 
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Household Configuration</CardTitle>
          <CardDescription>
            Manage your smart home preferences and constraints. Changes here affect the optimization engine.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status.type === 'success' && (
            <Alert className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}
          {status.type === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Household Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="powerLimitKw">Grid Power Limit (kW)</Label>
              <Input
                id="powerLimitKw"
                name="powerLimitKw"
                type="number"
                step="0.1"
                min="1"
                max="100"
                value={formData.powerLimitKw}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">Maximum power draw from the grid before appliances are curtailed.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batteryReserve">Battery Reserve (%)</Label>
              <Input
                id="batteryReserve"
                name="batteryReserve"
                type="number"
                step="1"
                min="0"
                max="100"
                value={formData.batteryReserve}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">Minimum SOC maintained for emergency/backup.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="optimizationMode">Optimization Mode</Label>
              <Select value={formData.optimizationMode} onValueChange={handleSelectChange}>
                <SelectTrigger id="optimizationMode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economic">Economic (Lowest Cost)</SelectItem>
                  <SelectItem value="balanced">Balanced (Cost & Comfort)</SelectItem>
                  <SelectItem value="comfort">Comfort (Ignore Cost)</SelectItem>
                  <SelectItem value="green">Green (Max Solar/Battery)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Governs how the smart scheduler plans appliance operations.</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
