// prisma/seed.ts
import { PrismaClient, Role, ContractType } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Define counts
const MANAGER_COUNT = 5;
const EMPLOYEE_COUNT = 45; // Total 50 users
const DEFAULT_PASSWORD = 'password123';

async function main() {
  console.log('Seeding database...');

  // 1. Hash the default password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, salt);

  // 2. Clean the database (idempotent seed)
  console.log('Cleaning existing data...');
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // 3. Define departments
  const departments = ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance'];

  // 4. Create Managers
  console.log(`Creating ${MANAGER_COUNT} managers...`);
  
  // We'll store manager profile IDs and their departments
  // to assign employees to them logically.
  const managers: { id: number; department: string }[] = [];

  for (let i = 0; i < MANAGER_COUNT; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;
    const email = faker.internet.email({
      firstName,
      lastName,
      provider: 'manager.local', // Differentiate emails
    });
    const department = departments[i % departments.length]; // Spread managers

    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        role: Role.MANAGER, // <-- Set manager role
        isActive: true,
        isEmailVerified: true,
        profile: {
          create: {
            fullName,
            department,
            position: faker.person.jobTitle(),
            contractType: ContractType.FULL_TIME,
            hireDate: faker.date.past({ years: 5 }),
            phone: faker.phone.number(),
            site: 'New York',
          },
        },
      },
      include: {
        profile: true, // <-- Must include profile to get its ID
      },
    });
    
    // Store the new profile ID and department
    if (user.profile && user.profile.department) {
      managers.push({ id: user.profile.id, department: user.profile.department });
    }
  }

  // 5. Create Employees
  console.log(`Creating ${EMPLOYEE_COUNT} employees...`);
  for (let i = 0; i < EMPLOYEE_COUNT; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;
    const email = faker.internet.email({
      firstName,
      lastName,
      provider: 'employee.local',
    });

    // Pick a random manager for this employee
    const randomManager = faker.helpers.arrayElement(managers);

    await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        role: Role.EMPLOYEE, // <-- Set employee role
        isActive: true,
        isEmailVerified: true,
        profile: {
          create: {
            fullName,
            department: randomManager.department, // Assign to manager's dept
            position: faker.person.jobTitle(),
            contractType: faker.helpers.arrayElement([
              ContractType.FULL_TIME,
              ContractType.PART_TIME,
              ContractType.CONTRACT,
            ]),
            hireDate: faker.date.past({ years: 3 }),
            phone: faker.phone.number(),
            site: faker.helpers.arrayElement(['New York', 'London', 'Remote']),
            managerId: randomManager.id, // <-- Assign managerId
          },
        },
      },
    });
  }

  console.log('---');
  console.log(`Database has been seeded with ${MANAGER_COUNT} managers and ${EMPLOYEE_COUNT} employees.`);
  console.log(`You can log in with any user email and the password: "${DEFAULT_PASSWORD}"`);
  console.log('Test the manager API with these manager profile IDs:');
  console.log(managers.map(m => `GET /manager/${m.id}/team`).join('\n'));
  console.log('---');
}

// Execute the main function
main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });