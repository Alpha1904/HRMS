import { Test, TestingModule } from '@nestjs/testing';
import { LeaveController } from './leave.controller';

describe('LeaveController', () => {
  let controller: LeaveController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaveController],
    })
      .useMocker(() => ({}))
      .compile();

    controller = module.get<LeaveController>(LeaveController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
