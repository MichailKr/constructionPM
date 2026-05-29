import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createFirstAdmin() {
  const email = 'admin@test.com';
  const password = 'Admin12345';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Admin created:', {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  await prisma.$disconnect();
}

createFirstAdmin().catch(console.error);