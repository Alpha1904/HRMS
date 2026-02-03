import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, Frequency } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentAuditService } from './payment-audit.service';
import { PayslipService } from './payslip.service';

describe('PayslipService', () => {
  let service: PayslipService;

  const prisma = {} as unknown as PrismaService;

  const config = {
    get: jest.fn(),
  } as unknown as ConfigService;

  const audit = {
    log: jest.fn(),
  } as unknown as PaymentAuditService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayslipService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
        { provide: PaymentAuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<PayslipService>(PayslipService);
  });

  it('applies ANNUAL frequency as amount/12', () => {
    const monthStart = new Date(Date.UTC(2026, 1, 1));
    const monthEnd = new Date(Date.UTC(2026, 1, 28, 23, 59, 59, 999));

    const component: any = {
      frequency: Frequency.ANNUAL,
      amount: new Prisma.Decimal(1200),
      startDate: monthStart,
    };

    const result = (service as any).frequencyAmount(component, monthStart, monthEnd);
    expect(result.toNumber()).toBeCloseTo(100);
  });

  it('includes QUARTERLY only when month is in same quarter as startDate', () => {
    const q1MonthStart = new Date(Date.UTC(2026, 1, 1));
    const q1MonthEnd = new Date(Date.UTC(2026, 1, 28, 23, 59, 59, 999));

    const q2MonthStart = new Date(Date.UTC(2026, 3, 1));
    const q2MonthEnd = new Date(Date.UTC(2026, 3, 30, 23, 59, 59, 999));

    const component: any = {
      frequency: Frequency.QUARTERLY,
      amount: new Prisma.Decimal(3000),
      startDate: new Date(Date.UTC(2026, 0, 15)),
    };

    const inQuarter = (service as any).frequencyAmount(component, q1MonthStart, q1MonthEnd);
    expect(inQuarter.toNumber()).toBeCloseTo(1000);

    const outQuarter = (service as any).frequencyAmount(component, q2MonthStart, q2MonthEnd);
    expect(outQuarter.toNumber()).toBeCloseTo(0);
  });

  it('includes ONE_TIME only when startDate is within the month', () => {
    const monthStart = new Date(Date.UTC(2026, 1, 1));
    const monthEnd = new Date(Date.UTC(2026, 1, 28, 23, 59, 59, 999));

    const within: any = {
      frequency: Frequency.ONE_TIME,
      amount: new Prisma.Decimal(500),
      startDate: new Date(Date.UTC(2026, 1, 10)),
    };

    const outside: any = {
      frequency: Frequency.ONE_TIME,
      amount: new Prisma.Decimal(500),
      startDate: new Date(Date.UTC(2026, 0, 31)),
    };

    const r1 = (service as any).frequencyAmount(within, monthStart, monthEnd);
    expect(r1.toNumber()).toBeCloseTo(500);

    const r2 = (service as any).frequencyAmount(outside, monthStart, monthEnd);
    expect(r2.toNumber()).toBeCloseTo(0);
  });
});
