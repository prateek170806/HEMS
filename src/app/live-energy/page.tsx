import { getCurrentHousehold } from "@/lib/server/auth";
import { LiveEnergyClient } from "./LiveEnergyClient";

export default async function LiveEnergyPage() {
  const household = await getCurrentHousehold();
  if (!household) return <div>No household configured.</div>;
  
  return (
    <LiveEnergyClient 
      initialLimit={household.powerLimitKw} 
      baseLoad={household.baseLoad} 
    />
  );
}
