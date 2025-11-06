import { PrismaClient, Role, ContractType, LeaveType } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const MANAGER_COUNT = 5;
const EMPLOYEE_COUNT = 45;
const DEFAULT_PASSWORD = 'password123';

async function main() {
  console.log('Seeding database...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, salt);

  console.log('Cleaning existing data...');
  // Delete in reverse order of dependency
  await prisma.leave.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leavePolicy.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const departments = ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance'];
  const managers: { id: number; department: string }[] = [];

  // --- 1. Create Managers ---
  console.log(`Creating ${MANAGER_COUNT} managers...`);
  for (let i = 0; i < MANAGER_COUNT; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({
      firstName,
      lastName,
      provider: 'manager.local',
    });
    const department = departments[i % departments.length];

    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        role: Role.MANAGER,
        isActive: true,
        isEmailVerified: true,
        profile: {
          create: {
            fullName: `${firstName} ${lastName}`,
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
    if (user.profile && user.profile.department) {
      managers.push({ id: user.profile.id, department: user.profile.department });
    }
  }

  // --- 2. Create Employees ---
  console.log(`Creating ${EMPLOYEE_COUNT} employees...`);
  for (let i = 0; i < EMPLOYEE_COUNT; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const randomManager = faker.helpers.arrayElement(managers);
    const contractType =
      i % 10 === 0
        ? ContractType.INTERN
        : faker.helpers.arrayElement([
            ContractType.FULL_TIME,
            ContractType.PART_TIME,
          ]);

    await prisma.user.create({
      data: {
        email: faker.internet.email({
          firstName,
          lastName,
          provider: 'employee.local',
        }),
        password: passwordHash,
        role: Role.EMPLOYEE,
        isActive: true,
        isEmailVerified: true,
        profile: {
          create: {
            fullName: `${firstName} ${lastName}`,
            department: randomManager.department,
            position: faker.person.jobTitle(),
            contractType,
            hireDate: faker.date.past({ years: 3 }),
            site: faker.helpers.arrayElement(['New York', 'London', 'Remote']),
            managerId: randomManager.id,
          },
        },
      },
    });
  }

  // --- 3. [NEW] Create Leave Policies ---
  console.log('Creating leave policies (the "Rule Book")...');

  // Policy 1: Standard Vacation for Full-Time
  await prisma.leavePolicy.create({
    data: {
      name: 'Standard Vacation (Full-Time)',
      leaveType: LeaveType.VACATION,
      daysAllocated: 20,
      contractType: ContractType.FULL_TIME, // Only for full-time
    },
  });

  // Policy 2: Standard Vacation for Part-Time
  await prisma.leavePolicy.create({
    data: {
      name: 'Standard Vacation (Part-Time)',
      leaveType: LeaveType.VACATION,
      daysAllocated: 10,
      contractType: ContractType.PART_TIME, // Only for part-time
    },
  });

  // Policy 3: Standard Sick Days (for everyone)
  await prisma.leavePolicy.create({
    data: {
      name: 'Standard Sick Days',
      leaveType: LeaveType.SICK,
      daysAllocated: 10,
      // All other fields are null, so this applies to EVERYONE
    },
  });
  
  // Policy 4: Interns (no vacation)
  // We prove this by *not* creating a policy for Intern + Vacation.
  // The JIT logic will correctly fail for them.

  // --- 4. [NEW] Create one PENDING leave to test approvals ---
  console.log('Creating one PENDING leave request for testing...');

  const employeeToTest = await prisma.profile.findFirst({
    where: { contractType: ContractType.FULL_TIME },
  });

  if (employeeToTest) {
    await prisma.leave.create({
      data: {
        profileId: employeeToTest.id,
        managerId: employeeToTest.managerId,
        type: LeaveType.VACATION,
        status: 'PENDING',
        startDate: new Date('2025-12-20'),
        endDate: new Date('2025-12-22'),
        daysRequested: 3,
        reason: 'Holiday vacation',
      },
    });
    console.log(`Created PENDING leave request for profile ID ${employeeToTest.id}`);
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