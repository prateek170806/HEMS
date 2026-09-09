import { auth } from "../../../auth";
import prisma from "../prisma";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
  });
}

export async function getCurrentHousehold() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.household.findFirst({
    where: { userId: session.user.id },
  });
}
