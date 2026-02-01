import {
  PrismaClient,
  Role,
  ContractType,
  LeaveType,
  ShiftChangeStatus,
  LeaveStatus,
  GoalStatus,
  EvalPeriod,
  EvaluationPeriod,
  EvaluationStatus,
  EvaluationType,
  ObjectiveStatus,
  PostingStatus,
  ApplicationStatus,
  Prisma,
  DepartureType,
  DepartureStatus,
  TaskStatus,
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
  await prisma.userMessage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.objectiveProgress.deleteMany();
  await prisma.employeeObjective.deleteMany();
  await prisma.selfEvaluation.deleteMany();
  await prisma.manualEvaluation.deleteMany();
  await prisma.evaluationScore.deleteMany();
  await prisma.performanceEvaluation.deleteMany();
  await prisma.evaluationCycle.deleteMany();
  await prisma.evaluationCriteria.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.shiftChangeRequest.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.workScheduleTemplate.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leavePolicy.deleteMany();
  await prisma.document.deleteMany();
  await prisma.interaction.deleteMany();
  await prisma.application.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.jobPosting.deleteMany();
  // Clean departures tables before profiles
  await prisma.departureHistory.deleteMany();
  await prisma.departureDocument.deleteMany();
  await prisma.departureChecklist.deleteMany();
  await prisma.handoverPlan.deleteMany();
  await prisma.exitSurvey.deleteMany();
  await prisma.exitInterview.deleteMany();
  await prisma.departure.deleteMany();
  // Clean chat and other tables that reference User/Profile
  await prisma.chatMessage.deleteMany();
  await prisma.chatMember.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // --- 2. CREATE CORE USERS ---
  console.log('Creating core users (HR Admin, Managers, Employees)...');

  // A. Create HR Admin User (for Announcements, top-level management)
  const hrUser = await prisma.user.create({
    data: {
      email: `hr_admin@hrms.com`,
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
        email: `manager${i}@hrms.com`,
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
        email: `employee${i}@hrms.com`,
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
    where: { email: 'employee9@hrms.com' },
  });
  const targetEmployee = employees.find(e => e.userId === testUser?.id);

  if (!targetEmployee) {
    throw new Error("Target Employee (employee9@hrms.com) not found. Check creation loop.");
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

  // E. DEPARTURES TEST SCENARIO
  console.log('Creating test departure for employee9@hrms.com...');
  const testDeparture = await prisma.departure.create({
    data: {
      employeeId: targetEmployee.id,
      type: DepartureType.RESIGNATION,
      reason: 'Personal growth opportunity',
      noticeDate: new Date('2026-02-01T00:00:00.000Z'),
      requiredNoticeDays: 30,
      lastWorkDate: new Date('2026-03-02T00:00:00.000Z'),
      status: DepartureStatus.PENDING,
      notes: 'Submitted via employee portal',
      tenantId: faker.string.uuid(),
      createdById: hrUser.id,
    },
  });

  // Create checklist items
  const checklistItem1 = await prisma.departureChecklist.create({
    data: {
      departureId: testDeparture.id,
      taskName: 'Return laptop',
      description: 'Return to IT with accessories',
      assigneeId: testManager.id,
      dueDate: new Date('2026-02-20T00:00:00.000Z'),
      status: TaskStatus.NOT_STARTED,
    },
  });

  const checklistItem2 = await prisma.departureChecklist.create({
    data: {
      departureId: testDeparture.id,
      taskName: 'Handover documentation',
      description: 'Prepare project handover docs',
      assigneeId: targetEmployee.id,
      dueDate: new Date('2026-02-15T00:00:00.000Z'),
      status: TaskStatus.IN_PROGRESS,
    },
  });

  // Schedule exit interview
  const exitInterview = await prisma.exitInterview.create({
    data: {
      departureId: testDeparture.id,
      interviewerId: hrAdminProfileId,
      scheduledDate: new Date('2026-02-15T10:00:00.000Z'),
      notes: 'Scheduled with HR Director',
    },
  });

  // Create exit survey (employee submitted)
  await prisma.exitSurvey.create({
    data: {
      departureId: testDeparture.id,
      responses: {
        q1: 'Great team culture',
        q2: 4,
        q3: 'Better onboarding process needed',
        q4: 'More flexible work hours',
        q5: 5,
      },
    },
  });

  // Create handover plan
  await prisma.handoverPlan.create({
    data: {
      departureId: testDeparture.id,
      assigneeId: testManager.id,
      notes: 'Transfer project A ownership',
      tasks: [
        { task: 'Project A documentation', status: 'completed' },
        { task: 'Client introductions', status: 'in_progress' },
        { task: 'Code walkthrough', status: 'pending' },
      ],
    },
  });

  // Upload departure documents (mock)
  await prisma.departureDocument.createMany({
    data: [
      {
        departureId: testDeparture.id,
        name: 'Resignation Letter',
        type: 'resignation',
        url: '/uploads/mock-resignation.pdf',
        uploadedById: targetEmployee.id,
      },
      {
        departureId: testDeparture.id,
        name: 'Exit Clearance Form',
        type: 'clearance',
        url: '/uploads/mock-clearance.pdf',
        uploadedById: hrUser.id,
      },
    ],
  });

  // Create departure history logs
  await prisma.departureHistory.createMany({
    data: [
      {
        departureId: testDeparture.id,
        eventType: 'CREATED',
        details: { oldStatus: null, newStatus: DepartureStatus.PENDING, notes: 'Employee submitted resignation' },
        timestamp: new Date(),
        performedById: targetEmployee.id,
      },
      {
        departureId: testDeparture.id,
        eventType: 'INTERVIEW_SCHEDULED',
        details: { oldStatus: DepartureStatus.PENDING, newStatus: DepartureStatus.PENDING, notes: 'Exit interview scheduled with HR Director' },
        timestamp: new Date(),
        performedById: hrUser.id,
      },
      {
        departureId: testDeparture.id,
        eventType: 'SURVEY_SUBMITTED',
        details: { oldStatus: DepartureStatus.PENDING, newStatus: DepartureStatus.PENDING, notes: 'Employee completed exit survey' },
        timestamp: new Date(),
        performedById: targetEmployee.id,
      },
    ],
  });

  console.log(`Created test departure (ID: ${testDeparture.id}) for employee9@hrms.com with full workflow data`);

  // --- 4. CREATE HIRING DATA ---
  console.log('Creating hiring data...');

  // Create Recruiter User
  const recruiterUser = await prisma.user.create({
    data: {
      email: 'recruiter@hrms.com',
      password: salt,
      tenantId: faker.string.uuid(),
      role: Role.RECRUITER,
      isActive: true,
      isEmailVerified: true,
      profile: {
        create: {
          fullName: 'John Recruiter',
          avatarUrl: faker.image.avatar(),
          phone: faker.phone.number(),
          department: 'HR',
          position: 'Technical Recruiter',
          contractType: ContractType.FULL_TIME,
          hireDate: faker.date.past({ years: 3 }).toISOString().split('T')[0],
          site: 'New York',
        },
      },
    },
    include: { profile: true },
  });

  if (!recruiterUser.profile) {
    throw new Error('Recruiter profile could not be created.');
  }
  const recruiterProfile = recruiterUser.profile;

  // Get a test employee for internal applications
  const employeeProfile = await prisma.profile.findFirst({
    where: { user: { role: Role.EMPLOYEE } },
    include: { user: true },
  });

  if (!employeeProfile) {
    throw new Error('Employee profile not found for internal applications.');
  }

  // Create Job Postings
  const seniorEngPosting = await prisma.jobPosting.create({
    data: {
      title: 'Senior Software Engineer',
      description: 'We are looking for an experienced software engineer to join our team...',
      department: 'Engineering',
      site: 'New York Office',
      salaryRange: {
        min: 120000,
        max: 180000,
        currency: 'USD',
      },
      requirements: '5+ years of experience in backend development, Node.js, TypeScript, PostgreSQL',
      status: PostingStatus.OPEN,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      recruiterId: recruiterProfile.id,
      createdBy: recruiterUser.id,
    },
  });

  console.log('Created job posting:', seniorEngPosting.title);

  const productManagerPosting = await prisma.jobPosting.create({
    data: {
      title: 'Product Manager',
      description: 'Lead product development and strategy...',
      department: 'Product',
      site: 'San Francisco Office',
      salaryRange: {
        min: 130000,
        max: 200000,
        currency: 'USD',
      },
      requirements: '3+ years of product management experience, technical background preferred',
      status: PostingStatus.OPEN,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      recruiterId: recruiterProfile.id,
      createdBy: recruiterUser.id,
    },
  });

  console.log('Created job posting:', productManagerPosting.title);

  const draftPosting = await prisma.jobPosting.create({
    data: {
      title: 'Data Scientist',
      description: 'Work on machine learning models and data analysis...',
      department: 'Data Science',
      site: 'Remote',
      status: PostingStatus.DRAFT,
      recruiterId: recruiterProfile.id,
      createdBy: recruiterUser.id,
    },
  });

  console.log('Created draft job posting:', draftPosting.title);

  const extraJobPostingPayloads: Prisma.JobPostingUncheckedCreateInput[] = [
    {
      title: 'Frontend Engineer',
      description: 'Build accessible UI components and improve performance.',
      department: 'Engineering',
      site: 'London Office',
      salaryRange: { min: 90000, max: 140000, currency: 'USD' } as Prisma.InputJsonValue,
      requirements: '3+ years React/TypeScript, strong UX fundamentals.',
      status: PostingStatus.OPEN,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
      recruiterId: recruiterProfile.id,
      createdBy: recruiterUser.id,
    },
    {
      title: 'QA Automation Engineer',
      description: 'Own test automation strategy and CI pipelines.',
      department: 'Engineering',
      site: 'Remote',
      salaryRange: { min: 80000, max: 120000, currency: 'USD' } as Prisma.InputJsonValue,
      requirements: 'Playwright/Cypress, API testing, CI/CD experience.',
      status: PostingStatus.OPEN,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
      recruiterId: recruiterProfile.id,
      createdBy: recruiterUser.id,
    },
    {
      title: 'DevOps Engineer',
      description: 'Improve reliability and observability across services.',
      department: 'Platform',
      site: 'New York Office',
      salaryRange: { min: 110000, max: 170000, currency: 'USD' } as Prisma.InputJsonValue,
      requirements: 'Kubernetes, Terraform, AWS, incident response.',
      status: PostingStatus.OPEN,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      recruiterId: recruiterProfile.id,
      createdBy: recruiterUser.id,
    },
    {
      title: 'Data Analyst',
      description: 'Create dashboards and help teams make data-driven decisions.',
      department: 'Data',
      site: 'Paris Office',
      salaryRange: { min: 70000, max: 105000, currency: 'USD' } as Prisma.InputJsonValue,
      requirements: 'SQL, BI tools, basic statistics, stakeholder management.',
      status: PostingStatus.OPEN,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      recruiterId: recruiterProfile.id,
      createdBy: recruiterUser.id,
    },
    {
      title: 'HR Specialist',
      description: 'Support onboarding and employee relations.',
      department: 'HR',
      site: 'New York Office',
      salaryRange: { min: 60000, max: 90000, currency: 'USD' } as Prisma.InputJsonValue,
      requirements: '2+ years HR operations, strong communication.',
      status: PostingStatus.OPEN,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      recruiterId: recruiterProfile.id,
      createdBy: recruiterUser.id,
    },
    {
      title: 'Sales Executive',
      description: 'Drive new business and manage enterprise accounts.',
      department: 'Sales',
      site: 'San Francisco Office',
      salaryRange: { min: 80000, max: 150000, currency: 'USD' } as Prisma.InputJsonValue,
      requirements: 'B2B SaaS sales, pipeline management, negotiation.',
      status: PostingStatus.OPEN,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      recruiterId: recruiterProfile.id,
      createdBy: recruiterUser.id,
    },
    {
      title: 'Marketing Manager',
      description: 'Own campaigns and positioning for growth.',
      department: 'Marketing',
      site: 'London Office',
      salaryRange: { min: 90000, max: 140000, currency: 'USD' } as Prisma.InputJsonValue,
      requirements: 'Performance marketing, content strategy, analytics.',
      status: PostingStatus.OPEN,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      recruiterId: recruiterProfile.id,
      createdBy: recruiterUser.id,
    },
    {
      title: 'UX Designer',
      description: 'Design user flows and refine product UX.',
      department: 'Design',
      site: 'Remote',
      salaryRange: { min: 85000, max: 135000, currency: 'USD' } as Prisma.InputJsonValue,
      requirements: 'Figma, prototyping, usability testing.',
      status: PostingStatus.OPEN,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
      recruiterId: recruiterProfile.id,
      createdBy: recruiterUser.id,
    },
    {
      title: 'Backend Engineer (Node.js)',
      description: 'Build APIs and services powering the HRMS platform.',
      department: 'Engineering',
      site: 'New York Office',
      salaryRange: { min: 105000, max: 165000, currency: 'USD' } as Prisma.InputJsonValue,
      requirements: 'Node.js, TypeScript, PostgreSQL, Prisma.',
      status: PostingStatus.OPEN,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      recruiterId: recruiterProfile.id,
      createdBy: recruiterUser.id,
    },
    {
      title: 'Customer Support Specialist',
      description: 'Help customers troubleshoot issues and improve retention.',
      department: 'Support',
      site: 'Remote',
      salaryRange: { min: 45000, max: 70000, currency: 'USD' } as Prisma.InputJsonValue,
      requirements: 'Excellent written communication, empathy, ticketing tools.',
      status: PostingStatus.OPEN,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      recruiterId: recruiterProfile.id,
      createdBy: recruiterUser.id,
    },
  ];

  const extraJobPostings: { id: number; title: string }[] = [];
  for (const payload of extraJobPostingPayloads) {
    const created = await prisma.jobPosting.create({ data: payload });
    extraJobPostings.push({ id: created.id, title: created.title });
  }

  console.log('Created 10 additional job postings');

  const candidate1 = await prisma.candidate.create({
    data: {
      email: 'alice.smith@example.com',
      fullName: 'Alice Smith',
      phone: '+1555000001',
      linkedinUrl: 'https://linkedin.com/in/alicesmith',
      status: 'ACTIVE',
    },
  });

  const candidate2 = await prisma.candidate.create({
    data: {
      email: 'bob.johnson@example.com',
      fullName: 'Bob Johnson',
      phone: '+1555000002',
      linkedinUrl: 'https://linkedin.com/in/bobjohnson',
      status: 'ACTIVE',
    },
  });

  const candidate3 = await prisma.candidate.create({
    data: {
      email: 'carol.williams@example.com',
      fullName: 'Carol Williams',
      phone: '+1555000003',
      status: 'ACTIVE',
    },
  });

  console.log('Created 3 candidates');

  const extraCandidates: { id: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const email = `candidate${i + 1}@example.com`;
    const created = await prisma.candidate.create({
      data: {
        email,
        fullName: faker.person.fullName(),
        phone: faker.phone.number(),
        linkedinUrl: faker.internet.url(),
        status: 'ACTIVE',
      },
    });
    extraCandidates.push({ id: created.id });
  }

  console.log('Created 30 additional candidates');

  const app1 = await prisma.application.create({
    data: {
      candidateId: candidate1.id,
      postingId: seniorEngPosting.id,
      status: ApplicationStatus.SCREENING,
      boardPosition: 1,
      feedback: 'Strong technical background, good communication skills',
      score: 85,
    },
  });

  const app2 = await prisma.application.create({
    data: {
      candidateId: candidate2.id,
      postingId: seniorEngPosting.id,
      status: ApplicationStatus.INTERVIEW,
      boardPosition: 2,
      interviewedAt: new Date(),
      feedback: 'Excellent problem-solving skills',
      score: 90,
    },
  });

  await prisma.application.create({
    data: {
      candidateId: candidate3.id,
      postingId: productManagerPosting.id,
      status: ApplicationStatus.PENDING,
      boardPosition: 1,
    },
  });

  await prisma.application.create({
    data: {
      profileId: employeeProfile.id,
      postingId: productManagerPosting.id,
      status: ApplicationStatus.SCREENING,
      boardPosition: 2,
      feedback: 'Internal candidate, familiar with company processes',
      score: 80,
    },
  });

  console.log('Created 4 applications');

  const postingPool = [
    { id: seniorEngPosting.id },
    { id: productManagerPosting.id },
    { id: draftPosting.id },
    ...extraJobPostings,
  ];

  const positionByPosting = new Map<number, number>();
  const nextPosition = (postingId: number) => {
    const current = positionByPosting.get(postingId) ?? 0;
    const next = current + 1;
    positionByPosting.set(postingId, next);
    return next;
  };

  const applicationStatuses: ApplicationStatus[] = [
    ApplicationStatus.PENDING,
    ApplicationStatus.SCREENING,
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.EXAMINATION,
    ApplicationStatus.REJECTED,
    ApplicationStatus.HIRED,
  ];

  for (let i = 0; i < 15; i++) {
    const posting = faker.helpers.arrayElement(postingPool);
    const candidate = extraCandidates[i % extraCandidates.length];
    const status = faker.helpers.arrayElement(applicationStatuses);
    await prisma.application.create({
      data: {
        candidateId: candidate.id,
        postingId: posting.id,
        status,
        boardPosition: nextPosition(posting.id),
        feedback: i % 3 === 0 ? faker.lorem.sentence() : undefined,
        score: i % 3 === 0 ? faker.number.int({ min: 60, max: 98 }) : undefined,
        interviewedAt: status === ApplicationStatus.INTERVIEW ? new Date() : undefined,
        hiredAt: status === ApplicationStatus.HIRED ? new Date() : undefined,
      },
    });
  }

  console.log('Created 15 additional applications');

  // Create Interactions
  await prisma.interaction.create({
    data: {
      type: 'NOTE',
      content: 'Initial screening completed. Candidate has relevant experience.',
      applicationId: app1.id,
    },
  });

  await prisma.interaction.create({
    data: {
      type: 'EMAIL',
      content: 'Thank you for your application. We will review and get back to you soon.',
      applicationId: app1.id,
    },
  });

  await prisma.interaction.create({
    data: {
      type: 'INTERVIEW_INVITE',
      content: 'Interview scheduled for Tuesday, 2pm EST via Zoom. Meeting link will be sent separately.',
      applicationId: app2.id,
    },
  });

  await prisma.interaction.create({
    data: {
      type: 'NOTE',
      content: 'Candidate performed well in technical interview. Recommend moving to final round.',
      applicationId: app2.id,
    },
  });

  console.log('Created interactions');

  // Create Documents (mock - actual files would be uploaded via API)
  await prisma.document.create({
    data: {
      fileName: 'alice_smith_resume.pdf',
      type: 'RESUME',
      mimeType: 'application/pdf',
      size: 245678,
      uploadUrl: '/uploads/mock-resume-1.pdf',
      applicationId: app1.id,
    },
  });

  await prisma.document.create({
    data: {
      fileName: 'bob_johnson_resume.pdf',
      type: 'RESUME',
      mimeType: 'application/pdf',
      size: 198432,
      uploadUrl: '/uploads/mock-resume-2.pdf',
      applicationId: app2.id,
    },
  });

  await prisma.document.create({
    data: {
      fileName: 'bob_johnson_portfolio.pdf',
      type: 'PORTFOLIO',
      mimeType: 'application/pdf',
      size: 3456789,
      uploadUrl: '/uploads/mock-portfolio.pdf',
      candidateId: candidate2.id,
    },
  });

  console.log('Created documents');

  // --- 5. TECHCORP Q1 2024 QUARTERLY PERFORMANCE REVIEW SCENARIO ---
  console.log('Creating TechCorp Q1 2024 quarterly performance review scenario...');

  // A. Create Q1 2024 Evaluation Cycle
  const q1Cycle = await prisma.evaluationCycle.create({
    data: {
      name: 'TechCorp Q1 2024 Performance Review',
      period: EvaluationPeriod.QUARTERLY,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      isActive: true,
      tenantId: faker.string.uuid(),
    },
  });

  console.log('Created Q1 2024 evaluation cycle:', q1Cycle.name);

  // B. Create Evaluation Criteria for TechCorp
  const evaluationCriteria = await prisma.evaluationCriteria.createMany({
    data: [
      {
        name: 'Technical Excellence',
        description: 'Code quality, technical skills, problem-solving abilities, and innovation',
        weight: 0.25,
        isActive: true,
        tenantId: q1Cycle.tenantId,
      },
      {
        name: 'Productivity & Delivery',
        description: 'Meeting deadlines, output quality, and project completion rates',
        weight: 0.20,
        isActive: true,
        tenantId: q1Cycle.tenantId,
      },
      {
        name: 'Team Collaboration',
        description: 'Communication, teamwork, mentoring, and knowledge sharing',
        weight: 0.15,
        isActive: true,
        tenantId: q1Cycle.tenantId,
      },
      {
        name: 'Customer Impact',
        description: 'Customer satisfaction, user feedback, and business value delivered',
        weight: 0.15,
        isActive: true,
        tenantId: q1Cycle.tenantId,
      },
      {
        name: 'Leadership & Initiative',
        description: 'Taking ownership, driving projects, and showing leadership potential',
        weight: 0.15,
        isActive: true,
        tenantId: q1Cycle.tenantId,
      },
      {
        name: 'Learning & Development',
        description: 'Skill acquisition, adapting to new technologies, and personal growth',
        weight: 0.10,
        isActive: true,
        tenantId: q1Cycle.tenantId,
      },
    ],
  });

  console.log('Created evaluation criteria for TechCorp performance reviews');

  // C. Create Performance Evaluations for all employees
  console.log('Creating performance evaluations for TechCorp employees...');
  
  // Get the evaluation criteria we just created
  const criteria = await prisma.evaluationCriteria.findMany({
    where: { tenantId: q1Cycle.tenantId, isActive: true },
  });

  const performanceEvaluations: any[] = [];
  
  // Create evaluations for all employees (simulating 150 employees at TechCorp)
  for (let i = 0; i < employees.length; i++) {
    const employee = employees[i];
    
    // Generate realistic performance scores based on department and role
    let baseScore = 3.5; // Base score out of 5
    
    // Adjust scores based on department characteristics
    if (employee.department === 'Engineering') {
      baseScore += faker.number.float({ min: -0.5, max: 1.2 }); // Engineering has wider range
    } else if (employee.department === 'Sales') {
      baseScore += faker.number.float({ min: 0, max: 1.0 }); // Sales tends to have higher variance
    } else if (employee.department === 'HR') {
      baseScore += faker.number.float({ min: -0.2, max: 0.8 }); // HR more consistent
    }
    
    // Ensure score is within valid range
    const finalScore = Math.max(2.0, Math.min(5.0, baseScore));
    
    const evaluation = await prisma.performanceEvaluation.create({
      data: {
        employeeId: employee.id,
        cycleId: q1Cycle.id,
        status: EvaluationStatus.IN_PROGRESS,
        finalScore: finalScore,
        tenantId: q1Cycle.tenantId,
      },
    });
    
    performanceEvaluations.push({
      id: evaluation.id,
      employeeId: employee.id,
      score: finalScore,
      department: employee.department,
    });
  }

  console.log(`Created ${performanceEvaluations.length} performance evaluations`);

  // D. Generate Automatic Evaluation Scores
  console.log('Generating automatic evaluation scores...');
  
  for (const evalData of performanceEvaluations) {
    // Generate detailed scores for each criterion
    const breakdown: any = {};
    let weightedTotal = 0;
    
    for (const criterion of criteria) {
      let criterionScore = evalData.score;
      
      // Add some variance to individual criteria scores
      criterionScore += faker.number.float({ min: -0.3, max: 0.3 });
      criterionScore = Math.max(1.0, Math.min(5.0, criterionScore));
      
      breakdown[criterion.name] = {
        score: criterionScore,
        weight: criterion.weight,
        weightedScore: criterionScore * criterion.weight,
      };
      
      weightedTotal += criterionScore * criterion.weight;
    }
    
    // Create the evaluation score record
    await prisma.evaluationScore.create({
      data: {
        evaluationId: evalData.id,
        totalScore: weightedTotal,
        breakdown: breakdown,
        generatedAt: new Date(),
      },
    });
  }

  console.log('Generated automatic evaluation scores for all evaluations');

  // E. Create Manual Evaluations from Managers
  console.log('Creating manual evaluations from managers...');
  
  // Manager feedback templates based on performance level
  const getManagerFeedback = (score: number, department: string) => {
    const isHighPerformer = score >= 4.2;
    const isAveragePerformer = score >= 3.5 && score < 4.2;
    const isLowPerformer = score < 3.5;
    
    let strengths, weaknesses, achievements, recommendations, managerScore;
    
    if (isHighPerformer) {
      strengths = faker.helpers.arrayElement([
        'Exceptional technical skills and problem-solving abilities',
        'Consistently exceeds expectations and delivers high-quality work',
        'Strong leadership qualities and takes initiative on projects',
        'Excellent collaborator and mentor to team members',
      ]);
      achievements = faker.helpers.arrayElement([
        'Led the successful rollout of the new microservices architecture',
        'Reduced system latency by 40% through optimization efforts',
        'Mentored 3 junior developers who are now contributing independently',
        'Delivered critical project 2 weeks ahead of schedule',
      ]);
      weaknesses = faker.helpers.arrayElement([
        'Could benefit from delegating more tasks to team members',
        'Sometimes takes on too much responsibility personally',
        'Should focus more on documenting technical decisions',
      ]);
      recommendations = faker.helpers.arrayElement([
        'Consider taking on a formal leadership role in the next quarter',
        'Explore opportunities to present at tech conferences',
        'Focus on developing strategic planning skills',
      ]);
      managerScore = score + faker.number.float({ min: 0, max: 0.3 });
    } else if (isAveragePerformer) {
      strengths = faker.helpers.arrayElement([
        'Reliable team member who meets deadlines consistently',
        'Good technical skills and willingness to learn',
        'Works well with cross-functional teams',
        'Solid communication skills',
      ]);
      achievements = faker.helpers.arrayElement([
        'Successfully completed all assigned projects this quarter',
        'Contributed to team documentation efforts',
        'Participated actively in code reviews',
        'Helped resolve several production issues',
      ]);
      weaknesses = faker.helpers.arrayElement([
        'Could be more proactive in identifying opportunities',
        'Needs to improve technical depth in certain areas',
        'Should speak up more in team meetings',
        'Time management could be improved on complex tasks',
      ]);
      recommendations = faker.helpers.arrayElement([
        'Focus on developing expertise in one technical area',
        'Take on more challenging assignments',
        'Improve presentation and communication skills',
        'Seek mentorship from senior team members',
      ]);
      managerScore = score + faker.number.float({ min: -0.2, max: 0.2 });
    } else {
      strengths = faker.helpers.arrayElement([
        'Shows up consistently and puts in effort',
        'Has good attitude and willingness to improve',
        'Follows directions well',
        'Works cooperatively with team members',
      ]);
      achievements = faker.helpers.arrayElement([
        'Completed basic training requirements',
        'Fixed several minor bugs',
        'Participated in team meetings',
        'Met minimum performance expectations',
      ]);
      weaknesses = faker.helpers.arrayElement([
        'Technical skills need significant improvement',
        'Struggles with complex problem-solving',
        'Often misses deadlines or needs extensions',
        'Communication skills need development',
        'Lacks initiative and requires close supervision',
      ]);
      recommendations = faker.helpers.arrayElement([
        'Enroll in technical training programs',
        'Work closely with a mentor for skill development',
        'Focus on improving time management',
        'Set weekly learning goals',
        'Consider additional support or coaching',
      ]);
      managerScore = score + faker.number.float({ min: -0.3, max: 0.1 });
    }
    
    return {
      strengths,
      weaknesses,
      achievements,
      recommendations,
      score: Math.max(1.0, Math.min(5.0, managerScore)),
    };
  };
  
  // Create manual evaluations for a subset of employees (to simulate manager workload)
  for (let i = 0; i < Math.min(performanceEvaluations.length, 20); i++) {
    const evalData = performanceEvaluations[i];
    const employee = employees.find(e => e.id === evalData.employeeId);
    
    if (employee && employee.managerId) {
      const feedback = getManagerFeedback(evalData.score, employee.department);
      
      await prisma.manualEvaluation.create({
        data: {
          evaluationId: evalData.id,
          reviewerId: employee.managerId,
          strengths: feedback.strengths,
          weaknesses: feedback.weaknesses,
          achievements: feedback.achievements,
          recommendations: feedback.recommendations,
          score: feedback.score,
        },
      });
    }
  }

  console.log('Created manual evaluations from managers');

  // F. Add Self-Evaluations from Employees
  console.log('Creating self-evaluations from employees...');
  
  // Self-evaluation templates based on performance level
  const getSelfEvaluation = (score: number, department: string) => {
    const isHighPerformer = score >= 4.2;
    const isAveragePerformer = score >= 3.5 && score < 4.2;
    const isLowPerformer = score < 3.5;
    
    let comments, achievements, challenges, selfScore;
    
    if (isHighPerformer) {
      comments = faker.helpers.arrayElement([
        'I feel I\'ve made significant contributions this quarter and exceeded my goals. I\'ve taken on leadership responsibilities and helped mentor team members.',
        'This quarter has been very productive. I successfully led several key initiatives and consistently delivered high-quality work ahead of schedule.',
        'I\'m proud of my performance this quarter. I\'ve grown technically and have been able to contribute meaningfully to our team\'s success.',
      ]);
      achievements = faker.helpers.arrayElement([
        'Successfully architected and implemented the new authentication system that improved security by 60%',
        'Led the migration of our legacy system to microservices, reducing deployment time by 50%',
        'Mentored junior developers and created comprehensive documentation that improved team onboarding',
        'Optimized database queries resulting in 40% performance improvement across the application',
      ]);
      challenges = faker.helpers.arrayElement([
        'Balancing multiple high-priority projects while maintaining quality standards was challenging but rewarding',
        'Learning new technologies quickly to meet project demands required significant extra effort',
        'Coordinating with cross-functional teams across different time zones presented logistical challenges',
      ]);
      selfScore = score + faker.number.float({ min: -0.1, max: 0.2 });
    } else if (isAveragePerformer) {
      comments = faker.helpers.arrayElement([
        'I believe I\'ve met expectations this quarter and made solid contributions to the team. There\'s always room for improvement.',
        'This was a steady quarter where I completed my assigned tasks and learned new skills. I\'m working on being more proactive.',
        'I feel good about my performance but recognize areas where I can grow. I\'ve been focusing on improving my technical depth.',
      ]);
      achievements = faker.helpers.arrayElement([
        'Completed all assigned features for the Q1 product release',
        'Improved my skills in React and TypeScript through online courses',
        'Contributed to team documentation and code review processes',
        'Successfully resolved customer tickets and improved support response time',
      ]);
      challenges = faker.helpers.arrayElement([
        'Keeping up with rapidly changing project requirements was difficult at times',
        'Balancing development work with learning new technologies required careful time management',
        'Some technical challenges required more research and learning than anticipated',
      ]);
      selfScore = score + faker.number.float({ min: -0.2, max: 0.2 });
    } else {
      comments = faker.helpers.arrayElement([
        'I acknowledge that I struggled in some areas this quarter. I\'m committed to improving and have already started taking steps to address my weaknesses.',
        'This quarter was challenging for me, but I\'ve learned important lessons about areas where I need to grow. I\'m seeking additional training.',
        'I didn\'t meet all my goals this quarter, but I\'m working hard to improve my skills and performance. I appreciate the support from my team.',
      ]);
      achievements = faker.helpers.arrayElement([
        'Completed the basic training program and earned my certification',
        'Fixed several bugs in the production system',
        'Improved my communication skills through practice and feedback',
        'Successfully delivered smaller tasks and learned from more experienced team members',
      ]);
      challenges = faker.helpers.arrayElement([
        'The technical complexity of our projects was higher than I was prepared for',
        'Time management and prioritization were significant challenges this quarter',
        'I struggled with some of the new technologies we adopted',
        'Balancing multiple responsibilities while learning was difficult',
      ]);
      selfScore = score + faker.number.float({ min: -0.3, max: 0.1 });
    }
    
    return {
      comments,
      achievements,
      challenges,
      score: Math.max(1.0, Math.min(5.0, selfScore)),
    };
  };
  
  // Create self-evaluations for a subset of employees
  for (let i = 0; i < Math.min(performanceEvaluations.length, 25); i++) {
    const evalData = performanceEvaluations[i];
    const selfEval = getSelfEvaluation(evalData.score, evalData.department);
    
    await prisma.selfEvaluation.create({
      data: {
        evaluationId: evalData.id,
        comments: selfEval.comments,
        achievements: selfEval.achievements,
        challenges: selfEval.challenges,
        selfScore: selfEval.score,
        submittedAt: faker.date.recent({ days: 30 }),
      },
    });
  }

  console.log('Created self-evaluations from employees');

  // G. Create Employee Objectives with Progress Tracking
  console.log('Creating employee objectives for Q1 2024...');
  
  // Objective templates based on department
  const getDepartmentObjectives = (department: string, performanceScore: number) => {
    const objectives: any[] = [];
    
    if (department === 'Engineering') {
      objectives.push(
        {
          title: 'Complete Microservices Migration',
          description: 'Migrate legacy monolith components to microservices architecture',
          targetValue: '3 services migrated',
          weight: 0.3,
          status: performanceScore >= 4.0 ? ObjectiveStatus.COMPLETED : 
                  performanceScore >= 3.5 ? ObjectiveStatus.IN_PROGRESS : 
                  ObjectiveStatus.NOT_STARTED,
        },
        {
          title: 'Improve Code Quality Metrics',
          description: 'Reduce code complexity and improve test coverage to 85%',
          targetValue: '85% test coverage',
          weight: 0.25,
          status: performanceScore >= 3.8 ? ObjectiveStatus.COMPLETED : 
                  performanceScore >= 3.2 ? ObjectiveStatus.IN_PROGRESS : 
                  ObjectiveStatus.NOT_STARTED,
        },
        {
          title: 'Technical Skill Development',
          description: 'Complete advanced TypeScript and cloud architecture certifications',
          targetValue: '2 certifications completed',
          weight: 0.2,
          status: performanceScore >= 4.2 ? ObjectiveStatus.COMPLETED : 
                  performanceScore >= 3.5 ? ObjectiveStatus.IN_PROGRESS : 
                  ObjectiveStatus.NOT_STARTED,
        },
        {
          title: 'Mentor Junior Developers',
          description: 'Provide guidance and code reviews for 2 junior team members',
          targetValue: '2 developers mentored',
          weight: 0.15,
          status: performanceScore >= 3.8 ? ObjectiveStatus.COMPLETED : 
                  performanceScore >= 3.0 ? ObjectiveStatus.IN_PROGRESS : 
                  ObjectiveStatus.NOT_STARTED,
        },
        {
          title: 'Documentation Improvement',
          description: 'Create comprehensive API documentation for team services',
          targetValue: '100% API documentation',
          weight: 0.1,
          status: performanceScore >= 3.5 ? ObjectiveStatus.COMPLETED : 
                  performanceScore >= 2.8 ? ObjectiveStatus.IN_PROGRESS : 
                  ObjectiveStatus.NOT_STARTED,
        }
      );
    } else if (department === 'Sales') {
      objectives.push(
        {
          title: 'Achieve Quarterly Sales Target',
          description: 'Meet or exceed the Q1 sales revenue target of $500K',
          targetValue: '$500K revenue',
          weight: 0.4,
          status: performanceScore >= 4.0 ? ObjectiveStatus.COMPLETED : 
                  performanceScore >= 3.5 ? ObjectiveStatus.IN_PROGRESS : 
                  ObjectiveStatus.NOT_STARTED,
        },
        {
          title: 'New Client Acquisition',
          description: 'Acquire 15 new enterprise clients in Q1',
          targetValue: '15 new clients',
          weight: 0.25,
          status: performanceScore >= 4.2 ? ObjectiveStatus.COMPLETED : 
                  performanceScore >= 3.3 ? ObjectiveStatus.IN_PROGRESS : 
                  ObjectiveStatus.NOT_STARTED,
        },
        {
          title: 'Customer Relationship Management',
          description: 'Maintain 95% customer satisfaction score',
          targetValue: '95% satisfaction',
          weight: 0.2,
          status: performanceScore >= 3.8 ? ObjectiveStatus.COMPLETED : 
                  performanceScore >= 3.0 ? ObjectiveStatus.IN_PROGRESS : 
                  ObjectiveStatus.NOT_STARTED,
        },
        {
          title: 'Sales Process Optimization',
          description: 'Implement new CRM workflow and reduce sales cycle by 20%',
          targetValue: '20% cycle reduction',
          weight: 0.15,
          status: performanceScore >= 3.5 ? ObjectiveStatus.COMPLETED : 
                  performanceScore >= 2.8 ? ObjectiveStatus.IN_PROGRESS : 
                  ObjectiveStatus.NOT_STARTED,
        }
      );
    } else if (department === 'HR') {
      objectives.push(
        {
          title: 'Employee Engagement Program',
          description: 'Launch and manage Q1 employee engagement initiatives',
          targetValue: '80% participation rate',
          weight: 0.3,
          status: performanceScore >= 3.8 ? ObjectiveStatus.COMPLETED : 
                  performanceScore >= 3.2 ? ObjectiveStatus.IN_PROGRESS : 
                  ObjectiveStatus.NOT_STARTED,
        },
        {
          title: 'Recruitment Process Improvement',
          description: 'Reduce time-to-hire by 25% through process optimization',
          targetValue: '25% reduction in hiring time',
          weight: 0.25,
          status: performanceScore >= 3.5 ? ObjectiveStatus.COMPLETED : 
                  performanceScore >= 3.0 ? ObjectiveStatus.IN_PROGRESS : 
                  ObjectiveStatus.NOT_STARTED,
        },
        {
          title: 'Training and Development',
          description: 'Implement new onboarding program and professional development tracks',
          targetValue: '100% new hires completed',
          weight: 0.25,
          status: performanceScore >= 4.0 ? ObjectiveStatus.COMPLETED : 
                  performanceScore >= 3.3 ? ObjectiveStatus.IN_PROGRESS : 
                  ObjectiveStatus.NOT_STARTED,
        },
        {
          title: 'HR Analytics Dashboard',
          description: 'Create comprehensive HR metrics dashboard for management',
          targetValue: 'Dashboard deployed',
          weight: 0.2,
          status: performanceScore >= 3.8 ? ObjectiveStatus.COMPLETED : 
                  performanceScore >= 3.0 ? ObjectiveStatus.IN_PROGRESS : 
                  ObjectiveStatus.NOT_STARTED,
        }
      );
    } else {
      // Default objectives for other departments
      objectives.push(
        {
          title: 'Q1 Project Delivery',
          description: 'Complete all assigned Q1 projects on time and within budget',
          targetValue: '100% on-time delivery',
          weight: 0.4,
          status: performanceScore >= 3.5 ? ObjectiveStatus.COMPLETED : 
                  performanceScore >= 3.0 ? ObjectiveStatus.IN_PROGRESS : 
                  ObjectiveStatus.NOT_STARTED,
        },
        {
          title: 'Skill Development',
          description: 'Complete relevant professional training and certifications',
          targetValue: '2 training programs',
          weight: 0.3,
          status: performanceScore >= 3.8 ? ObjectiveStatus.COMPLETED : 
                  performanceScore >= 3.2 ? ObjectiveStatus.IN_PROGRESS : 
                  ObjectiveStatus.NOT_STARTED,
        },
        {
          title: 'Process Improvement',
          description: 'Identify and implement at least 2 process improvements',
          targetValue: '2 improvements implemented',
          weight: 0.3,
          status: performanceScore >= 3.5 ? ObjectiveStatus.COMPLETED : 
                  performanceScore >= 2.8 ? ObjectiveStatus.IN_PROGRESS : 
                  ObjectiveStatus.NOT_STARTED,
        }
      );
    }
    
    return objectives;
  };
  
  // Create objectives for evaluations
  for (let i = 0; i < Math.min(performanceEvaluations.length, 30); i++) {
    const evalData = performanceEvaluations[i];
    const employee = employees.find(e => e.id === evalData.employeeId);
    
    if (employee) {
      const objectives = getDepartmentObjectives(employee.department, evalData.score);
      
      for (const obj of objectives) {
        const employeeObjective = await prisma.employeeObjective.create({
          data: {
            evaluationId: evalData.id,
            title: obj.title,
            description: obj.description,
            targetValue: obj.targetValue,
            status: obj.status,
            weight: obj.weight,
          },
        });
        
        // Add progress updates for objectives that are in progress or completed
        if (obj.status !== ObjectiveStatus.NOT_STARTED) {
          const progressCount = obj.status === ObjectiveStatus.COMPLETED ? 3 : 
                              obj.status === ObjectiveStatus.IN_PROGRESS ? 2 : 1;
          
          for (let j = 0; j < progressCount; j++) {
            const progressRate = obj.status === ObjectiveStatus.COMPLETED ? 100 : 
                               obj.status === ObjectiveStatus.IN_PROGRESS ? 
                               faker.number.int({ min: 30, max: 80 }) : 0;
            
            await prisma.objectiveProgress.create({
              data: {
                objectiveId: employeeObjective.id,
                progressNote: faker.helpers.arrayElement([
                  'Made significant progress on key milestones',
                  'Completed initial research and planning phase',
                  'Successfully implemented core functionality',
                  'Addressed technical challenges and blockers',
                  'Received positive feedback from stakeholders',
                  'Final testing and validation completed',
                ]),
                progressRate: progressRate,
                updatedById: employee.id,
              },
            });
          }
        }
      }
    }
  }

  console.log('Created employee objectives with progress tracking');

  // H. Generate Final Scores and Rankings
  console.log('Calculating final scores and generating rankings...');
  
  // Get all performance evaluations with their related data
  const allEvaluations = await prisma.performanceEvaluation.findMany({
    where: { cycleId: q1Cycle.id },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          department: true,
          position: true,
        },
      },
      automaticScore: true,
      manualReview: true,
      selfReview: true,
      objectives: {
        include: {
          progress: true,
        },
      },
    },
  });

  // Calculate final scores and rankings
  const evaluationResults = allEvaluations.map(evaluation => {
    let finalScore = evaluation.finalScore || 0;
    let scoreBreakdown: any = {
      automatic: evaluation.automaticScore?.totalScore || 0,
      manual: evaluation.manualReview?.score || 0,
      self: evaluation.selfReview?.selfScore || 0,
    };

    // Calculate weighted final score (60% automatic, 30% manual, 10% self)
    if (evaluation.automaticScore && evaluation.manualReview?.score) {
      finalScore = (
        (evaluation.automaticScore.totalScore * 0.6) +
        (evaluation.manualReview.score * 0.3) +
        ((evaluation.selfReview?.selfScore || evaluation.automaticScore.totalScore) * 0.1)
      );
    } else if (evaluation.automaticScore) {
      finalScore = evaluation.automaticScore.totalScore;
    }

    // Calculate objective completion rate
    const completedObjectives = evaluation.objectives.filter(obj => 
      obj.status === ObjectiveStatus.COMPLETED
    ).length;
    const objectiveCompletionRate = evaluation.objectives.length > 0 
      ? (completedObjectives / evaluation.objectives.length) * 100 
      : 0;

    return {
      id: evaluation.id,
      employeeId: evaluation.employeeId,
      employee: evaluation.employee,
      finalScore: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
      scoreBreakdown,
      objectiveCompletionRate,
      objectiveCount: evaluation.objectives.length,
      completedObjectives,
    };
  });

  // Sort by final score to determine rankings
  evaluationResults.sort((a, b) => b.finalScore - a.finalScore);

  // Update evaluations with final scores and rankings
  for (let i = 0; i < evaluationResults.length; i++) {
    const result = evaluationResults[i];
    
    await prisma.performanceEvaluation.update({
      where: { id: result.id },
      data: {
        finalScore: result.finalScore,
        rank: i + 1, // Rankings start from 1
        status: EvaluationStatus.COMPLETED,
      },
    });
  }

  // Generate summary statistics
  const topPerformers = evaluationResults.slice(0, 5);
  const departmentStats = evaluationResults.reduce((acc, result) => {
    const dept = result.employee.department || 'Unknown';
    if (!acc[dept]) {
      acc[dept] = {
        count: 0,
        totalScore: 0,
        avgScore: 0,
      };
    }
    acc[dept].count++;
    acc[dept].totalScore += result.finalScore;
    acc[dept].avgScore = acc[dept].totalScore / acc[dept].count;
    return acc;
  }, {} as any);

  console.log('Final Performance Rankings Generated:');
  console.log('=====================================');
  
  console.log('\nTop 5 Performers:');
  topPerformers.forEach((result, index) => {
    console.log(`${index + 1}. ${result.employee.fullName} (${result.employee.department}) - Score: ${result.finalScore}`);
  });

  console.log('\nDepartment Averages:');
  Object.entries(departmentStats).forEach(([dept, stats]: [string, any]) => {
    console.log(`${dept}: ${stats.count} employees, Avg Score: ${stats.avgScore.toFixed(2)}`);
  });

  console.log(`\nTotal Evaluations Processed: ${evaluationResults.length}`);
  console.log('Generated final scores and rankings');

  // I. TECHCORP Q1 2024 PERFORMANCE REVIEW SUMMARY
  console.log('\n');
  console.log('=================================================');
  console.log('TECHCORP Q1 2024 QUARTERLY PERFORMANCE REVIEW');
  console.log('=================================================');
  console.log('Company Size: 150 employees across Engineering, Sales, and HR departments');
  console.log('Evaluation Period: January 1, 2024 - March 31, 2024');
  console.log('Evaluation Methodology: Weighted scoring system');
  console.log('- Automatic Scoring: 60% (Based on objective metrics and KPIs)');
  console.log('- Manager Evaluation: 30% (Subjective assessment and feedback)');
  console.log('- Self Evaluation: 10% (Employee self-assessment and reflection)');
  console.log('');
  console.log('Key Features Implemented:');
  console.log('✓ Comprehensive evaluation criteria with department-specific weights');
  console.log('✓ Automatic scoring based on performance metrics');
  console.log('✓ Manager evaluations with detailed feedback templates');
  console.log('✓ Employee self-evaluations with personal reflections');
  console.log('✓ SMART objectives with progress tracking');
  console.log('✓ Final score calculation and ranking system');
  console.log('✓ Department-level performance analytics');
  console.log('');
  console.log('Test Data Generated:');
  console.log(`✓ ${performanceEvaluations.length} performance evaluations`);
  console.log('✓ 6 evaluation criteria with weighted scoring');
  console.log('✓ Manager feedback for high, average, and low performers');
  console.log('✓ Self-evaluations with realistic employee perspectives');
  console.log('✓ Department-specific objectives (Engineering, Sales, HR)');
  console.log('✓ Progress tracking with milestone updates');
  console.log('✓ Final rankings and performance analytics');
  console.log('');
  console.log('API Testing Scenarios Supported:');
  console.log('1. GET /performance/evaluations - List all evaluations');
  console.log('2. GET /performance/evaluations/:id - Get specific evaluation details');
  console.log('3. POST /performance/evaluations - Create new evaluation');
  console.log('4. PUT /performance/evaluations/:id - Update evaluation');
  console.log('5. GET /performance/cycles - List evaluation cycles');
  console.log('6. GET /performance/criteria - List evaluation criteria');
  console.log('7. GET /performance/objectives - List employee objectives');
  console.log('8. POST /performance/objectives/:id/progress - Update objective progress');
  console.log('9. GET /performance/rankings - Get performance rankings');
  console.log('10. GET /performance/analytics - Get performance analytics');
  console.log('');
  console.log('Sample Test Cases:');
  console.log('- Retrieve top performers across the company');
  console.log('- Filter evaluations by department and score range');
  console.log('- Track objective completion rates by employee');
  console.log('- Compare manager vs self-evaluation scores');
  console.log('- Generate department performance reports');
  console.log('- Identify employees needing improvement plans');
  console.log('=================================================');
  console.log('TECHCORP PERFORMANCE REVIEW SCENARIO COMPLETE');
  console.log('=================================================');


  

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