import { Test, TestingModule } from '@nestjs/testing';
import { RankingService } from './ranking.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PerformanceAuditService } from './performance-audit.service';

describe('RankingService', () => {
  let service: RankingService;
  let module: TestingModule;

  const prisma = {
    evaluationCycle: {
      findUnique: jest.fn(),
    },
    performanceEvaluation: {
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  const audit = {
    log: jest.fn(),
  } as unknown as PerformanceAuditService;

  beforeEach(async () => {
    jest.clearAllMocks();

    (prisma.$transaction as any).mockImplementation(async (cb: any) => cb(prisma));

    module = await Test.createTestingModule({
      providers: [
        RankingService,
        { provide: PrismaService, useValue: prisma },
        { provide: PerformanceAuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<RankingService>(RankingService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('ranks with ties (same rank, skip next rank)', async () => {
    (prisma.evaluationCycle.findUnique as any).mockResolvedValue({ id: 1, deletedAt: null, tenantId: null });

    (prisma.performanceEvaluation.findMany as any).mockResolvedValue([
      { id: 1, finalScore: 90 },
      { id: 2, finalScore: 90 },
      { id: 3, finalScore: 80 },
      { id: 4, finalScore: 70 },
    ]);

    const updates: any[] = [];
    (prisma.performanceEvaluation.update as any).mockImplementation(async ({ where, data }: any) => {
      updates.push({ id: where.id, rank: data.rank });
      return { id: where.id, rank: data.rank };
    });

    const result = await service.rankEmployeesByCycle(1, { performedById: 1 }, {});

    expect(result.count).toBe(4);
    expect(updates).toEqual([
      { id: 1, rank: 1 },
      { id: 2, rank: 1 },
      { id: 3, rank: 3 },
      { id: 4, rank: 4 },
    ]);
  });

  it('calculates percentile correctly', async () => {
    (prisma.performanceEvaluation.findUnique as any).mockResolvedValue({
      rank: 2,
      finalScore: 88,
      status: 'COMPLETED',
      tenantId: null,
    });

    (prisma.performanceEvaluation.count as any).mockResolvedValue(5);

    const result = await service.getEmployeeRank(10, 1, {});

    expect(result.totalEmployees).toBe(5);
    expect(result.rank).toBe(2);
    expect(result.percentile).toBeCloseTo(((5 - 2 + 1) / 5) * 100);
  });
});
