const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting SIH Demo User migration...');

  // Check if demo user already exists
  let demoUser = await prisma.user.findUnique({
    where: { email: 'demo@wattwise.local' }
  });

  if (!demoUser) {
    const passwordHash = await bcrypt.hash('demo123', 10);
    demoUser = await prisma.user.create({
      data: {
        customerId: 'WW-DEMO-001',
        name: 'SIH Demo Admin',
        email: 'demo@wattwise.local',
        passwordHash,
        avatarInitials: 'SD',
      }
    });
    console.log('Created Demo User:', demoUser.id);
  } else {
    console.log('Demo User already exists:', demoUser.id);
  }

  // Find all households that don't have a userId and assign them to Demo User
  const result = await prisma.household.updateMany({
    where: { userId: null },
    data: { userId: demoUser.id }
  });

  console.log(`Migrated ${result.count} existing households to the Demo User.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
