import { Test, TestingModule } from '@nestjs/testing';
import { ShiftRequestController } from './shift-request.controller';

describe('ShiftRequestController', () => {
  let controller: ShiftRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShiftRequestController],
    }).compile();

    controller = module.get<ShiftRequestController>(ShiftRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
