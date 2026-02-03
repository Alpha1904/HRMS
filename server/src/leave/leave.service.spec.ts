import { Test, TestingModule } from '@nestjs/testing';
import { LeaveService } from './leave.service';

describe('LeaveService', () => {
  let service: LeaveService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeaveService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get<LeaveService>(LeaveService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
