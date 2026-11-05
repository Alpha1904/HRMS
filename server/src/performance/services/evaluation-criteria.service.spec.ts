import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationCriteriaService } from './evaluation-criteria.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PerformanceAuditService } from './performance-audit.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('EvaluationCriteriaService', () => {
  let service: EvaluationCriteriaService;
  let module: TestingModule;

  const prisma = {
    evaluationCriteria: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as PrismaService;

  const audit = {
    log: jest.fn(),
  } as unknown as PerformanceAuditService;

  const cache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    module = await Test.createTestingModule({
      providers: [
        EvaluationCriteriaService,
        { provide: PrismaService, useValue: prisma },
        { provide: PerformanceAuditService, useValue: audit },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = module.get<EvaluationCriteriaService>(EvaluationCriteriaService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('caches criteria list', async () => {
    (cache.get as any).mockResolvedValue(undefined);
    (prisma.evaluationCriteria.findMany as any).mockResolvedValue([{ id: 1, name: 'attendance' }]);

    const res = await service.getCriteria({ isActive: true, tenantId: 't1' });

    expect(res).toEqual([{ id: 1, name: 'attendance' }]);
    expect(cache.set).toHaveBeenCalled();
  });

  it('throws if active weights do not sum to 1.0', async () => {
    (prisma.evaluationCriteria.aggregate as any).mockResolvedValue({ _sum: { weight: 0.9 } });

    await expect(service.assertWeightsSumToOneOrThrow('t1')).rejects.toMatchObject({
      status: 400,
    });
  });

  it('throws if active weights exceed 1.0 on create', async () => {
    (prisma.evaluationCriteria.create as any).mockResolvedValue({ id: 1, tenantId: 't1' });
    (prisma.evaluationCriteria.aggregate as any).mockResolvedValue({ _sum: { weight: 1.2 } });

    await expect(
      service.createCriteria(
        { name: 'attendance', weight: 0.3 },
        { performedById: 1 },
        { tenantId: 't1' },
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
});
