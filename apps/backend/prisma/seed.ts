/**
 * Seed script for ConstructionPM
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.taskStatusLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.taskEquipment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.team.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.workType.deleteMany();
  await prisma.constructionSite.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@constructionpm.dev',
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@constructionpm.dev',
      name: 'Project Manager',
      role: 'MANAGER',
      isActive: true,
    },
  });

  const foreman1 = await prisma.user.create({
    data: {
      email: 'foreman1@constructionpm.dev',
      name: 'Ivan Petrov',
      role: 'FOREMAN',
      isActive: true,
    },
  });

  const foreman2 = await prisma.user.create({
    data: {
      email: 'foreman2@constructionpm.dev',
      name: 'Maria Sidorova',
      role: 'FOREMAN',
      isActive: true,
    },
  });

  const worker = await prisma.user.create({
    data: {
      email: 'worker@constructionpm.dev',
      name: 'Alexei Volkov',
      role: 'EMPLOYEE',
      isActive: true,
    },
  });

  // Create Project
  const project = await prisma.project.create({
    data: {
      name: 'Жилой комплекс "Северный"',
      description: 'Многоэтажное строительство, 3 корпуса',
      status: 'ACTIVE',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2025-12-31T00:00:00Z'),
      budget: 5000000000n,
      priority: 'HIGH',
      manager: { connect: { id: manager.id } },
    },
  });

  // Create Construction Sites
  const site1 = await prisma.constructionSite.create({
    data: {
      name: 'Корпус А',
      address: 'ул. Строителей, 15',
      city: 'Москва',
      region: 'Московская область',
      postalCode: '123456',
      coordinates: { lat: 55.7558, lng: 37.6173 },
      status: 'ACTIVE',
      startDate: new Date('2024-02-01T00:00:00Z'),
      project: { connect: { id: project.id } },
    },
  });

  const site2 = await prisma.constructionSite.create({
    data: {
      name: 'Корпус Б',
      address: 'ул. Строителей, 17',
      city: 'Москва',
      region: 'Московская область',
      status: 'PLANNING',
      project: { connect: { id: project.id } },
    },
  });

  // Create Work Types
  const workConcrete = await prisma.workType.create({
    data: {
      name: 'Бетонные работы',
      code: 'CONC-001',
      unit: 'm3',
      defaultRate: 2500.00,
      category: 'CONSTRUCTION',
    },
  });

  const workElectrical = await prisma.workType.create({
    data: {
      name: 'Электромонтажные работы',
      code: 'ELEC-001',
      unit: 'hours',
      defaultRate: 800.00,
      category: 'ELECTRICAL',
    },
  });

  const workFinishing = await prisma.workType.create({
    data: {
      name: 'Отделочные работы',
      code: 'FIN-001',
      unit: 'm2',
      defaultRate: 1200.00,
      category: 'FINISHING',
    },
  });

  // Create Teams
  const teamConcrete = await prisma.team.create({
    data: {
      name: 'Бригада бетонщиков',
      description: 'Специализация: монолитное строительство',
      leader: { connect: { id: foreman1.id } },
      project: { connect: { id: project.id } },
    },
  });

  const teamFinishing = await prisma.team.create({
    data: {
      name: 'Бригада отделочников',
      description: 'Специализация: внутренние работы',
      leader: { connect: { id: foreman2.id } },
      project: { connect: { id: project.id } },
    },
  });

  // Create Employees
  await prisma.employee.create({
    data: {
      tabNumber: 'EMP-001',
      position: 'Бригадир',
      department: 'Строительный отдел',
      hireDate: new Date('2023-01-15T00:00:00Z'),
      status: 'ACTIVE',
      hourlyRate: 1500.00,
      skills: ['concrete', 'formwork', 'team_lead'],
      certifications: ['safety_level_3'],
      user: { connect: { id: foreman1.id } },
      team: { connect: { id: teamConcrete.id } },
    },
  });

  await prisma.employee.create({
    data: {
      tabNumber: 'EMP-002',
      position: 'Бетонщик 5 разряда',
      department: 'Строительный отдел',
      hireDate: new Date('2023-03-01T00:00:00Z'),
      status: 'ACTIVE',
      hourlyRate: 900.00,
      skills: ['concrete', 'vibration'],
      user: { connect: { id: worker.id } },
      team: { connect: { id: teamConcrete.id } },
    },
  });

  await prisma.employee.createMany({
    data: [
      {
        tabNumber: 'EMP-003',
        position: 'Бригадир',
        department: 'Отделочный отдел',
        hireDate: new Date('2023-02-10T00:00:00Z'),
        status: 'ACTIVE',
        hourlyRate: 1400.00,
        skills: ['plastering', 'painting', 'team_lead'],
        certifications: ['safety_level_2'],
        userId: foreman2.id,
        teamId: teamFinishing.id,
      },
      {
        tabNumber: 'EMP-004',
        position: 'Штукатур',
        department: 'Отделочный отдел',
        hireDate: new Date('2023-06-01T00:00:00Z'),
        status: 'ON_VACATION',
        hourlyRate: 750.00,
        skills: ['plastering', 'sanding'],
        userId: (await prisma.user.create({
          data: { email: 'shtukatur@dev.local', name: 'Dmitry Ivanov', role: 'EMPLOYEE' },
        })).id,
        teamId: teamFinishing.id,
      },
      {
        tabNumber: 'EMP-005',
        position: 'Электромонтажник',
        department: 'Инженерный отдел',
        hireDate: new Date('2023-04-15T00:00:00Z'),
        status: 'ACTIVE',
        hourlyRate: 1100.00,
        skills: ['wiring', 'panels', 'testing'],
        certifications: ['electrical_safety_level_4'],
        userId: (await prisma.user.create({
          data: { email: 'electrician@dev.local', name: 'Sergey Kozlov', role: 'EMPLOYEE' },
        })).id,
      },
    ],
  });

  // Create Sample Tasks
  await prisma.task.create({
    data: {
      title: 'Заливка фундамента Корпус А',
      description: 'Монолитная плита, толщина 400мм',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      progress: 65,
      startDate: new Date('2024-03-01T00:00:00Z'),
      dueDate: new Date('2024-03-15T00:00:00Z'),
      estimatedHours: 240,
      project: { connect: { id: project.id } },
      constructionSite: { connect: { id: site1.id } },
      workType: { connect: { id: workConcrete.id } },
      team: { connect: { id: teamConcrete.id } },
      locationZone: 'Фундамент',
    },
  });

  await prisma.task.create({
    data: {
      title: 'Монтаж электропроводки 1 этаж',
      status: 'PLANNED',
      priority: 'HIGH',
      dueDate: new Date('2024-04-01T00:00:00Z'),
      estimatedHours: 80,
      project: { connect: { id: project.id } },
      constructionSite: { connect: { id: site1.id } },
      workType: { connect: { id: workElectrical.id } },
    },
  });

  await prisma.task.create({
    data: {
      title: 'Штукатурка стен 2 этаж',
      status: 'ON_HOLD',
      priority: 'MEDIUM',
      project: { connect: { id: project.id } },
      constructionSite: { connect: { id: site1.id } },
      workType: { connect: { id: workFinishing.id } },
      team: { connect: { id: teamFinishing.id } },
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log(`📊 Created: 1 project, 2 sites, 3 work types, 2 teams, 5 employees, 3 tasks`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });