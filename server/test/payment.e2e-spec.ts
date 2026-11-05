import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Role } from '@prisma/client';
import { PaymentController } from '../src/payment/payment.controller';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { CompensationService } from '../src/payment/services/compensation.service';
import { AdjustmentService } from '../src/payment/services/adjustment.service';
import { PayslipService } from '../src/payment/services/payslip.service';

class MockJwtAuthGuard {
  canActivate(context: any) {
    const req = context.switchToHttp().getRequest();
    req.user = {
      id: 1,
      email: 'admin@test.local',
      role: Role.SYSTEM_ADMIN,
    };
    return true;
  }
}

class MockRolesGuard {
  canActivate() {
    return true;
  }
}

describe('PaymentModule (e2e)', () => {
  let app: INestApplication;

  const compensation = {
    create: jest.fn(),
    findByProfile: jest.fn(),
  } as unknown as CompensationService;

  const adjustments = {
    create: jest.fn(),
    findByProfile: jest.fn(),
  } as unknown as AdjustmentService;

  const payslips = {
    generate: jest.fn(),
    getPayslip: jest.fn(),
    downloadPayslip: jest.fn(),
  } as unknown as PayslipService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        { provide: CompensationService, useValue: compensation },
        { provide: AdjustmentService, useValue: adjustments },
        { provide: PayslipService, useValue: payslips },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(MockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/payment/compensation returns 400 for invalid amount', async () => {
    await request(app.getHttpServer())
      .post('/api/payment/compensation')
      .send({
        profileId: 1,
        type: 'BASE_SALARY',
        amount: 0,
        startDate: '2026-02-01T00:00:00.000Z',
      })
      .expect(400);
  });

  it('POST /api/payment/compensation returns 201 for valid body', async () => {
    (compensation.create as any).mockResolvedValue({
      id: 1,
      profileId: 10,
      type: 'BASE_SALARY',
      amount: '2500.00',
      frequency: 'MONTHLY',
      startDate: '2026-02-01T00:00:00.000Z',
      active: true,
    });

    await request(app.getHttpServer())
      .post('/api/payment/compensation')
      .send({
        profileId: 10,
        type: 'BASE_SALARY',
        amount: 2500,
        frequency: 'MONTHLY',
        startDate: '2026-02-01T00:00:00.000Z',
      })
      .expect(201);

    expect(compensation.create).toHaveBeenCalled();
  });
});
