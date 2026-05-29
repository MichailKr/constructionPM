import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma.js';

async function main() {
  const email = 'worker@constructionpm.dev';
  const plainPassword = '123';

  // Хешируем пароль
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Обновляем пользователя
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });

  console.log(`✅ Пароль для ${email} обновлен!`);
  console.log(`Хеш: ${hashedPassword}`);

  await prisma.$disconnect();
}

main().catch(console.error);