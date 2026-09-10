import { getCurrentUser, getCurrentHousehold } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";
import { Home, Zap, Globe, Activity, ShieldCheck } from "lucide-react";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const household = await getCurrentHousehold();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          User Account & Profile
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Manage your personal account details and review your associated Home Energy Management System (HEMS) household scope.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Context & Household Information */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl p-6 border shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-primary font-semibold text-base">
              <ShieldCheck className="h-5 w-5" />
              <span>Multi-Tenant Security</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your profile identity is securely authenticated and bound to your personal customer account. All energy simulation data, tariffs, and appliance schedules are isolated to your household.
            </p>
          </div>

          <div className="bg-card rounded-xl p-6 border shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Household Information
            </h3>
            {household ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Home className="h-4 w-4 text-primary" /> Name:
                  </span>
                  <span className="font-medium text-foreground">{household.name}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" /> Power Limit:
                  </span>
                  <span className="font-medium text-foreground">{household.powerLimitKw} kW</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" /> Timezone:
                  </span>
                  <span className="font-medium text-foreground">{household.timezone}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-500" /> HEMS Status:
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {household.simulationStatus || "LIVE"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No household currently assigned.</p>
            )}
          </div>
        </div>

        {/* Right Column: User Profile Form */}
        <div className="lg:col-span-2 bg-card rounded-xl border shadow-sm">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">User Information</h2>
            <p className="text-xs text-muted-foreground">
              Update your account display name. Your customer ID and registered email are fixed.
            </p>
          </div>
          <ProfileForm user={user} />
        </div>
      </div>
    </div>
  );
}
