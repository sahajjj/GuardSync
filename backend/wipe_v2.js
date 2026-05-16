const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Wipe ---');
  try {
    const tables = [
      'visitorLog', 'attendance', 'report', 'deployment', 'complaint', 'site', 'notification', 'user'
    ];
    
    for (const table of tables) {
      console.log(`Clearing ${table}...`);
      await prisma[table].deleteMany();
    }
    
    console.log('✅ DATABASE WIPED CLEAN');
  } catch (e) {
    console.error('❌ FAILED TO WIPE:', e.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
