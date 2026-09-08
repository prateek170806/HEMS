import { prisma } from "@/lib/server/db";
import SimulationClient from "./components/SimulationClient";

export default async function SimulationPage() {
  const household = await prisma.household.findFirst();
  if (!household) {
    return <div>No household found.</div>;
  }

  return (
    <SimulationClient
      initialSolarIrradiance={household.solarIrradiance}
      initialBaseLoad={household.baseLoad}
      initialForecastError={household.forecastError}
      initialSmartMeterOffline={household.smartMeterOffline}
      initialEvDisconnected={household.evDisconnected}
      initialInverterFault={household.inverterFault}
    />
  );
}
