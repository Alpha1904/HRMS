import { Test, TestingModule } from '@nestjs/testing';
import { ShiftRequestService } from './shift-request.service';

describe('ShiftRequestService', () => {
  let service: ShiftRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShiftRequestService],
    }).compile();

    service = module.get<ShiftRequestService>(ShiftRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
