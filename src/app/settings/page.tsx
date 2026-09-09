import { getCurrentHousehold } from "@/lib/server/auth";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const household = await getCurrentHousehold();
  
  if (!household) {
    return <div>No household configured.</div>;
  }

  const initialData = {
    name: household.name,
    powerLimitKw: household.powerLimitKw,
    batteryReserve: household.batteryReserve,
    optimizationMode: household.optimizationMode as "economic" | "balanced" | "comfort" | "green",
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Configure your home energy parameters and optimization preferences.</p>
      </div>

      <SettingsForm initialData={initialData} />
    </div>
  );
}
