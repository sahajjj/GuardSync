import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminPhone = '7048948509'; // Replace with your actual phone number
  
  const admin = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {},
    create: {
      name: 'Super Admin',
      phone: adminPhone,
      role: 'ADMIN',
    },
  });

  console.log('✅ Initial Admin Created:', admin);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
