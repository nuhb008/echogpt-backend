import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await prisma.role.upsert({
    where: {
      name: 'USER',
    },
    update: {},
    create: {
      name: 'USER',
    },
  });

  const adminRole = await prisma.role.upsert({
    where: {
      name: 'ADMIN',
    },
    update: {},
    create: {
      name: 'ADMIN',
    },
  });

  console.log('Roles seeded');

  await prisma.subscriptionPlan.upsert({
    where: {
      name: 'FREE',
    },
    update: {},
    create: {
      name: 'FREE',
      monthlyLimit: 100,
      price: 0,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: {
      name: 'PREMIUM',
    },
    update: {},
    create: {
      name: 'PREMIUM',
      monthlyLimit: 5000,
      price: 9.99,
    },
  });

  console.log('Subscription plans seeded');

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@echogpt.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';

  await prisma.user.upsert({
    where: {
      email: adminEmail,
    },
    update: {},
    create: {
      name: 'Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      roleId: adminRole.id,
    },
  });

  console.log(`Admin user seeded (${adminEmail})`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });