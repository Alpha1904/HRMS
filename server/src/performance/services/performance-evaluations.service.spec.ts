import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceEvaluationsService } from './performance-evaluations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PerformanceAuditService } from './performance-audit.service';

describe('PerformanceEvaluationsService', () => {
  let service: PerformanceEvaluationsService;
  let module: TestingModule;

  const prisma = {
    performanceEvaluation: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    profile: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    evaluationCycle: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  const audit = {
    log: jest.fn(),
  } as unknown as PerformanceAuditService;

  beforeEach(async () => {
    jest.clearAllMocks();

    module = await Test.createTestingModule({
      providers: [
        PerformanceEvaluationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PerformanceAuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<PerformanceEvaluationsService>(PerformanceEvaluationsService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('calculates final score using default weights', async () => {
    (prisma.performanceEvaluation.findUnique as any).mockResolvedValue({
      id: 1,
      tenantId: null,
      automaticScore: { totalScore: 91.2 },
      manualReview: { score: 88 },
      selfReview: { selfScore: 85 },
    });

    (prisma.performanceEvaluation.update as any).mockResolvedValue({ id: 1, finalScore: 88.92 });

    const res = await service.calculateFinalScore(1, { performedById: 1 }, {});

    expect(res.finalScore).toBeCloseTo(89.62);
    expect(res.formula).toContain('0.6');
  });

  it('requires automatic score for final score', async () => {
    (prisma.performanceEvaluation.findUnique as any).mockResolvedValue({
      id: 1,
      tenantId: null,
      automaticScore: null,
      manualReview: null,
      selfReview: null,
    });

    await expect(service.calculateFinalScore(1, { performedById: 1 }, {})).rejects.toMatchObject({
      status: 400,
    });
  });
});
