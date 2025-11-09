import {
  PrismaClient,
  Role,
  ContractType,
  LeaveType,
  ShiftChangeStatus,
  LeaveStatus,
  Prisma,
} from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const MANAGER_COUNT = 5;
const EMPLOYEE_COUNT = 45;
const DEFAULT_PASSWORD = 'password123';

/**
 * Helper to convert HH:MM string to a Date object (for Prisma Time type)
 * We use UTC to ensure the time is stored purely, without timezone offsets.
 */
function convertToTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0); // Use UTC
  return date;
}

async function main() {
  console.log('Seeding database...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, salt);

  // --- 1. CLEANUP (Reverse order of dependency) ---
  console.log('Cleaning existing data...');
  await prisma.notification.deleteMany();
  await prisma.shiftChangeRequest.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.workScheduleTemplate.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leavePolicy.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // --- 2. CREATE USERS & PROFILES ---
  const departments = ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance'];
  const managers: { id: number; department: string; userId: number }[] = [];
  const employees: { id: number; department: string; userId: number; managerId: number }[] = [];

  console.log(`Creating ${MANAGER_COUNT} managers...`);
  for (let i = 0; i < MANAGER_COUNT; i++) {
    const department = departments[i % departments.length];
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email({
          firstName: 'Manager',
          lastName: `${i}`,
          provider: 'test.local',
        }),
        password: passwordHash,
        role: Role.MANAGER,
        isActive: true,
        isEmailVerified: true,
        profile: {
          create: {
            fullName: faker.person.fullName({
              firstName: 'Manager',
              lastName: `${i}`,
            }),
            department,
            position: 'Manager',
            contractType: ContractType.FULL_TIME,
            hireDate: faker.date.past({ years: 5 }),
            site: 'New York',
          },
        },
      },
      include: { profile: true },
    });
    if (user.profile) {
      managers.push({
        id: user.profile.id,
        department: user.profile.department!,
        userId: user.id,
      });
    }
  }

  console.log(`Creating ${EMPLOYEE_COUNT} employees...`);
  for (let i = 0; i < EMPLOYEE_COUNT; i++) {
    const randomManager = faker.helpers.arrayElement(managers);
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email({
          firstName: 'Employee',
          lastName: `${i}`,
          provider: 'test.local',
        }),
        password: passwordHash,
        role: Role.EMPLOYEE,
        isActive: true,
        isEmailVerified: true,
        profile: {
          create: {
            fullName: faker.person.fullName({
              firstName: 'Employee',
              lastName: `${i}`,
            }),
            department: randomManager.department,
            position: faker.person.jobTitle(),
            contractType: faker.helpers.arrayElement([
              ContractType.FULL_TIME,
              ContractType.PART_TIME,
            ]),
            hireDate: faker.date.past({ years: 3 }),
            site: faker.helpers.arrayElement(['New York', 'London', 'Remote']),
            managerId: randomManager.id,
          },
        },
      },
      include: { profile: true },
    });
    if (user.profile) {
      employees.push({
        id: user.profile.id,
        department: user.profile.department!,
        userId: user.id,
        managerId: user.profile.managerId!,
      });
    }
  }

  // --- 3. CREATE LEAVE POLICIES ---
  console.log('Creating leave policies...');
  await prisma.leavePolicy.createMany({
    data: [
      {
        name: 'Standard Vacation (Full-Time)',
        leaveType: LeaveType.VACATION,
        daysAllocated: 20,
        contractType: ContractType.FULL_TIME,
      },
      {
        name: 'Standard Vacation (Part-Time)',
        leaveType: LeaveType.VACATION,
        daysAllocated: 10,
        contractType: ContractType.PART_TIME,
      },
      {
        name: 'Standard Sick Days (All)',
        leaveType: LeaveType.SICK,
        daysAllocated: 10,
      },
    ],
  });

  // --- 4. [NEW] CREATE SCHEDULE TEMPLATES ---
  console.log('Creating schedule templates...');
  const template1 = await prisma.workScheduleTemplate.create({
    data: {
      name: 'Standard Day (9-5)',
      isRotation: false,
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
      department: 'Engineering',
    },
  });
  const template2 = await prisma.workScheduleTemplate.create({
    data: {
      name: 'Morning Shift (7-3)',
      isRotation: false,
      defaultStartTime: '07:00',
      defaultEndTime: '15:00',
      department: 'Sales',
    },
  });

  // --- 5. [NEW] CREATE SHIFTS ---
  console.log('Creating shifts for the next 5 days...');
  const today = new Date();
  const shiftsToCreate: Prisma.ShiftCreateManyInput[] = [];
  const firstTenEmployees = employees.slice(0, 10);

  for (const emp of firstTenEmployees) {
    for (let i = 0; i < 5; i++) {
      const shiftDate = new Date(today);
      shiftDate.setDate(today.getDate() + i);
      
      const template = emp.department === 'Engineering' ? template1 : template2;

      shiftsToCreate.push({
        profileId: emp.id,
        date: shiftDate,
        startTime: convertToTime(template.defaultStartTime!),
        endTime: convertToTime(template.defaultEndTime!),
        templateId: template.id,
      });
    }
  }
  await prisma.shift.createMany({ data: shiftsToCreate });

  // --- 6. [NEW] CREATE PENDING REQUESTS (for testing) ---
  console.log('Creating pending requests for testing...');

  // Create a pending Leave Request
  const employeeForLeave = employees[0];
  await prisma.leave.create({
    data: {
      profileId: employeeForLeave.id,
      managerId: employeeForLeave.managerId,
      type: LeaveType.VACATION,
      status: LeaveStatus.PENDING,
      startDate: new Date('2025-12-20'),
      endDate: new Date('2025-12-22'),
      daysRequested: 3,
      reason: 'Holiday vacation',
    },
  });

  // Create a pending Shift Change Request
  const firstShift = await prisma.shift.findFirst();
  if (firstShift) {
    await prisma.shiftChangeRequest.create({
      data: {
        shiftId: firstShift.id,
        requesterId: firstShift.profileId,
        status: ShiftChangeStatus.PENDING,
        reason: 'Doctor appointment',
        newStartTime: convertToTime('11:00'), // Requesting to start at 11:00
      },
    });
  }

  console.log('---');
  console.log('Database seeding complete.');
  console.log(`Password for all users: "${DEFAULT_PASSWORD}"`);
  console.log('---');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });