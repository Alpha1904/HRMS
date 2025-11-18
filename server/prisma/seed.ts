import {
  PrismaClient,
  Role,
  ContractType,
  LeaveType,
  ShiftChangeStatus,
  LeaveStatus,
  GoalStatus,
  EvalPeriod,
  Prisma,
} from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const MANAGER_COUNT = 4;
const EMPLOYEE_COUNT = 45;
const DEFAULT_PASSWORD = 'password123';

/**
 * Helper to convert HH:MM string to a Date object (for Prisma Time type).
 * We use UTC to ensure the time is stored purely, without timezone offsets.
 */
function convertToTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
}

async function main() {
  console.log('Seeding database...');
  const salt = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // --- 1. CLEANUP (Reverse order of dependency) ---
  console.log('Cleaning existing data...');
  await prisma.reply.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.forum.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.shiftChangeRequest.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.workScheduleTemplate.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leavePolicy.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // --- 2. CREATE CORE USERS ---
  console.log('Creating core users (HR Admin, Managers, Employees)...');

  // A. Create HR Admin User (for Announcements, top-level management)
  const hrUser = await prisma.user.create({
    data: {
      email: `hr_admin@test.local`,
      password: salt,
      tenantId: faker.string.uuid(),
      role: Role.HR_ADMIN,
      isActive: true,
      isEmailVerified: true,
      profile: {
        create: {
          fullName: 'HR Administrator',
          avatarUrl: faker.image.avatar(),
          phone: faker.phone.number(),
          department: 'HR',
          position: 'HR Director',
          contractType: ContractType.FULL_TIME,
          hireDate: faker.date.past({ years: 10 }).toISOString().split('T')[0],
          site: 'New York',
        },
      },
    },
    include: { profile: true },
  });

  if (!hrUser.profile) {
    throw new Error('HR Admin profile could not be created.');
  }
  const hrAdminProfileId = hrUser.profile.id;

  // B. Create Managers
  const managers: { id: number; department: string; userId: number }[] = [];
  const departments = ['Engineering', 'HR', 'Sales', 'Marketing'];
  for (let i = 0; i < MANAGER_COUNT; i++) {
    const department = departments[i % departments.length];
    const user = await prisma.user.create({
      data: {
        email: `manager${i}@test.local`,
        password: salt,
        tenantId: faker.string.uuid(),
        role: Role.MANAGER,
        isActive: true,
        isEmailVerified: true,
        profile: {
          create: {
            fullName: faker.person.fullName(),
            avatarUrl: faker.image.avatar(),
            phone: faker.phone.number(),
            department,
            position: 'Manager',
            contractType: ContractType.FULL_TIME,
            hireDate: faker.date.past({ years: 5 }).toISOString().split('T')[0],
            site: faker.helpers.arrayElement(['New York', 'London', 'Remote']),
            managerId: hrAdminProfileId,
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

  // C. Create Employees
  const employees: {
    id: number;
    department: string;
    site: string;
    userId: number;
    managerId: number;
  }[] = [];
  const testManager = managers[0]; // Manager 0 will be our specific test manager

  for (let i = 0; i < EMPLOYEE_COUNT; i++) {
    // Ensure employee 9 is our specific test case
    const isTestEmployee = i === 9;
    const randomManager = isTestEmployee
      ? testManager
      : faker.helpers.arrayElement(managers);
    const employeeSite = isTestEmployee
      ? 'New York'
      : faker.helpers.arrayElement(['London', 'Remote', 'Paris']);

    const user = await prisma.user.create({
      data: {
        email: `employee${i}@test.local`,
        password: salt,
        tenantId: faker.string.uuid(),
        role: Role.EMPLOYEE,
        isActive: true,
        isEmailVerified: true,
        profile: {
          create: {
            fullName: faker.person.fullName(),
            avatarUrl: faker.image.avatar(),
            phone: faker.phone.number(),
            department: randomManager.department,
            position: faker.person.jobTitle(),
            contractType: faker.helpers.arrayElement([
              ContractType.FULL_TIME,
              ContractType.PART_TIME,
            ]),
            hireDate: faker.date.past({ years: 3 }).toISOString().split('T')[0], // example field for hire date 
            site: employeeSite,
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
        site: user.profile.site!,
        userId: user.id,
        managerId: user.profile.managerId!,
      });
    }
  }

  // --- 3. CREATE SUPPORTING DATA (Policies, Schedules, etc.) ---

  // A. Leave Policies
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
        name: 'Standard Sick Days (All)',
        leaveType: LeaveType.SICK,
        daysAllocated: 10,
      },
    ],
  });

  // B. Forum Structure
  console.log('Creating forum structure...');
  await prisma.forum.createMany({
    data: [
      { name: 'General Discussion', description: 'A place for company-wide chat.' },
      { name: 'Engineering Best Practices', description: 'Sharing technical tips.', department: 'Engineering' },
      { name: 'HR Policies & Q&A', description: 'Official HR communications.' },
    ],
  });

  // --- 4. CREATE TEST-SPECIFIC SCENARIOS ---
  console.log('Creating specific scenarios for testing...');

  // Find the specific users we created for reliable testing
  const testUser = await prisma.user.findUnique({
    where: { email: 'employee9@test.local' },
  });
  const targetEmployee = employees.find(e => e.userId === testUser?.id);

  if (!targetEmployee) {
    throw new Error("Target Employee (employee9@test.local) not found. Check creation loop.");
  }

  // A. Initial Topic/Reply in Forum
  const generalForum = await prisma.forum.findUnique({ where: { name: 'General Discussion' } });
  if (generalForum) {
    const initialTopic = await prisma.topic.create({
      data: {
        forumId: generalForum.id,
        authorId: hrAdminProfileId,
        title: 'Welcome to the New HR Platform!',
        content: 'Please use the forums to ask any non-private questions.',
        isPinned: true,
      },
    });

    await prisma.reply.create({
      data: {
        topicId: initialTopic.id,
        authorId: testManager.id,
        content: "Great resource! I've already posted it to my team channel.",
      },
    });
  }

  // B. Initial Announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Welcome to the New Year!',
        content: 'Happy 2026! A reminder that all goals need to be set by the end of Q1.',
        isGlobal: true,
        postedById: hrAdminProfileId,
      },
      {
        title: 'New York Office Policy Update',
        content: 'Mandatory remote day every Friday starting next week.',
        isGlobal: false,
        targetSites: ['New York'], // This will be visible to targetEmployee
        postedById: hrAdminProfileId,
      },
    ],
  });

  // C. Pending Leave Request for Target Employee
  await prisma.leave.create({
    data: {
      profileId: targetEmployee.id,
      managerId: targetEmployee.managerId,
      type: LeaveType.VACATION,
      status: LeaveStatus.PENDING,
      startDate: new Date('2025-12-20'),
      endDate: new Date('2025-12-22'),
      daysRequested: 3,
      reason: 'Holiday vacation',
    },
  });

  // D. Performance Review Data for Target Employee
  const historicalEvaluation = await prisma.evaluation.create({
    data: {
      profileId: targetEmployee.id,
      evaluatorId: testManager.id,
      period: EvalPeriod.QUARTERLY,
      overallScore: 3.8,
      scores: { communication: 4, technical: 4, leadership: 3 },
      achievements: 'Led successful Q3 initiative.',
      improvements: 'Needs to delegate more.',
      selfEval: false,
    },
  });

  await prisma.goal.create({
    data: {
      profileId: targetEmployee.id,
      title: 'Reduce bug count by 25%',
      description: 'Q3 target for quality improvement.',
      status: GoalStatus.IN_PROGRESS,
      progress: 75,
      targetDate: new Date('2025-10-01'),
      createdInEvaluationId: historicalEvaluation.id,
    },
  });

  

  console.log('---');
  console.log('Database seeding complete.');
  console.log(`HR Admin Profile ID: ${hrAdminProfileId} (Email: ${hrUser.email})`);
  console.log(`Test Manager Profile ID: ${testManager.id} (Email: manager0@test.local)`);
  console.log(`Test Employee Profile ID: ${targetEmployee.id} (Email: employee9@test.local)`);
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