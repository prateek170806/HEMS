import { auth } from "../../../auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-foreground sm:truncate sm:text-3xl sm:tracking-tight">
            WattWise Profile
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your WattWise account identity.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
        <div className="px-4 sm:px-0">
          <h2 className="text-base font-semibold leading-7 text-foreground">Personal Information</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Your name will be visible on your dashboard and notifications.
          </p>
        </div>

        <div className="bg-card shadow-sm ring-1 ring-border sm:rounded-xl md:col-span-2">
          <ProfileForm user={user} />
        </div>
      </div>
    </div>
  );
}
