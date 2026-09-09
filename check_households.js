const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const householdsWithNullUser = await prisma.household.count({ where: { userId: null } });
  const usersWithMultipleHouseholds = await prisma.user.findMany({ include: { households: true } });
  const duplicates = usersWithMultipleHouseholds.filter(u => u.households.length > 1);
  console.log('Households with null userId:', householdsWithNullUser);
  console.log('Users with multiple households:', duplicates.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
