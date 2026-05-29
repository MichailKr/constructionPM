import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma.js';

async function main() {
  const email = 'worker2@test.com';  // 🔹 Новый email
  const password = '123';
  const name = 'Петров Пётр Иванович';  // 🔹 Новое имя

  // Хешируем пароль
  const hashedPassword = await bcrypt.hash(password, 10);

  // Проверяем, есть ли уже такой пользователь
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    // Обновляем пароль и роль
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        role: 'EMPLOYEE'
      }
    });
    console.log(`✅ Пароль обновлён для ${email}`);
  } else {
    // Создаём нового пользователя
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'EMPLOYEE'
      }
    });

    // 🔹 Создаём запись сотрудника БЕЗ бригады (teamId: null)
    await prisma.employee.create({
      data: {
        userId: user.id,
        tabNumber: '002',
        department: 'Отдел монолитных работ',
        position: 'Арматурщик',
        status: 'ACTIVE',
        hireDate: new Date(),
        teamId: null  // 🔹 НЕ в бригаде (свободен для назначения)
      }
    });

    console.log(`✅ Тестовый работник создан!`);
  }

  console.log(`\n📧 Email: ${email}`);
  console.log(`🔑 Пароль: ${password}`);
  console.log(`👤 Имя: ${name}`);
  console.log(`💼 Должность: Арматурщик`);
  console.log(`🏢 Отдел: Отдел монолитных работ`);
  console.log(`\n📝 Работник НЕ назначен в бригаду — можно добавить через интерфейс!`);

  await prisma.$disconnect();
}

main().catch(console.error);