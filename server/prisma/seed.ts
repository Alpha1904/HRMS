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
  PostingStatus,
  ApplicationStatus,
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